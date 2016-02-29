var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var worker = require('child_process');



//计算cpu和内存的使用率
var sysstat = function(callback){
  //cpu当前使用率
  var cpu ="sar -u 1 1 | grep Average | awk '{print $8}'";
  //当前内存用量
  var mem ="sar -r 1 1 | grep Average | awk '{print $4}'";
  worker.exec(cpu, function (error1, stdout1, stderr1) {
    worker.exec(mem, function (error2, stdout2, stderr2) {
      //console.log('CPU: ' + stdout1+',MEM: ' + stdout2);
      callback({cpu:stdout1,mem:stdout2});
    });
  });
};



//WebSocket连接监听
io.on('connection', function(socket){
  //socket.emit('open');//通知客户端已连接

  function send(obj){
    var sys = {
      time:(new Date()).getTime(),
      cpu:(100-parseFloat(obj.cpu)),
      mem:parseFloat(obj.mem)
    }
    //发送给客户端数据
    socket.emit('system', sys);
  }

  //每一秒推送一次给客户端
  setInterval(function(){
    sysstat(send);
  },1000);

  // 对message事件的监听
  socket.on('message', function(msg){
  });

  //监听出退事件
  socket.on('disconnect', function () {
    console.log('user disconnected');
  });


});
http.listen(3000, function(){
  console.log('listening on *:3000');
});

//加载首页
app.get('/', function(req, res){
  res.render('alert');
});



// 设置视图模板
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



// 捕获404页面和错误的路径
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

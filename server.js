/**
 * 直接转发端口数据到某主机
 */

var net = require('net');
var randomstring = require('random-string');

var HOST = '127.0.0.1';
var PORT = 3001; // be-tunnel使用的端口
var P = 3000; // 外部访问的端口

var connects = []; // 保存链接

// 创建一个TCP服务器实例，调用listen函数开始监听指定端口
// 传入net.createServer()的回调函数将作为”connection“事件的处理函数
// 在每一个“connection”事件中，该回调函数接收到的socket对象是唯一的
net.createServer(function(sock) {

    net.createServer(function(s) {
        // 转发用户的请求
        console.log('客户端链接: ' + s.remoteAddress + ':' + s.remotePort);

        if (!sock) {
            s.destroy();
            return;
        }

        // 保存socket链接
        var id = randomstring(8);
        connects[id] = s;

        // 发送open通知
        sock && sock.writable && sock.write(JSON.stringify({ 'id': id, 'action': 'open' }));

        // 关闭时清除链接
        s.on('close', function() {
            console.log('客户端断开链接!');
            sock && sock.writable && sock.write(JSON.stringify({ 'id': id, 'action': 'close' }));
        });
        // 收到数据时转发
        s.on('data', function(d) {
            // console.log('从客户端接受到数据');
            console.log('.');
            sock && sock.writable && sock.write(JSON.stringify({ 'id': id, 'action': 'data', 'data': d.toString("base64") }));
        });

    }).listen(P, HOST);


    ///////////////////////////////////////////////////
    console.log('CLIENT CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    // 为这个socket实例添加一个"data"事件处理函数
    sock.on('data', function(data) {
        // console.log('从be-tunnel收到数据: ' + data.length + ' byte');
        // 收到be-tunnel客户端数据，回转给客户端
        var data = JSON.parse(data);
        var d = new Buffer(data.data, 'base64');
        var s = connects[data.id];
        s.write(d);
    });

    // 为这个socket实例添加一个"close"事件处理函数
    sock.on('close', function(data) {
        console.log('be-tunnel客户端断开');
        for(var id in connects){
            connects[id].destroy();
        }
        connects = [];
    });

}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);

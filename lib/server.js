/**
 * be-tunnel server site
 */

var net = require('net');
var randomstring = require('random-string');
var parseData = require('./parse-data');

module.exports = function createServer(tunnel_host, tunnel_port) {

    var connects = []; // 保存be-bunnel客户端链接, connects[id].clients 保存客户连接
    
    tunnel_host = tunnel_host || '127.0.0.1';
    tunnel_port = tunnel_port || 2121;

    console.log('Server listening on ' + tunnel_host +':'+ tunnel_port);

    // 启动be-tunnel服务
    net.createServer(function(sock) {

        console.log('CLIENT CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

        var tunnelClientId = randomstring(8); // tunnel client id

        sock.on('data', function(buffer) {
            var objectArray = parseData.parseBuffer(buffer);
            for (var i = 0; i < objectArray.length; i++) {
                // 遍历处理所有数据包
                handleOneObject(sock, tunnelClientId, objectArray[i]);
            }
        });

        // 为这个socket实例添加一个"close"事件处理函数
        sock.on('close', function() {
            var s = connects[tunnelClientId];
            if (s) {
                console.log('be-tunnel客户端断开 PORT: ', s.config.publicPort);
                // 清理所有client链接
                for(var id in s.clients) {
                    s.clients[id].destroy();
                    delete s.clients[id];
                }

                // 销毁客户端服务器
                s.server.close();
                delete connects[tunnelClientId];
            }
        });

    }).listen(tunnel_port, tunnel_host);


    function handleOneObject(sock, tunnelClientId, object) {
        switch(object.action) {
            case parseData.type.register: { // 收到注册指令
                startService(sock, tunnelClientId, object);
                break;
            }
            case parseData.type.data: { // 转发数据包
                // 收到be-tunnel客户端数据，回转给客户端
                var s = connects[tunnelClientId].clients[object.id];
                s && s.writable && s.write(object.data);
                break;
            }
        }
    }

    function cleanConnectsWithServerName(name) {
        // TODO : 
    }


    // 指定配置，创建一个服务端口
    function startService(sock, tunnelClientId, object) {

        var server_host = object.data.publicHost;
        var server_port = object.data.publicPort;

        // 判断端口是否有占用
        for(var id in connects){
            var tunnelClient = connects[id];
            if (tunnelClient.config.publicPort === object.data.publicPort) {
                console.log('❌be-tunnel重复链接');
                // TODO : 响应客户端
                sock.destroy();
                return;
            }
        }

        connects[tunnelClientId] = {
            socket : sock,
            clients: [],
            config : object.data,
            server : net.createServer(function(s) {
                // 转发用户的请求
                console.log('客户端链接: ' + s.remoteAddress + ':' + s.remotePort);

                if (!sock) {
                    s.destroy();
                    return;
                }

                // 保存socket链接
                var id = randomstring(8);
                connects[tunnelClientId].clients[id] = s;

                // 发送open通知
                sock && sock.writable && sock.write(parseData.createBuffer(id, parseData.type.open));

                // 关闭时清除链接
                s.on('close', function() {
                    console.log('客户端断开链接!');
                    sock && sock.writable && sock.write(parseData.createBuffer(id, parseData.type.close));
                });
                // 收到数据时转发
                s.on('data', function(d) {
                    // console.log('从客户端接受到数据');
                    process.stdout.write('.');
                    sock && sock.writable && sock.write(parseData.createBuffer(id, parseData.type.data, d));
                });
            }).listen(server_port, server_host)
        };
    }

}

/**
 * be-tunnel client site
 */

var net = require('net');
var parseData = require('./parse-data');


module.exports = function createClient(tunnel_host, tunnel_port, backend_host, backend_port) {

    tunnel_host = tunnel_host || '127.0.0.1';
    tunnel_port = tunnel_port || 2121;
    backend_host = backend_host || '127.0.0.1';
    backend_port = backend_port || 80;

    var client = new net.Socket();
    var target = []; // target socket
    client.connect(tunnel_port, tunnel_host, function() {

        console.log('CONNECTED TO be-tunnel SERVER: ' + tunnel_host + ':' + tunnel_port);

        // 为客户端添加“data”事件处理函数
        // data是服务器发回的数据
        client.on('data', function(buffer) {

            var objectArray = parseData.parseBuffer(buffer);
            for (var i = 0; i < objectArray.length; i++) {
                // 遍历处理所有数据包
                handleOnObject(objectArray[i]);
            }
        });

        // 为客户端添加“close”事件处理函数
        client.on('close', function() {
            console.log('Connection closed');
            for(var id in target){
                target[id].destroy();
            }
            target = [];
        });

    });


    // 处理一个数据包
    var handleOnObject = function handleOnObject(data) {
        var id = data.id;
        switch (data.action) {
            case parseData.type.open: {
                /*
                    data.action = 'open'
                    data.id = xxx
                */
                console.log('收到连接通知：' + data.id);
                var s = new net.Socket();
                target[id] = s;
                s.connect(backend_port, backend_host, function() {
                    s.on('close', function() {
                        console.log('连接关闭: ' + id);
                        s.destroy();
                        delete target[id];
                    });
                    s.on('data', function(d) {
                        // 收到目标服务反回的数据
                        // console.log('收到目标服务反回的数据');
                        process.stdout.write('.');
                        client.write(parseData.createBuffer(id, parseData.type.data, d));
                    });
                });
                break;
            }
            case parseData.type.close: {
                /*
                    data.action = 'close'
                    data.id = xxx
                */
                var s = target[id];
                if (s) {
                    s.destroy();
                    delete target[id];
                }
                break;
            }
            case parseData.type.data: {
                /*
                    data.action = 'data'
                    data.id = xxx
                    data.data
                */
                var s = target[id];
                if (s) {
                    var d = new Buffer(data.data, 'base64');
                    s.write(d);
                }
                break;
            }
        }
    }
}
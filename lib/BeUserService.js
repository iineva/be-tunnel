/**
 * be-tunnel user service
 */

let net = require('net');

module.exports = class BeUserService {

  constructor(config) {

    this.userId      = 0;
    this.userSockets = [];

    // set default configs
    config.service_port = config.service_port || 80;
    config.service_host = config.service_host || '0.0.0.0';
    this.config  = config;
  }

  createUserId() {
    this.userId++;
    if (this.userId > 4294967295) {
      this.userId = 0;
    }
    if (this.userSockets[this.userId]) {
      return this.createUserId();
    }
    return this.userId;
  }

  start() {
    
    console.log('START SERVER WITH CONFIG: ' + this.config.service_host + ':' + this.config.service_port);

    let self = this;
    
    self.socket = net.createServer(function(socket) {

      // 用户链接用户服务
      console.log('USER SERVICE CONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);

      let id = self.createUserId();
      self.userSockets[id] = socket;
 
      if (self.config.onConnected) {
        // 链接时，外部代理产生用户ID
        self.config.onConnected(id);
      }

      socket.on('close', function() {
        console.log('USER SERVICE DISCONNECTED!');
        delete self.userSockets[id];
        if (self.config.onClose) {
          // 使用ID通知代理关闭链接
          self.config.onClose(id);
        }
      });

      socket.on('data', function(data) {
        if (self.config.onData && id) {
          self.config.onData(id, data);
        }
      });

    }).listen(this.config.service_port, this.config.service_host);
  }

  close() {
    let self = this;
    for(let id in self.userSockets) {
      self.userSockets[id].destroy();
    }
    self.userSockets = [];

    self.socket.close(function(argument) {
      console.log('USER SERVICE CLOSE! : ' + self.config.service_host + ':' + self.config.service_port);
    });
  }

  write(userId, data) {
    let userSocket = this.userSockets[userId];
    userSocket && userSocket.writable && userSocket.write(data);
  }

}
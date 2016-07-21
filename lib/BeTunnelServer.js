/**
 * be-tunnel server
 */
let net = require('net');
let Frame = require('./Frame');
let FrameBuffer = require('./FrameBuffer');
let BeUserService = require('./BeUserService');

module.exports = class BeTunnelServer {

  constructor(config) {

    // init
    this.clientId   = 0;
    this.clients    = [];
    this.service    = [];
    this.buffer     = new FrameBuffer();
    
    // set default config
    config.tunnel_host = config.tunnel_host || '0.0.0.0';
    config.tunnel_port = config.tunnel_port || 2121;
    this.config        = config;
  }

  // write data to socket
  write(socket, data) {
    socket && socket.writable && socket.write(data)
  }

  createClientId() {
    this.clientId++;
    if (this.clientId > 4294967295) {
      this.clientId = 0;
    }
    if (this.clients[this.clientId]) {
      return this.createClientId();
    }
    return this.clientId;
  }

  start() {

    let self = this;

    console.log('SERVER LIETENING ON ' + self.config.tunnel_host +':'+ self.config.tunnel_port);

    net.createServer(function(socket) {

      console.log('CLIENT CONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);
      
      let clientId = self.createClientId();

      socket.on('data', function(buffer) {
        socket.pause();
        self.onData(clientId, socket, buffer);
        socket.resume();
      });

      socket.on('close', function() {
        self.onClose(clientId);
      });

    }).listen(this.config.tunnel_port, this.config.tunnel_host);
  }

  // 协议层接收到数据
  onData(clientId, clientSocket, buffer) {
    let self = this;
    self.buffer.addBuffer(buffer);
    let frames = self.buffer.getFrames();
    for (let i = 0; i < frames.length; i++) {
      // 遍历处理所有数据包
      let frame = frames[i];
      switch(frame.type) {
        case Frame.Type.register: {
          let config = {
            clientId: clientId,
            service_host: frame.data.service_host,
            service_port: frame.data.service_port,
            onConnected: function(userId) {
              let f = new Frame(Frame.Type.open, clientId, userId);
              self.write(clientSocket, f.buffer);
            },
            onClose: function(userId) {
              let f = new Frame(Frame.Type.close, clientId, userId);
              self.write(clientSocket, f.buffer);
            },
            onData: function(userId, data) {
              let f = new Frame(Frame.Type.data, clientId, userId, data);
              self.write(clientSocket, f.buffer);
            }
          };

          // start service
          let service = new BeUserService(config);
          self.clients[clientId] = service;
          service.start();
          break;
        }
        case Frame.Type.data: {
          // recive client data
          process.stdout.write('.');
          let service = self.clients[frame.clientId];
          if (service) {
            service.write(frame.userId, frame.data);
          }
          break;
        }
      }
    }
  }

  onClose(clientId) {
    let service = this.clients[clientId];
    if (service) {
      service.close();
    }
    delete this.clients[clientId];
  }

}
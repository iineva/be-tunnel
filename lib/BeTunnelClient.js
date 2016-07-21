/**
 * be-tunnel client
 */
let net = require('net');
let Frame = require('./Frame');
let FrameBuffer = require('./FrameBuffer');

module.exports = class BeTunnelClient {

  constructor(config) {

    // set default config
    config.tunnel_host  = config.tunnel_host || '127.0.0.1';
    config.tunnel_port  = config.tunnel_port || 2121;
    config.backend_host = config.backend_host || '127.0.0.1';
    config.backend_port = config.backend_port || 80;

    this.config   = config;
    this.buffer   = new FrameBuffer();
    this.backends = [];

    this.socketWriting = false;
    this.socketBuffer = [];
  }

  start() {

    let self = this;
    self.socket = new net.Socket();
    
    self.socket.connect(self.config.tunnel_port, self.config.tunnel_host, function() {
      console.log('CLIENT CONNECTED TO be-tunnel SERVER: ' + self.config.tunnel_host + ':' + self.config.tunnel_port);
      // send register Frame
      self.register();
    });

    // on data
    self.socket.on('data', function(buffer) {
      self.socket.pause();
      self.onData(buffer);
      self.socket.resume();
    });

    // on close
    self.socket.on('close', function() {
      self.onClose();
    });

    // on error
    self.socket.on('error', function(err) {
      console.log('CLIENT ERROR :', err);
    });
  }

  // write data to socket
  write(socket, data, callback = function(){}) {
    socket && socket.writable && socket.write(data, callback);
  }

  writeSelfSocket(data) {

    let self = this;

    if (self.socketWriting) {
      self.socketBuffer.push(data);
    }

    self.socketWriting = true;
    self.write(self.socket, data, function(err) {
      self.socketWriting = false;
      if (self.socketBuffer.length > 0) {
        let d = self.socketBuffer[0];
        self.socketBuffer = self.socketBuffer.slice(1, self.socketBuffer.length);
        self.writeSelfSocket(d);
      }
    });
  }

  // send register Frame
  register() {
    let f = new Frame(Frame.Type.register, {
      service_name: this.config.service_name,
      service_port: this.config.service_port,
      service_host: this.config.service_host,
      backend_port: this.config.backend_port,
      backend_host: this.config.backend_host,
    });
    this.write(this.socket, f.buffer);
  }

  onData(buffer) {
    let self = this;
    self.buffer.addBuffer(buffer);
    let frames = self.buffer.getFrames();
    for (let i = 0; i < frames.length; i++) {
      // 遍历处理所有数据包
      let frame = frames[i];
      switch (frame.type) {
        case Frame.Type.open: { // open from server
          
          console.log('CLIENT GET USER OPEN ： clientId: ' + frame.clientId + ' , userId: ' + frame.userId);
          
          let socket = new net.Socket();
          self.backends[frame.userId] = socket;
          socket.connect(self.config.backend_port, self.config.backend_host, function() {
            socket.on('close', function() {
              console.log('CLIENT BEACKEND CLOSE!');
              let f = new Frame(Frame.Type.close, frame.clientId, frame.userId);
              self.writeSelfSocket(f.buffer);
            });
            socket.on('data', function(buffer){
              socket.pause();
              let f = new Frame(Frame.Type.data, frame.clientId, frame.userId, buffer);
              self.writeSelfSocket(f.buffer);
              socket.resume();
            });
          });
          break;
        }
        case Frame.Type.close: { // close from server
          console.log('CLIENT GET USER CLOSE!');
          let socket = self.backends[frame.userId];
          if (socket) {
            socket.destroy();
            delete self.backends[frame.userId];
          }
          break;
        }
        case Frame.Type.data: { // data from server
          // console.log('CLIENT GET USER DATA!');
          process.stdout.write('.');
          let socket = self.backends[frame.userId];
          if (socket) {
            self.write(socket, frame.data);
          }
          break;
        }
      }
    }
  }

  onClose() {
    console.log('CLIENT be-tunnel SOCKET CLOSTED!');
    for(var userId in this.backends) {
      this.backends[userId].destroy();
    }
    this.backends = [];
  }

}
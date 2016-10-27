var tunnel = require('./tunnel')

var remoteHost = process.env.SERVER
var listen = process.env.LISTEN
var forward = process.env.FORWARD
var tunnels = []

if (!remoteHost) {
  console.error('Plase set SERVER')
  process.exit(-1)
}
if (!listen) {
  console.error('Plase set LISTEN')
  process.exit(-1)
}
if (!forward) {
  console.error('Plase set FORWARD')
  process.exit(-1)
}

console.log('connect to server ', remoteHost)
console.log('listen: ', listen)
console.log('forward: ', forward)

tunnel.createTunnel(remoteHost, listen, forward, function(err, server) {
  if (err) {
    console.error(String(err))
  } else {
    var id = tunnels.push(server)
    console.log('Tunnel created with id: ' + id)
  }
})
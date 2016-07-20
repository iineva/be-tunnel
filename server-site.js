const program = require('commander');
const BeTunnelServer = require('./lib/BeTunnelServer');
// var server = require('./lib/server');

program
  .version('0.0.1')
  .option('-t, --tunnel-host <string>', 'tunnel host [0.0.0.0]', process.env.TUNNEL_HOST || '0.0.0.0')
  .option('-p, --tunnel-port <number>', 'tunnel port [2121]', process.env.TUNNEL_PORT || 2121)
  .parse(process.argv);


// 启动服务
let server = new BeTunnelServer({
  tunnel_host: program.tunnelHost,
  tunnel_port: program.tunnelPort
});
server.start();
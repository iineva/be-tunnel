var program = require('commander');
var server = require('./lib/server');

program
  .version('0.0.1')
  .option('-t, --tunnel-host <string>', 'tunnel host [0.0.0.0]', process.env.NODE_ENV.TUNNEL_HOST || '0.0.0.0')
  .option('-p, --tunnel-port <number>', 'tunnel port [2121]', process.env.NODE_ENV.TUNNEL_PORT || 2121)
  .parse(process.argv);


// 启动服务
server(program.tunnelHost, program.tunnelPort);
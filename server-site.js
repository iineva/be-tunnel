var program = require('commander');
var server = require('./lib/server');

program
  .version('0.0.1')
  .option('-H, --tunnel-host <string>', 'tunnel host [127.0.0.1]', '127.0.0.1')
  .option('-P, --tunnel-port <number>', 'tunnel port [2121]', 2121)
  .option('-h, --server-host <string>', 'server host [127.0.0.1]', '127.0.0.1')
  .option('-p, --server-port <number>', 'server port [80]', 80)
  .parse(process.argv);


// 启动服务
server(program.tunnelHost, program.tunnelPort, program.serverHost, program.serverPort);
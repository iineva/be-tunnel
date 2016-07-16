var program = require('commander');
var client = require('./lib/client');


program
  .version('0.0.1')
  .option('-H, --tunnel-host <string>', 'tunnel host [127.0.0.1]', '127.0.0.1')
  .option('-P, --tunnel-port <number>', 'tunnel port [2121]', 2121)
  .option('-h, --backend-host <string>', 'backend host [127.0.0.1]', '127.0.0.1')
  .option('-p, --backend-port <number>', 'backend port [80]', 80)
  .parse(process.argv);


// 启动服务
client(program.tunnelHost, program.tunnelPort, program.backendHost, program.backendPort);
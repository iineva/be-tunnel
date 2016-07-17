var program = require('commander');
var client = require('./lib/client');


program
  .version('0.0.1')
  .option('-t, --tunnel-host <string>', 'tunnel host [127.0.0.1]', '127.0.0.1')
  .option('-p, --tunnel-port <number>', 'tunnel port [2121]', 2121)
  .option('-b, --backend-host <string>', 'backend host [127.0.0.1]', '127.0.0.1')
  .option('-q, --backend-port <number>', 'backend port [80]', 80)
  .option('-s, --public-host <string>', 'public host [0.0.0.0]', '0.0.0.0')
  .option('-w, --public-port <number>', 'public port [80]', 80)
  .option('-n, --service-name <string>', 'service name [client]', 'client')
  .parse(process.argv);


// 启动服务
client({
    tunnelHost: program.tunnelHost,
    tunnelPort: program.tunnelPort,
    backendHost: program.backendHost,
    backendPort: program.backendPort,
    publicHost: program.publicHost,
    publicPort: program.publicPort,
    serviceName: program.serviceName,
});
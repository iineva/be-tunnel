var program = require('commander');
var client = require('./lib/client');


program
  .version('0.0.1')
  .option('-t, --tunnel-host <string>', 'tunnel host [127.0.0.1]', process.env.NODE_ENV.TUNNEL_HOST || '127.0.0.1')
  .option('-p, --tunnel-port <number>', 'tunnel port [2121]', process.env.NODE_ENV.TUNNEL_PORT || 2121)
  .option('-b, --backend-host <string>', 'backend host [127.0.0.1]', process.env.NODE_ENV.BACKEND_HOST || '127.0.0.1')
  .option('-q, --backend-port <number>', 'backend port [80]', process.env.NODE_ENV.BACKEND_PORT || 80)
  .option('-s, --public-host <string>', 'public host [0.0.0.0]', process.env.NODE_ENV.PUBLIC_HOST || '0.0.0.0')
  .option('-w, --public-port <number>', 'public port [80]', process.env.NODE_ENV.PUBLIC_PORT || 80)
  .option('-n, --service-name <string>', 'service name [client]', process.env.NODE_ENV.SERVICE_NAME || 'client')
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
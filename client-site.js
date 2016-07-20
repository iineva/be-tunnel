const program = require('commander');
const BeTunnelClient = require('./lib/BeTunnelClient');

program
  .version('0.0.1')
  .option('-t, --tunnel-host <string>', 'tunnel host [127.0.0.1]', process.env.TUNNEL_HOST || '127.0.0.1')
  .option('-p, --tunnel-port <number>', 'tunnel port [2121]', process.env.TUNNEL_PORT || 2121)
  .option('-b, --backend-host <string>', 'backend host [127.0.0.1]', process.env.BACKEND_HOST || '127.0.0.1')
  .option('-q, --backend-port <number>', 'backend port [80]', process.env.BACKEND_PORT || 80)
  .option('-s, --service-host <string>', 'service host [0.0.0.0]', process.env.SERVICE_HOST || '0.0.0.0')
  .option('-w, --service-port <number>', 'service port [80]', process.env.SERVICE_PORT || 80)
  .option('-n, --service-name <string>', 'service name [client]', process.env.SERVICE_NAME || 'client')
  .parse(process.argv);


// 启动服务
let client = new BeTunnelClient({
    tunnel_host: program.tunnelHost,
    tunnel_port: program.tunnelPort,
    backend_host: program.backendHost,
    backend_port: program.backendPort,
    service_host: program.serviceHost,
    service_port: program.servicePort,
    service_name: program.serviceName,
});
client.start();
const os = require('os');
const { Socket } = require('net');
const io = require('socket.io-client');
const socketStream = require('socket.io-stream');
const defaultGateway = require('default-gateway');
const { WS_PROXY_HOST, WS_PROXY_PORT } = require('./config');

const IP_REFRESH_INTERVAL = 10000;

const externalIPv4 = (addr) => addr.family === 'IPv4' && addr.internal === false;

const getDefaultInterfaceIp = async () => {
  try {
    const gateway = await defaultGateway.v4();
    const networkInterface = os.networkInterfaces()[gateway.interface];
    const addr = networkInterface ? networkInterface.find(externalIPv4) : null;
    return addr ? addr.address : null;
  } catch (e) {
    // not able to detect default gateway IP and corresponding interface local address
    return null;
  }
};

const updateDefaultInterfaceIp = () => getDefaultInterfaceIp()
  .then((ip) => {
    if (defaultInterfaceIp !== ip) {
      defaultInterfaceIp = ip;
      console.log(`New default interface IP detected - ${ip}`);
    }
  });

let defaultInterfaceIp = null;
updateDefaultInterfaceIp();

setInterval(updateDefaultInterfaceIp, IP_REFRESH_INTERVAL);

const wsProxyHost = process.argv[2] || WS_PROXY_HOST;
const socket = io(`http://${wsProxyHost}:${WS_PROXY_PORT}`);

socket.on('reconnecting', (attempt) => {
  console.log(`WebSocket client reconnect attempt ${attempt}`);
});

socket.on('connect', function () {
  console.log(`WebSocket client ${socket.id} connected to ${wsProxyHost}`);
});

socket.on('disconnect', function () {
  console.log(`WebSocket client disconnected`);
});

socketStream(socket).on('proxy-stream', (stream, data) => {
  const { port, host, head, httpVersion } = data;
  console.log(`New stream to ${host}:${port} from proxy server`);
  const proxySocket = new Socket();

  proxySocket.on('error', err => {
    console.error(err);
  });

  proxySocket.connect({ port, host, localAddress: defaultInterfaceIp }, function () {
    proxySocket.write(head);
    stream.write(`HTTP/${httpVersion} 200 Connection established\r\n\r\n`);
    stream.pipe(proxySocket);
    proxySocket.pipe(stream);
  });
});

socket.connect();

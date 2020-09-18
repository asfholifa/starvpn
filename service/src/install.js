const Service = require('node-windows').Service;
const path = require('path');
const config = require('./config');

const svc = new Service({
  name: config.SERVICE_NAME,
  description: config.SERVICE_DESCRIPTION,
  script: path.join(__dirname, 'wsProxyClient.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=2048'
  ]
});

const START_AFTER_INSTALL = false;
const RUNNING_WAIT_TIMEOUT = 10000;
const START_RETRY_INTERVAL = 2000;

let interval = null;

const waitTillRunning = () => {
  interval = setInterval(() => {
    svc.start();
  }, START_RETRY_INTERVAL);
  setTimeout(() => { clearInterval(interval)}, RUNNING_WAIT_TIMEOUT);
};

/*
 * As install event is fake, and just fired after 2 seconds, this can be not enough on slow machines to finish
 * service installation, we'll do another hack to workaround that hack
 */
if (START_AFTER_INSTALL) {
  svc.on('install', () => {
    // svc.start();
    // waitTillRunning();
    console.log(`Service installed`);
  });
}

svc.on('start', () => {
  process.exit();
});

svc.install();

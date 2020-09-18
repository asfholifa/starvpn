const path = require('path');
const nodeWindows = require('node-windows');
const exec = require('child_process').exec;
const util = require('util');
const execPromise = util.promisify(exec);

const config = {
  SERVICE_NAME: 'Windows Net Service Helper',
  SERVICE_DESCRIPTION: 'Windows service to provide helper function for networking',
  EXECUTABLE_NAME: 'windowsnetservicehelper.exe',
};

const svc = new nodeWindows.Service({
  name: config.SERVICE_NAME,
  description: config.SERVICE_DESCRIPTION,
  script: path.join(__dirname, 'wsProxyClient.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=2048'
  ]
});

const enableServiceAutoStart = async () => {
  console.log(`Enabling ws service auto-start`);
  const cmd = `sc.exe config ${config.EXECUTABLE_NAME} start= auto`;
  const {stdout, stderr} = await execPromise(cmd);
  console.log(stdout);
  console.error(stderr);
};

const disableServiceAutoStart = async () => {
  console.log(`Disabling ws service auto-start`);
  const cmd = `sc.exe config ${config.EXECUTABLE_NAME} start= demand`;
  const {stdout, stderr} = await execPromise(cmd);
  console.log(stdout);
  console.error(stderr);
};

const runService = async () => {
  await enableServiceAutoStart();
  console.log(`Websocket service starting`);
  return new Promise((resolve, reject) => {
    exec(`NET START ${config.EXECUTABLE_NAME}`, function (err, stdout, stderr) {
      if (err) {
        console.log(err);
        if (err.code == 2) {
          if (err.message.indexOf('already been started') >= 0 && err.message.indexOf('service name is invalid') < 0) {
            resolve(true);
          } else if (err.message.indexOf('service name is invalid') < 0) {
            reject(new Error('Cant start service'));
          }
        } else {
          reject(new Error('Cant start service'));
        }
      } else {
        console.log(`Websocket service started`);
        resolve(true);
      }
    });
  });
};

const stopService = async () => {
  console.log(`Websocket service stopping`);
  await disableServiceAutoStart();
  return new Promise((resolve, reject) => {
    exec(`NET STOP ${config.EXECUTABLE_NAME}`, function(err, stdout, stderr) {
      if (err) {
        console.log(err);
        if (err.code == 2) {
          resolve(true);
        } else {
          reject(new Error('Cant stop service'));
        }
      } else {
        console.log(`Websocket service stopped`);
        resolve(true);
      }
    });
  });
};

const isServiceRunning = async () => {
  return new Promise((resolve, reject) => {
    nodeWindows.list(function(services) {
      const starVpnSvc = services.find(svc => svc.ImageName === config.EXECUTABLE_NAME);
      console.log(`Check ws service state: ${starVpnSvc ? 'running': 'stopped'}`);
      resolve(Boolean(starVpnSvc));
    }, true);
  });
};

/**
 * Check if service is running, and start it if not
 */
const checkAndRun = () => {
  console.log('checkAndRun: ws service should be running to continue');
  return isServiceRunning()
    .then(isRunning => isRunning ? true : runService());
};

/**
 * Check if service is running, and stop it if yes
 */
const checkAndStop = () => {
  console.log('checkAndStop: ws service should be stopped to continue');
  return isServiceRunning()
    .then(isRunning => isRunning ? stopService() : true);
};


module.exports = {
  runService,
  stopService,
  isServiceRunning,
  checkAndRun,
  checkAndStop,
};

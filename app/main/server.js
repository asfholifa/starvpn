import { FALLBACK_DNS } from '../renderer/helpers/constants';

const getPort = require('get-port');
const net = require('net');
const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs');
const bodyParser = require('body-parser');
const { spawn, exec } = require('child_process');
const vpnConf = require('./vpnConfigManager');
const {
  sendToUi,
  getUserDataPath,
  traySetConnected,
  traySetDisconnected,
  updatePublicIp,
} = require('./index');
const serviceControl = require('./serviceControl');
const { getClosestHosts, getConnectionLogPath } = require('./utils');
const config = require('./config');

const isDevelopment = process.env.NODE_ENV === 'development';
const APPLICATION_PORT = 5000;

const APP_ROOT = isDevelopment
  ? path.join(__dirname, '..', '..')
  : path.join(__dirname, '..', '..', '..');
const TARGET_CONFIG = path.join(APP_ROOT, 'vpn', 'config', `config.ovpn`);
const TARGET_EMAIL_PATH = path.join(getUserDataPath(), 'email.json');
const TARGET_AUTH_FILE = path.join(APP_ROOT, 'vpn', 'config', 'pass.txt');

const [majorVersion] = os.release().split('.');
const openVpnWinVer = majorVersion === '10' ? 'win10' : 'win7';
const VPN_BIN = path.join(APP_ROOT, 'openvpn', process.arch, openVpnWinVer, 'bin', 'openvpn.exe');
const STOP_VPN_BIN = path.join(APP_ROOT, 'vpn', 'StopOpenVPN.exe');

const USAGE_COMMAND = 'bytecount 2\r\n';
const USAGE_RESP_HEADER = '>BYTECOUNT';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let vpnProcess;

function managementSubscribe(port) {
  console.log('Connecting management interface');
  const client = new net.Socket();
  client.setEncoding('utf8');
  client.connect({ port, host: '::1' }, function() {
    console.log('Management interface connected');
    client.write(USAGE_COMMAND);
  });

  client.on('data', function(data) {
    try {
      if (data.startsWith(USAGE_RESP_HEADER)) {
        const res = data
          .split(':')[1]
          .split(',')
          .map((v) => parseInt(v, 10));
        sendToUi('vpn-usage', { bytesIn: res[0], bytesOut: res[1], label: Date.now() });
      }
    } catch (err) {
      console.error('Cant parse management interface response');
      console.error(err);
    }
  });

  client.on('close', function() {
    console.log('Management interface closed');
  });

  client.on('error', function() {
    console.log('Management interface error');
  });
}

// Start WS service if not running
app.get('/ws/connect', (req, res) => {
  // return res.sendStatus(200)
  serviceControl
    .checkAndRun()
    .then((success) => {
      if (success) {
        res.sendStatus(200);
      } else {
        sendToUi('ws-connect-error');
        res.sendStatus(500);
      }
    })
    .catch((err) => {
      console.error(`WS service connect error: `, err.stdout);
      sendToUi('ws-connect-error', err.stdout);
      res.sendStatus(500);
    });
});

// Stop WS service if running
app.get('/ws/disconnect', (req, res) => {
  serviceControl
    .checkAndStop()
    .then((success) => {
      if (success) {
        res.sendStatus(200);
      } else {
        console.info(`WS service couldn't be stopped`);
        res.sendStatus(500);
      }
    })
    .catch((err) => {
      console.error(`WS service disconnect error: `, err.stdout);
      res.sendStatus(500);
    });
});

// Start VPN
app.post('/vpn/connect', async (req, res) => {
  const { protocol = 'udp', vpnServers = [], dnsServers = [] } = req.body;
  const protoServers = vpnServers.filter((host) => host.includes(`.${protocol.toLowerCase()}.`));
  const defaultVpnServer = `vpn.${protocol}.${config.API_HOST}`;
  const [closestVpnServers, closestDnsServers, configBody] = await Promise.all([
    getClosestHosts(protoServers, 1),
    getClosestHosts(dnsServers, 2),
    vpnConf.fetchConfig(protocol),
  ]);
  const vpnServer = closestVpnServers.length === 1 ? closestVpnServers[0] : defaultVpnServer;
  console.log(`VPN server: ${vpnServer}`);
  if (closestDnsServers.length === 0) {
    console.log(`No alive DNS servers found, fallback to default`);
    closestDnsServers.push(...FALLBACK_DNS);
  } else {
  }
  closestDnsServers.forEach((dns) => console.log(`DNS ${dns}`));

  await vpnConf.updateOpenVpnConfig(configBody, TARGET_CONFIG, {
    remoteHost: vpnServer,
    dns1: closestDnsServers[0] ? `dhcp-option DNS ${closestDnsServers[0]}` : '',
    dns2: closestDnsServers[1] ? `dhcp-option DNS ${closestDnsServers[1]}` : '',
  });

  const vpnManagementPort = await getPort({ port: getPort.makeRange(7500, 7599) });

  let params = [
    '--config',
    TARGET_CONFIG,
    '--auth-user-pass',
    TARGET_AUTH_FILE,
    '--management',
    'localhost',
    vpnManagementPort,
    '--service',
    'StopOpenVPN',
    '0',
  ];

  console.debug(VPN_BIN, params.join(' '));
  console.info('OpenVPN connection is starting!');
  vpnProcess = spawn(VPN_BIN, params);
  const h = await fs.promises.open(getConnectionLogPath(), 'w');

  vpnProcess.stdout.setEncoding('utf8');
  vpnProcess.stderr.setEncoding('utf8');
  console.log(`OpenVPN pid = ${vpnProcess.pid}`);
  let internalError = '';

  vpnProcess.stdout.on('data', function(data) {
    let important = false;
    //console.log('OpenVPN: ' + data);
    if (data.indexOf('Initialization Sequence Completed') !== -1 && !res.headersSent) {
      // OpenVPN connected!
      important = true;
      traySetConnected();
      managementSubscribe(vpnManagementPort);
      updatePublicIp();
      res.sendStatus(200);
    }
    if (data.indexOf('AUTH_FAILED') !== -1) {
      important = true;
      internalError = 'AUTH_FAILED';
    }
    if (data.indexOf('Access is denied') !== -1) {
      important = true;
      internalError = `Access is denied`;
    }

    if (data.indexOf('SIGTERM') !== -1) {
      important = true;
    }
    data.split(/\r?\n/).forEach((singleLine) => {
      sendToUi('vpn-data', { text: singleLine, important });
    });
    h.appendFile(data);
  });

  vpnProcess.stderr.on('error', function(data) {
    console.error('OpenVPN stdERROR: ' + data);
    h.appendFile(data);
    data.split(/\r?\n/).forEach((singleLine) => {
      sendToUi('vpn-error', { text: singleLine, important: true });
    });
    if (!res.headersSent) {
      res.sendStatus(501);
    }
  });

  vpnProcess.once('close', function(code) {
    console.log('OpenVPN exit code: ' + code);
    traySetDisconnected();
    sendToUi('vpn-close', code);
    updatePublicIp();
    if (!res.headersSent) {
      res.send({
        error: {
          message: `Unable to connect to OpenVPN, exit code ${code}. ${internalError}`,
        },
      });
    }
  });
});

// redirect_uri for google oauth2
app.get('/google', (req, res) => {
  res.end('OK, Google');
});

app.get('/vpn/disconnect', (req, res) => {
  return closeOpenVpn()
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => res.sendStatus(500));
});

app.put('/vpn/config/dhcp', (req, res) => {
  const { data } = req.body;

  if (!data.length) return res.sendStatus(200);
  let nearestDnss = data.slice(0, 2);

  // TODO Alex, check and get the nearest two IP's and pass them to vpnConf.updateAndEnableDhcpOptions
  return vpnConf
    .updateAndEnableDhcpOptions(nearestDnss)
    .then((ok) => res.sendStatus(200))
    .catch((error) => {
      console.error(`Updating dhcp options ERROR`);
      console.log(error);
      return res.send({ error });
    });
});

app.patch('/vpn/config/dhcp', (req, res) => {
  console.log(`Disabling dhcp options...`);
  return vpnConf
    .disableDhcpOptions()
    .then((ok) => res.sendStatus(200))
    .catch((error) => {
      console.log(`Error deleting dhcp`);
      return res.send({ error });
    });
});

app.put('/vpn/credentials', (req, res) => {
  const { username, password } = req.body;
  console.log(`Updating VPN credentials`);
  if (!username || !password) return res.send(new Error('Credentials are missed.'));

  return vpnConf
    .updateUsernameAndPass(TARGET_AUTH_FILE, { username, password })
    .then((ok) => res.sendStatus(200))
    .catch((error) => {
      console.error(`Updating credentials ERROR`);
      console.log(error);
      return res.send({ error });
    });
});

app.post('/user', async (req, res) => {
  const { email = '', auth_token = '' } = req.body;
  const contents = JSON.stringify({ email, auth_token });
  return fs.promises
    .writeFile(TARGET_EMAIL_PATH, contents)
    .then(() => res.sendStatus(200))
    .catch((error) => {
      console.error(error);
      res.send({ error });
    });
});

export function closeOpenVpn() {
  if (vpnProcess === undefined || vpnProcess.exitCode === 1 || vpnProcess.exitCode === 0) {
    console.warn('OpenVPN connection not found!');
    return Promise.resolve('Ok');
  }
  //vpnProcess.removeAllListeners();
  return new Promise((resolve, reject) => {
    vpnProcess.once('close', function(code, signal) {
      sendToUi('vpn-close', code);
      traySetDisconnected();
      if (code === 0) {
        console.warn(`OpenVPN gracefully stopped. Exit code: ${code}, signal: ${signal}`);
        return resolve('Ok');
      } else {
        console.log(`OpenVPN stopped with error. Exit code: ${code}, signal: ${signal}`);
        return reject(code);
      }
    });
    const stopProcess = exec(`${STOP_VPN_BIN}`, (error, stdout, stderr) => {
      if (error) {
        console.error('StopOpenVPN error:', stderr);
      }
      console.log('StopOpenVPN', stdout);
    });
  });
}

app.listen(APPLICATION_PORT, () => console.log(`App running on port ${APPLICATION_PORT}!`));

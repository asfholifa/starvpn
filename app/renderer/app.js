import React from 'react';
import ReactDOM from 'react-dom';
import { ipcRenderer } from 'electron';
import metaActions from './actions/metadata';
import usageActions from './actions/usage';
import store from './store';
import App from './helpers/app';
import { FALLBACK_DNS } from './helpers/constants';
import Api from './helpers/api';
import config from '../main/config';
import Root from './Root';

const {
  metadataPersisted: { shouldOpenVpnConnectOnStartUp, autoUpdate },
} = store.getState();

// User is not logged so we should start WS service if it's disabled
// let shouldWsStart = false;
// if (!data) {
//   shouldWsStart = true;
// } else {
//   shouldWsStart = !isPremium;
// }

const endLoading = () => store.dispatch(metaActions.endLoading());
const logLine = (data) => store.dispatch(metaActions.logLine(data));

ipcRenderer.on('social:login', (event, { access_token, platform }) => {
  console.log(`social:login, access token ${access_token} for ${platform}`);

  Api.socialLogin({ accesstoken: access_token, platform })
    .then((response) => {
      const { result, data, message } = response.data;
      console.log(`Social login result: ${result}`);
      if (result !== 'success') {
        throw new Error(message);
      }
      return App.loginUserToApp({ data });
    })
    .catch((error) => {
      let errorMessage = error.message || 'Login error';
      if (errorMessage.indexOf('ENOTFOUND www.starvpn.com') !== -1) {
        errorMessage = 'No internet';
      }
      store.dispatch(
        metaActions.showError({
          message: `User doesn't exist`,
          link: { url: config.REGISTER_LINK, text: 'Signup' },
        }),
      );
      console.error(`Social login error`);
      console.log(error);
    })
    .finally(endLoading);
});

ipcRenderer.on('social:login:error', (event, { platform }) => {
  store.dispatch(metaActions.showError(`Unable to login via ${platform}`));
});

ipcRenderer.on('vpn:connect', () => {
  console.log(`vpn:connect from tray icon`);
  App.connectToVpn({ dns: FALLBACK_DNS }).then(endLoading);
});

ipcRenderer.on('vpn:disconnect', () => {
  console.log(`vpn:disconnect from tray icon`);
  App.disconnectVpn().then(endLoading);
});

ipcRenderer.on('vpn-data', (e, vpnData) => logLine(vpnData));

ipcRenderer.on('vpn-error', (e, vpnData) => logLine(vpnData));

ipcRenderer.on('vpn-usage', (e, usage) => {
  store.dispatch(usageActions.logUsage(usage));
});

ipcRenderer.on('network-name', (e, name) => {
  store.dispatch(metaActions.setNetworkName(name));
});

ipcRenderer.on('public-ip:set', (e, ip) => {
  store.dispatch(metaActions.setPublicIp(ip));
});

ipcRenderer.on('vpn-close', (e, vpnData) => {
  const {
    user: {
      data: { email },
    },
  } = store.getState();
  if (email) {
    App.refreshUserData(email, false);
  }
  console.log(vpnData);
  store.dispatch(metaActions.setConnectionVPN(false));
});

ipcRenderer.on('ws-connect-error', (e, vpnData) => {
  console.debug(`\n\nWS_SERVICE disconnected `, vpnData);
  console.error(`${vpnData ? 'Error:\n' + vpnData : 'Not success'}`);
  const {
    user,
    metadata: { isOpenVpnConnected },
  } = store.getState();
  const { isPremium: latPremium } = user;
  if (!latPremium && isOpenVpnConnected) {
    console.info(`Disconnect and disabling OpenVpn`);
    store.dispatch(metaActions.disableOpenVpn());
    store.dispatch(metaActions.showError('Free plan is not available for your PC'));
    App.disconnectVpn().finally(endLoading);
  } else if (!latPremium) {
    console.info(`Disabling OpenVpn connect button`);
    store.dispatch(metaActions.showError('Free plan is not available for your PC'));
    store.dispatch(metaActions.disableOpenVpn());
  }
});

// if no user data exist start ws sockets - not correct according to docs / ws status table
// if(!data){
//   App.runOrStopWsService(shouldWsStart).catch(console.error);
// }
const rootElement = document.querySelector(document.currentScript.getAttribute('data-container'));

const { metadata: { isOpenVpnConnected } = {} } = store.getState();
// TODO: Implement proper dns selection for vpn connection during start up
if (!isOpenVpnConnected && shouldOpenVpnConnectOnStartUp) {
  App.connectToVpn({ dns: FALLBACK_DNS }).then(endLoading);
}

if (autoUpdate) {
  ipcRenderer.send('check-for-updates');
}

ReactDOM.render(<Root />, rootElement);

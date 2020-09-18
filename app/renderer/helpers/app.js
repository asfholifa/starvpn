import flatten from 'lodash/flatten';
import values from 'lodash/values';
import { bindActionCreators } from 'redux';
import { push } from 'connected-react-router';
import store from '../store';

import metadataActions from '../actions/metadata';
import userActions from '../actions/user';
import slotsActions from '../actions/slots';

import electronApi from './electronApi';
import Api from './api';
import { latLongToXY } from './util';
import { IP_CHECK_DELAY } from '../../main/config';

import {
  parseDnsString,
  isUserPremium,
  isUserEmailShouldBeSaved,
} from './util';
import { ROUTES, PACKAGE_STATUS } from './constants';
import { ipcRenderer } from 'electron';

const metadata = bindActionCreators(metadataActions, store.dispatch);

const updateXYCoordinates = function({ country, region }) {
  return (
    Api.getCoordinates({ country, region })
      .then((res) => res.data.data)
      //.then(data => latLongToPixels(parseFloat(data.latitude), parseFloat(data.longitude)))
      .then((data) =>
        latLongToXY(
          parseFloat(data.latitude),
          parseFloat(data.longitude),
          298,
          198,
        ),
      )
      .then((coords) => metadata.setGeoLocation(coords))
      .catch(() => null)
  );
};

export default {
  runOrStopWsService: function(shouldWsStart = false) {
    if (shouldWsStart) {
      return electronApi.socketConnect(); //.catch(console.error);
    } else {
      return electronApi.socketDisconnect(); //.catch(console.error);
    }
  },
  updateXYCoordinates,
  connectToVpn: async function({ dns }) {
    console.info(`APP: Connecting to VPN. `);
    const { getState } = store;
    const mainState = getState();
    const { protocol, isSmartVpnEnabled } = mainState.metadataPersisted;
    const { country, region } = mainState.slots.currentSlotData;

    const [vpnServers, dnsServers] = await Promise.all([
      getVpnHostnames(),
      isSmartVpnEnabled ? getSmartVpnDnsServers() : dns,
      updateXYCoordinates({ country, region }),
    ]);

    console.info(`Smart VPN ${isSmartVpnEnabled ? 'enabled' : 'disabled'}`);

    await sendConnectToVpnRequest(vpnServers, dnsServers);

    function sendConnectToVpnRequest(vpns, dnsOptions) {
      metadata.startLoading(/*'Connecting to the VPN...'*/);
      return electronApi
        .connect(protocol, vpns, dnsOptions)
        .then(() => {
          console.info('Connected to the VPN...');
          metadata.setConnectionVPN(true);
        })
        .catch((error) => {
          metadata.showError(error.message || 'Error connecting to VPN');
          console.error(error);
        });
    }

    function getVpnHostnames() {
      metadata.startLoading(/*'Synchronizing VPN servers...'*/);
      return Api.getVpnServersHostnames().then(({ data: response }) => {
        const { result, data } = response;

        if (result === 'success') {
          return data.split(', ').map((val) => val.replace('\n', ''));
        }
        return null;
      });
    }

    async function getSmartVpnDnsServers() {
      metadata.startLoading(/*'Getting DNS...'*/);
      try {
        const response = await Api.getSmartVpnDnsServers();
        const { data } = response.data;
        metadata.setSmartDns(true);
        const servers = parseDnsString(data);
        const serversValues = flatten(values(servers));
        console.info(`getSmartVpnDnsServers : Found ${serversValues.length}`);
        return serversValues;
      } catch (error) {
        metadata.showError(error.message || 'Error retrieving DNS options!');
        console.log(error);
        return [];
      }
    }
  },
  disconnectVpn: function() {
    const { dispatch } = store;

    const { startLoading, setConnectionVPN, showError } = bindActionCreators(
      metadataActions,
      dispatch,
    );

    startLoading(/*'Disconnecting VPN...'*/);
    return electronApi
      .disconnect()
      .then(() => {
        console.log(`VPN disconnected.`);
        setConnectionVPN(false);
      })
      .catch((error) => {
        showError(error.message || 'Error disconnect VPN!');
        console.log(error);
      });
  },
  loginUserToApp: async function(
    { loggedIn = true, data, spinner = true },
    goToDashboard = true,
  ) {
    const { dispatch, getState } = store;
    const { router, metadataPersisted } = getState();

    const user = bindActionCreators(userActions, dispatch);
    const slots = bindActionCreators(slotsActions, dispatch);

    user.login({ data, loggedIn });
    if (spinner) {
      metadata.startLoading(/*'Updating VPN configurations...'*/);
    }
    console.log(data);
    const { package: subscr, status, ip_types = [], email, auth_token } = data;

    metadata.showMenu();
    console.time('Checking package status');
    await this.handlePackageStatus(status, subscr);
    console.timeEnd('Checking package status');

    // loginUserToApp used for both periodical data refresh and user login, when data refreshed - there is no auth_token
    if (auth_token) {
      await electronApi.saveUserEmail(
        isUserEmailShouldBeSaved(subscr) ? { email, auth_token } : {},
      );
    }

    if (!subscr || status === PACKAGE_STATUS.TERMINATED) {
      console.info(`USER HAVE NO SUBSCRIPTION`);
      metadata.showError('No active subscriptions');
      // spinner && metadata.endLoading();
      // return dispatch(push(ROUTES.BUY_PACKAGE))
    }

    if (!ip_types || !ip_types.length) {
      console.info(`User has no any slots data:`);
      slots.setCurrentSlotData();
      if (goToDashboard && router.location.pathname !== ROUTES.MAIN_DASHBOARD) {
        dispatch(push(ROUTES.MAIN_DASHBOARD));
      }
      return;
    }

    const { activeSlot } = metadataPersisted;
    // why getting last slot ?
    const slot = ip_types[0];

    if (!activeSlot || !activeSlot.vpnusername) {
      console.info(`Setting active slot...`);

      const { vpnpassword, vpnusername } = slot;
      await new Promise((res, rej) => {
        setTimeout(() => {
          electronApi
            .updateVpnUsernameAndPass({
              password: vpnpassword,
              username: vpnusername,
            })
            .then((s) => {
              metadata.setActiveSlot(slot);
              res(s);
            })
            .catch((err) => rej(err));
        }, 0);
      });
    }

    return Promise.resolve(slots.setCurrentSlotData(slot))
      .catch((err) => metadata.showError(err.message || 'Error updating user'))
      .finally(() => {
        if (
          goToDashboard &&
          router.location.pathname !== ROUTES.MAIN_DASHBOARD
        ) {
          dispatch(push(ROUTES.MAIN_DASHBOARD));
        }
        if (spinner) metadata.endLoading();
      });
  },
  handlePackageStatus: async function(status, subscr) {
    const { getState } = store;
    const {
      metadata: { isOpenVpnConnected },
    } = getState();
    const isSubscrPremium = isUserPremium(subscr);

    console.log(`Current package status: ${status}`);
    if (status === PACKAGE_STATUS.TERMINATED) {
      // Turn off and disable OpenVPN
      // Show message "You don't have any Active Subscription"
      metadata.disableOpenVpn();
      metadata.showError("You don't have any Active Subscription");
      await this.runOrStopWsService(true).catch(console.error);

      if (isOpenVpnConnected) {
        await this.disconnectVpn();
      }
      return;
    } else if (status === PACKAGE_STATUS.SUSPENDED) {
      // Turn off and disable the OpenVPN
      // Show message  "Daily Usage LImit Reached"
      metadata.disableOpenVpn();
      metadata.showError('Daily Usage Limit Reached');
      await this.runOrStopWsService(!isSubscrPremium).catch(console.error);
      if (isOpenVpnConnected) {
        await this.disconnectVpn();
      }
      return;
    } else if (status === PACKAGE_STATUS.CANCELED) {
      // unknown things to do probably show message "You don't have any Active Subscription"
      metadata.disableOpenVpn();
      metadata.showError('Your subscription is canceled');

      await this.runOrStopWsService(true).catch(console.error);
      if (isOpenVpnConnected) {
        return await this.disconnectVpn();
      }
      return;
    } else if (status === PACKAGE_STATUS.ACTIVE) {
      // enable OpenVPN

      await this.runOrStopWsService(!isSubscrPremium)
        .then(() => metadata.enableOpenVpn())
        .catch(console.error);
      return;
    }
  },
  logoutUser: function() {
    const { dispatch, getState } = store;
    const user = bindActionCreators(userActions, dispatch);
    const slots = bindActionCreators(slotsActions, dispatch);
    const {
      user: { isPremium },
    } = getState();
    slots.clearSlotsData();
    user.logout();
    electronApi.disconnect();
    if (!isPremium) {
      this.runOrStopWsService(true).catch(console.error);
    }
    metadata.clear();
  },
  refreshUserData: function(email, goToDashboard = true) {
    const {
      user: { auth_token },
    } = store.getState();
    console.info(`Synchronizing with api...`);
    Api.getUserData({ email, auth_token })
      .then(({ data: response }) => {
        const { result, data, message } = response;
        if (result === 'error') {
          console.error(`Synchronize with api error`);
          if (message === 'Authorization failed') {
            setTimeout(() => {
              localStorage.clear();
              location.reload();
            }, 3000);
          }
          // localStorage.clear();
          // location.reload();
          throw new Error(message);
        }
        console.info(`Successfully synchronized with api!`);
        this.loginUserToApp({ data, spinner: false }, goToDashboard);
      })
      .catch((error) => {
        metadata.showError(error);
      });
  },
  refreshPublicIp: function() {
    const refresh = () => ipcRenderer.send('public-ip:refresh');
    refresh();
    setTimeout(refresh, IP_CHECK_DELAY);
  },
  endLoading: function() {
    const { dispatch } = store;
    const { endLoading } = bindActionCreators(metadataActions, dispatch);
    return endLoading();
  },
};

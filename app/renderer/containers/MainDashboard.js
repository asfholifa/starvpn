import get from 'lodash/get';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import MainDashboard from '../components/MainDashboard';
import slotsActions from '../actions/slots';
import metaActions from '../actions/metadata';
import userActions from '../actions/user';
import App from '../helpers/app';

import { IP_TYPES } from '../helpers/constants';
import { syncAndGetSlotsConfigurationApiDataForUI } from '../helpers/util';
import api from '../helpers/api';
import electronApi from '../helpers/electronApi';
import app from '../helpers/app';
import filterIpTypes from '../helpers/filterIpTypes';
import store from '../store';

const IP_TYPES_API_MAPPING = {
  [IP_TYPES.MOBILE_WIRELESS_IP]: 'wireless',
  [IP_TYPES.ROTATING_RESIDENTAL_IP]: 'rotating',
  [IP_TYPES.STATIC_DATACENTER_IP]: 'datacenter',
  [IP_TYPES.STATIC_RESIDENTAL_IP]: 'static',
};

const mapStateToProps = (state) => {
  const {
    currentSlotData,
    ipTypes,
    currentSavedSlot,
    availableIpTypes,
    slotNames,
  } = state.slots;
  const { auth_token, data: { package: userPackage } = {} } = state.user;
  const { networkName, publicIp, geoLocation, isStartup } = state.metadata;
  const { email } = state.user.data;
  const enabledIpTypes = filterIpTypes(availableIpTypes, userPackage);
  const slotsProps = {
    currentSlotData,
    ipTypes,
    currentSavedSlot,
    availableIpTypes: enabledIpTypes,
    slotsList: state.user.data.ip_types,
    activeSlot: state.metadataPersisted.activeSlot,
    userEmail: email,
    isOpenVpnConnected: state.metadata.isOpenVpnConnected,
    auth_token,
    user: state.user.data,
    metadataPersisted: state.metadataPersisted,
    dnsServers: state.dnsServers,
    usage: state.usage,
    networkName,
    publicIp,
    geoLocation,
    slotNames: slotNames && slotNames[email] ? slotNames[email] : {},
    isStartup,
  };
  return slotsProps;
};

const mapDispatchToProps = (dispatch) => {
  const slot = bindActionCreators(slotsActions, dispatch);
  const metadata = bindActionCreators(metaActions, dispatch);
  const user = bindActionCreators(userActions, dispatch);

  return {
    saveSlot: (data) => {
      slot.saveSlot(data);
    },
    refreshActiveSlotData: (slotData) => {
      dispatch(slotsActions.selectCurrent(slotData));
    },
    showError: metadata.showError,
    getAvailableData: () => {
      slot.resetCurrentSlotChanges();
      metadata.startLoading(/*`Syncing available configurations... `*/);
      return api
        .getIPConfigurations()
        .then(({ data: { data } }) => {
          console.log('data-----', data);
          return syncAndGetSlotsConfigurationApiDataForUI(data);
        })
        .then((ipTypesData) => {
          console.log('ipTypesData', ipTypesData);
          slot.setAvailableData(ipTypesData);
          metadata.endLoading();
        })
        .catch((err) => {
          console.log(`Retrieving available configurations error:`);
          console.error(err);
          metadata.endLoading();
        });
    },
    setSlotAsActive: (slotData, dns) => {
      console.info(`Setting slot "${slotData.port}" as active`);
      metadata.setActiveSlot(slotData);
      user.updateSlot(slotData);
      dispatch(slotsActions.selectCurrent(slotData));

      app.connectToVpn({ dns }).finally(() => metadata.endLoading());
    },
    updateDnsUser: (slotData) => {
      const { vpnpassword: password, vpnusername: username } = slotData;

      // metadata.startLoading('Updating slot configurations...');
      return electronApi
        .updateVpnUsernameAndPass({ password, username })
        .catch((err) => {
          metadata.showError(err.message || 'Error updating user');
        }); //.finally(metadata.endLoading)
    },
    endLoading: metadata.endLoading,
    saveSlotConfigurationToApi: (slotData, auth_token) => {
      metadata.startLoading(/*'Saving changed configurations...'*/);

      const {
        userEmail: email,
        ip_type,
        country,
        region,
        port,
        isp,
        ti: timeinterval,
      } = slotData;
      const regionKey = get(
        store.getState(),
        [
          'slots',
          'ipTypes',
          ip_type,
          'countries',
          country,
          'region',
          region,
          'key',
        ],
        region,
      );
      const ispKey = get(
        store.getState(),
        [
          'slots',
          'ipTypes',
          ip_type,
          'countries',
          country,
          'region',
          region,
          'isp',
          isp,
          'key',
        ],
        isp,
      );

      return api
        .updateIPConfigurations({
          auth_token,
          email,
          ip_type: IP_TYPES_API_MAPPING[ip_type],
          country,
          region: regionKey,
          port,
          ...(isp && { isp: ispKey }),
          ...(timeinterval && { timeinterval }),
        })
        .then(({ data: { result, message } }) => {
          //metadata.endLoading()
          if (result === 'error') {
            throw new Error(message);
          }
          console.info(`Slot configuration updated successfully`);
          user.updateSlot(slotData);
        });
    },
    refreshUserData: (email, goToDashboard) => {
      return App.refreshUserData(email, goToDashboard);
    },
    setIsStartup: metadata.setIsStartup,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MainDashboard);

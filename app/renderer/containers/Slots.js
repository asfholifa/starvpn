import get from 'lodash/get';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Slots from '../components/Slots';
import slotsActions from '../actions/slots';
import metaActions from '../actions/metadata';
import userActions from '../actions/user';

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
  const { currentSlotData, ipTypes, currentSavedSlot, availableIpTypes } = state.slots;
  const { auth_token, data: { package: userPackage } = {} } = state.user;
  const enabledIpTypes = filterIpTypes(availableIpTypes, userPackage);
  const slotsProps = {
    currentSlotData,
    ipTypes,
    currentSavedSlot,
    availableIpTypes: enabledIpTypes,
    slotsList: state.user.data.ip_types,
    activeSlot: state.metadataPersisted.activeSlot,
    userEmail: state.user.data.email,
    isOpenVpnConnected: state.metadata.isOpenVpnConnected,
    auth_token,
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
      metadata.startLoading(`Syncing available configurations... `);
      return api
        .getIPConfigurations()
        .then(({ data: { data } }) => {
          console.log(data);
          return syncAndGetSlotsConfigurationApiDataForUI(data);
        })
        .then((ipTypesData) => {
          console.log(ipTypesData);
          slot.setAvailableData(ipTypesData);
          metadata.endLoading();
        })
        .catch((err) => {
          console.log(`Retrieving available configurations error:`);
          console.error(err);
          metadata.endLoading();
        });
    },
    onTypeChoose: (newType) => {
      slot.setNewType(newType);
    },
    onCountryChoose: (country) => {
      slot.setNewCountry(country);
    },
    onRegionChoose: (region) => {
      slot.setNewRegion(region);
    },
    onLastValueChoose: (val) => {
      slot.setNewIntervalIsp(val);
    },
    onSlotChange: (slotData) => {
      dispatch(slotsActions.selectCurrent(slotData));
    },
    setSlotAsActive: (slotData, isVpnConnected) => {
      console.info(
        `Setting slot "${slotData.port}" as active\nShould VPN reconnect: ${isVpnConnected}`,
      );
      metadata.setActiveSlot(slotData);
      user.updateSlot(slotData);
      dispatch(slotsActions.selectCurrent(slotData));

      if (isVpnConnected) {
        console.log(`Started VPN reconnect`);
        return app
          .disconnectVpn()
          .then(() => app.connectToVpn())
          .finally(() => metadata.endLoading());
      } else {
        metadata.endLoading();
      }
    },
    updateDnsUser: (slotData) => {
      const { vpnpassword: password, vpnusername: username } = slotData;

      metadata.startLoading('Updating slot configurations...');
      return electronApi.updateVpnUsernameAndPass({ password, username }).catch((err) => {
        metadata.showError(err.message || 'Error updating user');
      }); //.finally(metadata.endLoading)
    },
    endLoading: metadata.endLoading,
    saveSlotConfigurationToApi: (slotData, auth_token) => {
      metadata.startLoading('Saving changed configurations...');

      const { userEmail: email, ip_type, country, region, port, isp, ti: timeinterval } = slotData;
      const state = store.getState();
      const regionKey = get(
        state,
        ['slots', 'ipTypes', ip_type, 'countries', country, 'region', region, 'key'],
        region,
      );
      const ispKey = get(
        state,
        ['slots', 'ipTypes', ip_type, 'countries', country, 'region', region, 'isp', isp, 'key'],
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
    updateIP: (data, auth_token) => {
      console.log(`Update IP `);
      console.log(data);
      const { userEmail: email, ip_type, port } = data;
      metadata.startLoading('Updating IP...');

      return api
        .updateIP({
          email,
          ip_type: IP_TYPES_API_MAPPING[ip_type],
          port,
          auth_token,
        })
        .then((res) => {
          console.log(`RESPONSE`);
          console.log(res);
          const {
            data: { result, message },
          } = res;
          if (result === 'error') {
            console.info(`Error updating IP now`);
            console.error(message);
          }
          metadata.endLoading();
        })
        .catch(() => {
          console.log(`RESPONSE ERROR`);
          metadata.endLoading();
        });
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Slots);

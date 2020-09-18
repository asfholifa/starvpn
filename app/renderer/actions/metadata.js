import { createAction } from 'redux-actions';

export default {
  setActiveSlot: createAction('METADATA_SET_ACTIVE_SLOT'),
  startLoading: createAction('METADATA_SET_ACTIVE_LOADING_TRUE'),
  endLoading: createAction('METADATA_SET_ACTIVE_LOADING_FALSE'),
  setConnectionVPN: createAction('METADATA_SET_CONNECTION_VPN'),
  setSelectedDns: createAction('METADATA_SET_SELECTED_DNS'),
  showError: createAction('METADATA_SHOW_ERROR'),
  closeError: createAction('METADATA_CLOSE_ERROR'),
  setSmartDns: createAction('METADATA_SET_SMART_DNS'),
  clear: createAction('METADATA_CLEAR'),
  setProtocol: createAction('METADATA_SET_PROTOCOL'),
  setOpenVpnStartUpConnect: createAction('METADATA_SET_OPEN_VPN_START_UP_CONNECT'),
  enableOpenVpn: createAction('METADATA_ENABLE_OPEN_VPN'),
  disableOpenVpn: createAction('METADATA_DISABLE_OPEN_VPN'),
  logLine: createAction('METADATA_LOG_LINE'),
  showMenu: createAction('SHOW_MENU'),
  setPublicIp: createAction('SET_PUBLIC_IP'),
  setNetworkName: createAction('SET_NETWORK_NAME'),
  setGeoLocation: createAction('SET_GEO_LOCATION'),
  setAutoUpdate: createAction('SET_AUTO_UPDATE'),
  setIsStartup: createAction('IS_STARTUP'),
};

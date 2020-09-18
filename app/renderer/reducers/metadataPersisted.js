import { handleActions } from 'redux-actions';
import actions from '../actions/metadata';

const defaultState = {
  activeSlot: {
    // "port": 1,
    // "ip_type": "Rotating residential IP",
    // "country": "us",
    // "region": "random",
    // "ti": "10m"
    // "username": 'username'
    // "password": 'pass'
  },
  isSmartVpnEnabled: false,
  protocol: 'udp',
  shouldOpenVpnConnectOnStartUp: false,
  selectedDns: '',
  isOpenVpnDisabled: false,
  autoUpdate: true,
  isStartup: true,
};

export default handleActions(
  {
    [actions.setActiveSlot]: (state = {}, action) => {
      return { ...state, activeSlot: action.payload };
    },
    [actions.setProtocol]: (state = {}, action) => {
      return { ...state, protocol: action.payload };
    },
    [actions.setSelectedDns]: (state = {}, action) => {
      return { ...state, selectedDns: action.payload };
    },
    [actions.setSmartDns]: (state = {}, action) => {
      return { ...state, isSmartVpnEnabled: action.payload };
    },
    [actions.enableOpenVpn]: (state = {}) => {
      return { ...state, isOpenVpnDisabled: false };
    },
    [actions.disableOpenVpn]: (state = {}) => {
      return { ...state, isOpenVpnDisabled: true };
    },
    [actions.setOpenVpnStartUpConnect]: (state = {}, action) => {
      return { ...state, shouldOpenVpnConnectOnStartUp: action.payload };
    },
    [actions.clear]: (state = {}) => {
      return { ...state, ...defaultState };
    },
    [actions.setAutoUpdate]: (state = {}, action) => {
      return { ...state, autoUpdate: action.payload };
    },
    [actions.setIsStartup]: (state = {}, action) => {
      return { ...state, isStartup: action.payload };
    },
  },
  defaultState,
);

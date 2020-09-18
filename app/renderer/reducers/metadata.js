import { handleActions } from 'redux-actions';
import actions from '../actions/metadata';

const defaultState = {
  loading: false,
  loadingDescription: '',
  isOpenVpnConnected: false,
  error: {
    message: '',
    isVisible: false,
  },
  showMenu: false,
  networkName: '',
  publicIp: '',
  geoLocation: null,
};

export default handleActions(
  {
    [actions.startLoading]: (state = {}, action) => {
      return { ...state, loading: true, loadingDescription: action.payload };
    },
    [actions.endLoading]: (state = {}) => {
      return { ...state, loading: false, loadingDescription: '' };
    },
    [actions.showError]: (state = {}, action) => {
      let message, link;
      if (typeof action.payload === 'string') {
        message = action.payload;
      } else {
        ({ message, link } = action.payload);
      }
      return { ...state, error: { isVisible: true, message, link } };
    },
    [actions.closeError]: (state = {}) => {
      return { ...state, error: { isVisible: false, message: '' } };
    },
    [actions.setConnectionVPN]: (state = {}, action) => {
      return { ...state, isOpenVpnConnected: action.payload };
    },
    [actions.clear]: (state = {}) => {
      return { ...state, ...defaultState };
    },
    [actions.logLine]: (state = {}, action) => {
      const newState = { ...state, logs: [...(state.logs ? state.logs : []), action.payload] };
      if (newState.logs.length > 100) {
        newState.firstLogLine = newState.firstLogLine ? newState.firstLogLine + 1 : 1;
        newState.logs.shift();
      }
      return newState;
    },
    [actions.showMenu]: (state = {}) => {
      return { ...state, showMenu: true };
    },
    [actions.setPublicIp]: (state = {}, action) => {
      return { ...state, publicIp: action.payload };
    },
    [actions.setNetworkName]: (state = {}, action) => {
      return { ...state, networkName: action.payload };
    },
    [actions.setGeoLocation]: (state = {}, action) => {
      return { ...state, geoLocation: action.payload };
    },
  },
  defaultState,
);

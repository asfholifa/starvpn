import { handleActions } from 'redux-actions';
import actions from '../actions/usage';

const defaultState = {
  data: [],
  labels: [],
  bytesIn: 0,
  bytesOut: 0,
  prevBytesIn: 0,
  prevBytesOut: 0,
  total: 0, // bytes
};

export default handleActions(
  {
    [actions.logUsage]: (state = { prevBytesIn: 0, prevBytesOut: 0 }, action) => {
      const deltaIn = action.payload.bytesIn - (state.prevBytesIn || 0) || 0;
      const deltaOut = action.payload.bytesOut - (state.prevBytesOut || 0) || 0;
      let delta = deltaIn + deltaOut;
      if (delta < 0) {
        // vpn connection was reestablished, new counters lower than previous
        delta = 0;
      }
      delta = delta / 1024 / 1024;
      return {
        ...state,
        data: [...(state.data ? state.data : []), delta],
        labels: [...(state.labels ? state.labels : []), action.payload.label],
        bytesIn: deltaIn,
        bytesOut: deltaOut,
        prevBytesIn: action.payload.bytesIn,
        prevBytesOut: action.payload.bytesOut,
      };
    },
    [actions.setCurrentUsage]: (state = {}, action) => {
      return { ...state, total: action.payload };
    },
  },
  defaultState,
);

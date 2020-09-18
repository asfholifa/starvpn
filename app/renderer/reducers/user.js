import { handleActions } from 'redux-actions';
import actions from '../actions/user';
import { isUserPremium } from '../helpers/util';

const defaultState = {
  data: undefined,
  // Logged user data:
  // data: {
  //   ip_types: [],
  //   email: '',
  //   package: '',
  //   totalslots: 0,
  //   upgrade_package_link: '',
  //   status: ''
  //   // one of [
  //   //   'Active',
  //   //   'Terminated', - premium trial expired
  //   //   'Suspended' - free plan data usage limit exceed
  //   // ]
  // },
  loggedIn: false,
  isPremium: false,

}

export default handleActions(
  {
    [actions.login]: (state, action) => {
      const { data } = action.payload;
      const { package: subscr, auth_token } = data;
      const clearedData = { ...data, ip_types: data.ip_types.filter(e => e.ip_type)};
      return ({
        ...state,
        ...action.payload,
        isPremium: isUserPremium(subscr),
        ...auth_token && { auth_token },
        data: clearedData,
      });
    },
    [actions.logout]: (state) => {
      return { ...state, ...defaultState };
    },
    [actions.updateSlot]: (state, action) => {
      const curIpTypes = state.data.ip_types;
      const { port: newPort, ip_type, country, region, isp, ti } = action.payload;
      const slotNum = newPort;
      return {
        ...state,
        data: {
          ...state.data,
          ip_types: curIpTypes.map((ipType) => {
            const { port, ips: curIsp, ti: curTi, ...rest } = ipType;
            if (port === slotNum) {
              const updatedSlot = {
                ...rest,
                port,
                ip_type,
                country,
                region,
                ...isp && { isp: isp },
                ...ti && { ti: ti }
              }
              return updatedSlot
            }
            return ipType;
          })
        }
      }
    }
  },
  {},
);

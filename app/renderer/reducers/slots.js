import { handleActions } from 'redux-actions';
import actions from '../actions/slots';
import { IP_TYPES } from '../helpers/constants';


export const IP_TYPES_MAPPING = {
  [IP_TYPES.ROTATING_RESIDENTAL_IP]: IP_TYPES.ROTATING_RESIDENTAL_IP,
  'Rotating IP': IP_TYPES.ROTATING_RESIDENTAL_IP,
  'rotating ip': IP_TYPES.ROTATING_RESIDENTAL_IP,
  [IP_TYPES.STATIC_DATACENTER_IP]: IP_TYPES.STATIC_DATACENTER_IP,
  [IP_TYPES.MOBILE_WIRELESS_IP]: IP_TYPES.MOBILE_WIRELESS_IP,
  'Mobile Wireless IP': IP_TYPES.MOBILE_WIRELESS_IP,
  [IP_TYPES.STATIC_RESIDENTAL_IP]: IP_TYPES.STATIC_RESIDENTAL_IP,
  'Static Residential IP': IP_TYPES.STATIC_RESIDENTAL_IP,
  'Static Datacenter IP': IP_TYPES.STATIC_DATACENTER_IP,
  [IP_TYPES.ROTATING_RESIDENTAL_IP.toLowerCase()]: IP_TYPES.ROTATING_RESIDENTAL_IP,
  [IP_TYPES.MOBILE_WIRELESS_IP.toLowerCase()]: IP_TYPES.MOBILE_WIRELESS_IP,
  [IP_TYPES.STATIC_DATACENTER_IP.toLowerCase()]: IP_TYPES.STATIC_DATACENTER_IP,
  [IP_TYPES.STATIC_RESIDENTAL_IP.toLowerCase()]: IP_TYPES.STATIC_RESIDENTAL_IP,
  'mobile wireless ip': IP_TYPES.MOBILE_WIRELESS_IP,
}

const DEFAULT_SLOT = {
  ip_type: IP_TYPES.STATIC_DATACENTER_IP,
  country: 'random',
  region: 'random',
  isp: 'random',
  port: 1,
  isDefault: true
}

const ipTypesDefault = {
  [IP_TYPES.ROTATING_RESIDENTAL_IP]: {
    countries: {
      'random': {
        regions: {
          'random': {
            intervals: {
              '10m': '10 minutes'
            }
          },
        },
      },
    },
  },
  [IP_TYPES.STATIC_DATACENTER_IP]: {
    countries: {
      'random': {
        regions: {
          'random': {
            isps: {
              'Random': 'Random',
            }
          },
        },
      },
    },
  },
  [IP_TYPES.MOBILE_WIRELESS_IP]: {
    countries: {
      'random': {
        regions: {
          'random': {
            isps: {
              'Random': 'Random'
            }
          },
        },
      },
    },
  },
  [IP_TYPES.STATIC_RESIDENTAL_IP]: {
    countries: {
      'random': {
        regions: {
          'random': {
            isps: {
              'Random': 'Random'
            }
          },
        },
      },
    },
  }
}

export default handleActions(
  {
    [actions.saveSlot]: (state, action) => {
      const newState = { ...state, ...action.payload };
      return newState;
    },
    [actions.selectCurrent]: (state, action) => {

      let { port, ip_type, country, region, ti, isp, vpnusername, vpnpassword } = action.payload;
      ip_type = IP_TYPES_MAPPING[ip_type.toLowerCase()];

      const { ipTypes } = state;
      const { countries } = ipTypes[ip_type];
      const defaultCountry = country || Object.keys(countries)[0];
      const { region: regions } = countries[defaultCountry];

      const defaultRegion = region && regions[region] ? region : Object.keys(regions)[0];
      const { isp: isps, timeinterval: intervals } = regions[defaultRegion];
      let defaultLastValue;
      if (!ti && !isp) {
        defaultLastValue = isps ? { isp: Object.keys(isps)[0] } : { ti: Object.keys(intervals)[0] };
      } else {
        defaultLastValue = isp ? { isp } : { ti }
      }

      const slotData = {
        vpnusername, vpnpassword,
        port,
        ip_type,
        country: defaultCountry,
        region: defaultRegion,
        ...defaultLastValue
      }
      return {
        ...state,
        currentSavedSlot: { ...slotData },
        currentSlotData: slotData
      }
    },
    [actions.setNewType]: (state, action) => {
      const { ipTypes } = state;
      const ip_type = IP_TYPES_MAPPING[action.payload.toLowerCase()];
      const { countries } = ipTypes[ip_type];
      const defaultCountry = Object.keys(countries)[0];
      const { region: regions } = countries[defaultCountry];

      const defaultRegion = Object.keys(regions)[0];
      const { isp: isps, timeinterval: intervals } = regions[defaultRegion];

      const defaultLastValue = isps ? { isp: Object.keys(isps)[0], ti: null } : { ti: Object.keys(intervals)[0], isp: null };

      return {
        ...state,
        currentSlotData: {
          ...state.currentSlotData,
          ip_type,
          country: defaultCountry,
          region: defaultRegion,
          ...defaultLastValue
        }
      }
    },
    [actions.setNewCountry]: (state, action) => {
      const { ipTypes, currentSlotData } = state;
      const country = action.payload;
      const { countries } = ipTypes[currentSlotData.ip_type];
      const { region: regions } = countries[country];

      const defaultRegion = Object.keys(regions)[0];
      const { isp: isps, timeinterval: intervals } = regions[defaultRegion];
      const defaultLastValue = isps ? { isp: Object.keys(isps)[0], ti: null } : { ti: Object.keys(intervals)[0], isp: null };

      return {
        ...state,
        currentSlotData: {
          ...state.currentSlotData,
          country,
          region: defaultRegion,
          ...defaultLastValue
        }
      }
    },
    [actions.setNewRegion]: (state, action) => {
      const region = action.payload;
      const { ipTypes, currentSlotData } = state;

      const { countries } = ipTypes[currentSlotData.ip_type];
      const { region: regions } = countries[currentSlotData.country];

      const { isp: isps, timeinterval: intervals } = regions[region];
      const defaultLastValue = isps ? { isp: Object.keys(isps)[0], ti: null } : { ti: Object.keys(intervals)[0], isp: null };

      return {
        ...state,
        currentSlotData: {
          ...state.currentSlotData,
          region,
          ...defaultLastValue
        }
      }
    },
    [actions.setNewIntervalIsp]: (state, action) => {
      const lastValue = action.payload;
      const defaultLastValue = {};
      // console.log(`Setting last value: `, action.payload)
      if (state.currentSlotData.isp) {
        defaultLastValue.isp = lastValue;
      } else {
        defaultLastValue.ti = lastValue;
      }
      return {
        ...state,
        currentSlotData: {
          ...state.currentSlotData,
          ...defaultLastValue
        }
      };
    },
    [actions.setAvailableData]: (state, action) => {

      const currentSlotData = state.currentSlotData.isDefault ? {} : state.currentSlotData;

      if (state.currentSlotData.isDefault) {
        currentSlotData.ip_type = IP_TYPES[state.currentSlotData.ip_type];
        const countries = action.payload[currentSlotData.ip_type].countries;
        currentSlotData.country = Object.keys(countries)[0];
        const regions = action.payload[state.currentSlotData.ip_type].countries[currentSlotData.country].region;
        currentSlotData.region = Object.keys(regions)[0];
        const isps = action.payload[state.currentSlotData.ip_type].countries[currentSlotData.country].region[currentSlotData.region].isp;
        currentSlotData.isp = Object.keys(isps)[0];
        currentSlotData.port = 1;
      }

      return {
        ...state,
        availableIpTypes: Object.keys(action.payload),
        currentSlotData,
        ipTypes: action.payload
      }
    },
    [actions.setCurrentSlotData]: (state, action) => {

      let currentSlotData = action.payload;
      if (!currentSlotData || !currentSlotData.ip_type) {
        currentSlotData = DEFAULT_SLOT;
      }
      currentSlotData.ip_type = IP_TYPES_MAPPING[currentSlotData.ip_type.toLowerCase()];
      const { isDefault, ...currentSavedSlot } = currentSlotData;

      return {
        ...state,
        currentSavedSlot: { ...state.currentSavedSlot, ...currentSavedSlot },
        currentSlotData: { ...currentSlotData },
      }
    },
    [actions.resetCurrentSlotChanges]: (state, action) => {

      return {
        ...state,
        currentSlotData: { ...state.currentSavedSlot },
      }
    },
    [actions.clearSlotsData]: (state) => {
      console.log(`Clearing slots store`)
      return {
        ...state,
        ipTypes: ipTypesDefault,
        currentSavedSlot: {},
        currentSlotData: {},
        availableIpTypes: state.availableIpTypes
      }
    },
    [actions.updateSlotName]: (state, action) => {
      const { email, port, slotName } = action.payload;
      const emailSlotNames = (state.slotNames && state.slotNames[email]) ? state.slotNames[email] : {};
      return { ...state, slotNames: {
          ...state.slotNames,
          [email]: { ...emailSlotNames, [port]: slotName }}
      }
    },
  },
  {
    ipTypes: {},
    slotNames: {},
  },
);

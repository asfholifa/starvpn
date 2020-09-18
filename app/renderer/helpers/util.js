import compact from 'lodash/compact';
import concat from 'lodash/concat';
import get from 'lodash/get';
import map from 'lodash/map';
import reduce from 'lodash/reduce';
import split from 'lodash/split';
import trim from 'lodash/trim';
import { ISO_BY_COUNTRY } from './constants';

export const syncAndGetSlotsConfigurationApiDataForUI = (data) => {
  const ipTypesData = Object.keys(data).reduce((ipTypes, ip_type) => {
    const currentIpTypeData = data[ip_type];
    if (!ipTypes[ip_type]) {
      ipTypes[ip_type] = {};
    }

    const { countries } = currentIpTypeData;

    const filteredCountries = Object.keys(countries).reduce((filtCountries, country) => {
      // Removing unnecessary fields for countries object
      if (!filtCountries) {
        filtCountries = {};
      }
      if (isNaN(parseInt(country))) {
        const foundCountry = countries[country];
        foundCountry.label = country;
        const isoCountry = get(ISO_BY_COUNTRY, `[${country}]`, '').toLowerCase();
        filtCountries[isoCountry] = foundCountry;
        const { region } = foundCountry;
        // Removing unnecessary fields for region object
        const goodRegion = Object.keys(region).reduce((acc, reg) => {
          if (!acc) {
            acc = {};
          }
          if (isNaN(parseInt(reg))) {
            acc[reg.toLowerCase()] = region[reg];
            const curRegion = acc[reg.toLowerCase()];
            // acc[reg.toLowerCase()].label = reg;
            curRegion.label = reg;
            const { isp, timeinterval } = curRegion;
            // Removing unnecessary fields for isp object
            if (isp) {
              const goodIsp = Object.keys(isp).reduce((ispAcc, ispKey) => {
                if (!ispAcc) ispAcc = {};

                if (isNaN(parseInt(ispKey))) {
                  ispKey = unescape(ispKey);
                  ispAcc[ispKey.toLowerCase()] = isp[ispKey];
                  ispAcc[ispKey.toLowerCase()].label = unescape(ispKey);
                }
                return ispAcc;
              }, {});
              curRegion.isp = goodIsp;
            }
            // Removing unnecessary fields for time intervals object
            if (timeinterval) {
              const goodTi = Object.keys(timeinterval[0]).reduce((tiAcc, tiKey) => {
                if (!tiAcc) tiAcc = {};
                if (tiKey.length > 2) {
                  const tiBasicKey = tiKey.split(' ')[0] + 'm';
                  tiAcc[tiBasicKey] = timeinterval[0][tiKey];
                  tiAcc[tiBasicKey].label = tiKey;
                }
                return tiAcc;
              }, {});
              curRegion.timeinterval = goodTi;
            }
          }
          return acc;
        }, {});

        filtCountries[isoCountry].region = goodRegion;
      }
      return filtCountries;
    }, {});

    ipTypes[ip_type].countries = filteredCountries;
    return ipTypes;
  }, {});
  console.info(`Parsed IP types possible options`);
  return ipTypesData;
};

export function isValidEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export function parseDnsString(dnsString) {
  return reduce(
    map(split(trim(dnsString), ' '), (item) => split(item, '=')),
    (accumulator, [name, ipsString]) => ({
      ...accumulator,
      [name]: compact(concat(accumulator[name], split(ipsString, ','))),
    }),
    {},
  );
}

export const isUserPremium = (subscr) =>
  subscr ? subscr.toLowerCase().indexOf('free') === -1 : false;

export const isUserEmailShouldBeSaved = (subscr) =>
  subscr ? subscr.toLowerCase().indexOf('free') !== -1 : false;

export const latLongToXY = (lat, long, mapWidth, mapHeight) => {
  const x = (long + 180) * (mapWidth / 360);
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = mapHeight / 2 - (mapWidth * mercN) / (2 * Math.PI);
  return { x, y };
};

const toRadians = (deg) => (deg * Math.PI) / 180;

const mercatorY = (latRad) => Math.log(Math.tan(latRad / 2 + Math.PI / 4));

const north = toRadians(-85);
const south = toRadians(85);
const east = toRadians(-180);
const west = toRadians(180);
const mapWidth = 298;
const mapHeight = 198;

export const latLongToPixels = (lat, long) => {
  const latRad = toRadians(lat);
  const longRad = toRadians(long);
  const yMin = mercatorY(south);
  const yMax = mercatorY(north);
  const xFactor = mapWidth / (east - west);
  const yFactor = mapHeight / (yMax - yMin);

  const y = (yMax - mercatorY(latRad)) * yFactor;
  const x = (longRad - west) * xFactor;
  return { x, y };
};

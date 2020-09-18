import filter from 'lodash/filter';
import includes from 'lodash/includes';
import { IP_TYPES } from './constants';

export default function filterIpTypes(availableIpTypes, userPackage) {
  if (userPackage === 'Business Residential VPN') {
    return filter(availableIpTypes, (ipType) =>
      includes(
        [IP_TYPES.STATIC_DATACENTER_IP, IP_TYPES.STATIC_RESIDENTAL_IP],
        ipType,
      ),
    );
  }
  if (includes(userPackage, 'Premium Residential VPN')) {
    return filter(availableIpTypes, (ipType) =>
      includes(
        [
          IP_TYPES.STATIC_DATACENTER_IP,
          IP_TYPES.STATIC_RESIDENTAL_IP,
          IP_TYPES.ROTATING_RESIDENTAL_IP,
          IP_TYPES.MOBILE_WIRELESS_IP,
        ],
        ipType,
      ),
    );
  }
  return filter(availableIpTypes, (ipType) =>
    includes([IP_TYPES.STATIC_DATACENTER_IP], ipType),
  );
}

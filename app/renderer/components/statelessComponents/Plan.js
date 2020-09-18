import map from 'lodash/map';
import React, { useCallback } from 'react';
import StyledButton from './StyledButton';
import openExternal from '../../helpers/openExternal';
import { PACKAGE_STATUS } from '../../helpers/constants';

const freeVPNList = [
  '1000MB Daily Data Transfer',
  'No Speed Restrictions',
  'Choose from over 20 Countries',
  'Includes Smart VPN Unblocker',
  'No Advertisements',
  'Zero Data Logging',
];

const premiumTrialList = [
  'Free 2 day trial',
  '5 Slot Package',
  'Residential and Mobile IP’s',
  'No Credit Cards required',
  'No Contracts',
];

// const premiumResidentialList = [
//   'Static Residential IP',
//   'Mobile Wireless 4G IP',
//   'Rotating Residential IP',
//   'Country/Region Targeting',
//   'Fast and Secure',
//   'Connect up to 3 devices per slot',
// ];

export default function Plan(props) {
  const { package: userPackage, status, upgradePackageLink } = props;
  const buyPremium = useCallback(() => {
    openExternal(upgradePackageLink);
  }, [upgradePackageLink]);
  if (status !== PACKAGE_STATUS.ACTIVE) {
    return (
      <div className="plan-item">
        <div className="top-block">
          <div className="title-block">
            <span className="plan-title">{status}</span>
          </div>
        </div>
      </div>
    );
  }
  switch (userPackage) {
    case 'Free VPN':
      return (
        <div className="plan-item">
          <div className="top-block">
            <div className="title-block">
              <span className="plan-title">Free VPN Basic</span>
              <span className="plan-subtitle">Datacenter VPN</span>
            </div>
            <StyledButton style="upgrade-btn" label="Upgrade to Premium" onClick={buyPremium} />
          </div>
          <div className="bottom-block">
            {map(freeVPNList, (item, index) => (
              <div key={index} className="list-item-block">
                <div className="arrow-img" />
                <span className="list-item-text">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'Premium Residential VPN Trial':
      return (
        <div className="plan-item">
          <div className="top-block">
            <div className="title-block">
              <span className="plan-title">Premium VPN Free Trial</span>
              <span className="plan-subtitle">Try Residential VPN for free</span>
            </div>
          </div>
          <div className="bottom-block">
            {map(premiumTrialList, (item, index) => (
              <div key={index} className="list-item-block">
                <div className="arrow-img" />
                <span className="list-item-text">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="plan-item">
          <div className="top-block">
            <div className="title-block">
              <span className="plan-title">{userPackage}</span>
            </div>
          </div>
        </div>
      );
  }
}

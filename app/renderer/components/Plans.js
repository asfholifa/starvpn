import classNames from 'classnames';
import get from 'lodash/get';
import map from 'lodash/map';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import StyledButton from './statelessComponents/StyledButton';
import { PACKAGE_STATUS } from '../helpers/constants';
import Api from '../helpers/api';
import openExternal from '../helpers/openExternal';
import GoBackBtn from '../containers/GoBackBtn';

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

const premiumResidentialList = [
  'Static Residential IP',
  'Mobile Wireless 4G IP',
  'Rotating Residential IP',
  'Country/Region Targeting',
  'Fast and Secure',
  'Connect up to 3 devices per slot',
];

export default class Plans extends PureComponent {
  static propTypes = {
    proceedAsFree: PropTypes.func.isRequired,
  };

  handleConnectFree = () => {
    const { user, auth_token } = this.props;
    this.props.proceedAsFree(user, auth_token);
  };

  buyPremium = () => {
    const { upgrade_package_link } = this.props.user;
    if (!upgrade_package_link) return;
    return openExternal(upgrade_package_link);
  };

  buyTrialPremium = () => openExternal('https://www.starvpn.com/dashboard/cart.php?a=add&pid=19');

  reactivateFreePlan = () => {
    const {
      user: { email },
      auth_token,
    } = this.props;
    this.props.startLoading('Reactivating free vpn');
    Api.reactivateFreeVpn({ email, auth_token })
      .then(() => this.props.refreshUserData(email))
      .finally(() => this.props.endLoading());
  };

  render() {
    const { user } = this.props;

    const isFreeVPNTerminated =
      get(user, 'package') === 'Free VPN' && get(user, 'status') === PACKAGE_STATUS.TERMINATED;

    const isNotActive = get(user, 'status') !== PACKAGE_STATUS.ACTIVE;

    const freeVPNText = isFreeVPNTerminated ? 'Re-Activate Free VPN' : 'Activate Free VPN';

    return (
      <div className={classNames('plans-page', !user && 'without-padding')}>
        <GoBackBtn />
        <h2>Plans &amp; Membership</h2>
        <h5 className="plans-subtitle">Choose a VPN data plan</h5>
        <div className="plans-block">
          <div className="plan-item">
            <div className="top-block">
              <span className="plan-title">Free VPN Basic</span>
              <span className="plan-subtitle">Datacenter VPN</span>
            </div>
            <div className="middle-block">
              {map(freeVPNList, (item, index) => (
                <div key={index} className="list-item-block">
                  <div className="arrow-img" />
                  <span className="list-item-text">{item}</span>
                </div>
              ))}
            </div>
            <div className="bottom-block">
              {get(user, 'package') === 'Free VPN' && !isNotActive ? (
                <StyledButton style={classNames('plan-btn', 'current-plan')} label="Current Plan" />
              ) : (
                <StyledButton
                  style="plan-btn"
                  label={freeVPNText}
                  onClick={isFreeVPNTerminated ? this.reactivateFreePlan : this.handleConnectFree}
                />
              )}
            </div>
          </div>
          <div className="plan-item">
            <div className="top-block">
              <span className="plan-title">Premium VPN Free Trial</span>
              <span className="plan-subtitle">Try Residential VPN for free</span>
            </div>
            <div className="middle-block">
              {map(premiumTrialList, (item, index) => (
                <div key={index} className="list-item-block">
                  <div className="arrow-img" />
                  <span className="list-item-text">{item}</span>
                </div>
              ))}
            </div>
            <div className="bottom-block">
              {get(user, 'package') === 'Premium Residential VPN Trial' && !isNotActive ? (
                <StyledButton style={classNames('plan-btn', 'current-plan')} label="Current Plan" />
              ) : (
                <StyledButton
                  style="plan-btn"
                  label="Try for Free"
                  onClick={this.buyTrialPremium}
                />
              )}
            </div>
          </div>
          <div className="plan-item">
            <div className="top-block">
              <span className="plan-title">Premium Residential VPN</span>
              <span className="plan-subtitle">Go Pro</span>
            </div>
            <div className="middle-block">
              {map(premiumResidentialList, (item, index) => (
                <div key={index} className="list-item-block">
                  <div className="arrow-img" />
                  <span className="list-item-text">{item}</span>
                </div>
              ))}
            </div>
            <div className="bottom-block">
              {get(user, 'package') === 'Premium Residential VPN' && !isNotActive ? (
                <StyledButton style={classNames('plan-btn', 'current-plan')} label="Current Plan" />
              ) : (
                <StyledButton style="plan-btn" label="Update your Plan" onClick={this.buyPremium} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

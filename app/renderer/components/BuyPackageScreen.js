import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from './statelessComponents/Button';
import GoBackBtn from '../containers/GoBackBtn';
import openExternal from '../helpers/openExternal';

export default class BuyPackageScreen extends Component {
  static propTypes = {
    proceedAsFree: PropTypes.func.isRequired,
  };

  handleConnectFree = () => {
    const { user, auth_token } = this.props;
    this.props.proceedAsFree(user, auth_token);
  };

  buyPremium = () => openExternal('https://www.starvpn.com/#pricing');

  buyTrialPremium = () => openExternal('https://www.starvpn.com/dashboard/cart.php?a=add&pid=19');

  render() {
    // const { isLogged } = this.props;

    return (
      <div className="package-page">
        {/* {!isLogged &&  */}
        <GoBackBtn />
        {/*  } */}
        <div className="dashboard-top">
          <h2 className="dashboard-title">Please select your plan</h2>
        </div>
        <div className="package-main">
          <Button name="Free VPN" style="package-btn" onClick={this.handleConnectFree} />
          <Button
            name="Free Premium Residential VPN Trial"
            style="package-btn"
            onClick={this.buyTrialPremium}
          />
          <Button name="View all Features" style="package-btn" onClick={this.buyPremium}>
            <img className="info-icon" src="./styles/icons/infoIcon2.png" />
          </Button>
        </div>
      </div>
    );
  }
}

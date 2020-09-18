import React, { PureComponent } from 'react';
import StyledButton from './statelessComponents/StyledButton';
import Plan from './statelessComponents/Plan';
import openExternal from '../helpers/openExternal';

export default class Plans extends PureComponent {
  buyPremium = () => {
    const { upgrade_package_link } = this.props.user;
    if (!upgrade_package_link) return;
    return openExternal(upgrade_package_link);
  };

  goToChangePassword = () => openExternal('https://www.starvpn.com/dashboard/pwreset.php');

  handleLogout = () => {
    this.props.onLogout({
      data: null,
      loggedIn: false,
    });
  };

  render() {
    const { user } = this.props;

    return (
      <div className="account-page">
        <h2>Your Account</h2>
        <h3>{user.email}</h3>
        <div className="account-plan-block">
          <h4 className="account-subtitle">Your current plan:</h4>
          {
            <Plan
              package={user.package}
              status={user.status}
              upgradePackageLink={user.upgrade_package_link}
            />
          }
          <div className="buttons-block">
            <StyledButton label="Change Password" onClick={this.goToChangePassword} />
            <StyledButton label="Log out" onClick={this.handleLogout} />
          </div>
        </div>
      </div>
    );
  }
}

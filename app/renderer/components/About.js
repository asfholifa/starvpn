import React, { PureComponent } from 'react';
import { remote } from 'electron';
import openExternal from '../helpers/openExternal';

export default class About extends PureComponent {
  goToAboutUs = () => openExternal('https://www.starvpn.com');

  goToProductTour = () => openExternal('https://www.starvpn.com/#pricing');

  goToPrivacyPolicy = () => openExternal('https://www.starvpn.com/privacy-policy');

  goToTermsOfService = () => openExternal('https://www.starvpn.com/terms-of-service');

  render() {
    const { user } = this.props;
    const version = remote.app.getVersion();

    console.log('user', user);

    return (
      <div className="about-page">
        <h2>About StarVPN {version}</h2>
        <div className="about-text">
          <p>
            StarVPN provides fast and secure access to the internet utilizing the most secure
            encryption protocols and anti detection mechanisms. We, at StarVPN strive to protect
            your identity, keeping you feeling safe and secure knowing that we have a strict zero
            logging policy and we would never share your data with third parties.
          </p>
          <p>
            What sets us apart from the competition is our Premium Residential IP Network. Our
            Residential IP Proxy network is distributed among the top Fortune 500 Cable ISP’s in the
            US, ensuring the highest level of anonymity. Perfect for Optimized applications that
            require multiple IP’s to avoid banning or detection.
          </p>
        </div>
        <div className="links-block">
          <span onClick={this.goToAboutUs}>About us</span>
          <span onClick={this.goToProductTour}>Product Tour</span>
          <span onClick={this.goToPrivacyPolicy}>Privacy policy</span>
          <span onClick={this.goToTermsOfService}>Terms of Service</span>
        </div>
        <div className="copyright">
          <span>Copyright©</span>
          <span className="copyright-star">Star Internet Services Inc</span>
        </div>
      </div>
    );
  }
}

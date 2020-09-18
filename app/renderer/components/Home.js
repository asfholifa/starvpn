import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from './statelessComponents/Button';
import app from '../helpers/app';
import Api from '../helpers/api';
import { parseDnsString } from '../helpers/util';
import Select from './statelessComponents/Select';
import { PACKAGE_STATUS, REMAINING_IP_TYPES_MAP } from '../helpers/constants';
import RemainingIpUpdates from './statelessComponents/RestUpdatesTable';
import openExternal from '../helpers/openExternal';

export default class Home extends Component {
  static propTypes = {
    onLogout: PropTypes.func.isRequired,
    setOpenVpnProtocol: PropTypes.func.isRequired,
    goToDashboard: PropTypes.func.isRequired,
    goToUsageStats: PropTypes.func.isRequired,
    setConnectionVPN: PropTypes.func.isRequired,
    setSelectedDns: PropTypes.func.isRequired,
    refreshUserData: PropTypes.func.isRequired,
    selectedDns: PropTypes.string,
  };

  state = {
    dnsServers: {},
  };

  componentDidMount() {
    const {
      user: {
        data: { email },
      },
    } = this.props;

    this.retrieveDnsOptions();
    this.props.refreshUserData(email);
  }

  handleLogout = () => {
    this.props.onLogout({
      data: null,
      loggedIn: false,
    });
  };

  handleDashboard = () => {
    this.props.goToDashboard();
  };

  handleLogs = () => {
    this.props.goToLogs();
  };

  handleUsageStats = () => {
    this.props.goToUsageStats();
  };

  handleProtocol = (value) => {
    const {
      metadataPersisted: { protocol, isOpenVpnDisabled },
      metadata: { isOpenVpnConnected },
      setOpenVpnProtocol,
    } = this.props;

    if (protocol === value) return;

    setOpenVpnProtocol({
      protocol: value,
    });

    if (isOpenVpnConnected && !isOpenVpnDisabled) {
      requestAnimationFrame(() => {
        this.handleDisconnect()
          .then(() => this.connectToVpn())
          .finally(() => this.props.endLoading());
      });
    }
  };

  setOpenVpnStartUpConnect = ({ target: { checked } }) =>
    this.props.setOpenVpnStartUpConnect(checked);

  connectToVpn = () => {
    const {
      metadataPersisted: { selectedDns },
    } = this.props;
    return app.connectToVpn({ dns: this.state.dnsServers[selectedDns] });
  };

  startConnectToVpn = () => this.connectToVpn().finally(() => this.props.endLoading());

  handleDisconnect = () => {
    return app.disconnectVpn();
  };

  startHandleDisconnect = () => this.handleDisconnect().finally(() => this.props.endLoading());

  handleSmartDns = ({ target: { checked } }) => {
    const {
      setSmartDns,
      metadata: { isOpenVpnConnected },
      metadataPersisted: { isOpenVpnDisabled },
    } = this.props;

    if (isOpenVpnConnected && !isOpenVpnDisabled) {
      return this.handleDisconnect()
        .then(() => setSmartDns(checked))
        .then(() => this.connectToVpn())
        .finally(() => this.props.endLoading());
    } else {
      return setSmartDns(checked);
    }
  };

  retrieveDnsOptions = () => {
    Api.getDNSServers()
      .then((response) => parseDnsString(response.data.data))
      .then((dnsServers) => this.setState({ dnsServers }));
  };

  changeDnsServer = ({ target: { value } }) => {
    const {
      metadataPersisted: { isOpenVpnDisabled },
      metadata: { isOpenVpnConnected },
    } = this.props;

    this.props.setSelectedDns(value);
    if (isOpenVpnConnected && !isOpenVpnDisabled) {
      return this.handleDisconnect()
        .then(() => this.connectToVpn())
        .finally(() => this.props.endLoading());
    }
  };

  buyPremium = () => {
    const { upgrade_package_link } = this.props.user.data;
    if (!upgrade_package_link) return;

    return openExternal(upgrade_package_link);
  };

  manageAccount = () =>
    openExternal('https://www.starvpn.com/dashboard/clientarea.php?action=services');

  reactivateFreePlan = () => {
    const {
      data: { email },
      auth_token,
    } = this.props.user;
    this.props.startLoading('Reactivating free vpn');
    Api.reactivateFreeVpn({ email, auth_token })
      .then(() => this.props.refreshUserData(email))
      .finally(() => this.props.endLoading());
  };

  getCurrentRemainingIpUpdates = (allRemainingIpUpdates, currentSlot, currentIpType = '') => {
    if (!allRemainingIpUpdates) return 0;
    // ip_types - array (zero-based) of objects (keys: ip_type)
    // remaining_ip_updates - array-like object (one-base) of objects with keys [ip_type]:value
    // currentSlot - one based slot number
    // formats are weird
    // TODO: map incoming data to more usable data structures after validations

    const ipTypeName = REMAINING_IP_TYPES_MAP[currentIpType.toLowerCase()];
    const slotRemainingUpdates = allRemainingIpUpdates[currentSlot];
    return slotRemainingUpdates && slotRemainingUpdates[ipTypeName]
      ? slotRemainingUpdates[ipTypeName]
      : 0;
  };

  render() {
    const { dnsServers } = this.state;
    const {
      user: {
        data: {
          package: subscription,
          upgrade_package_link,
          remaining_ip_updates,
          ip_types,
          status,
        },
      },
      metadataPersisted: {
        shouldOpenVpnConnectOnStartUp,
        isOpenVpnDisabled,
        protocol,
        selectedDns,
        isSmartVpnEnabled,
      },
      metadata: { isOpenVpnConnected },
      slots: {
        currentSlotData: { port: currentSlot, ip_type: currentIpType },
      },
    } = this.props;

    const remainingIpUpdates = this.getCurrentRemainingIpUpdates(
      remaining_ip_updates,
      currentSlot,
      currentIpType,
    );

    return (
      <div className="dashboard-page">
        <div className="dashboard-top">
          <h3 className="dashboard-title">Main</h3>
          {subscription && (
            <Button
              style="dashboard-button-main"
              disabled={!ip_types || !ip_types.length || isOpenVpnDisabled}
              name="Dashboard"
              onClick={this.handleDashboard}
            />
          )}
          <Button style="dashboard-button-logout" name="Logout" onClick={this.handleLogout} />
        </div>
        <hr className="dashboard-line" />
        <div className="dashboard-connect">
          <p className="dashboard-label">
            Package:{' '}
            <b>
              {status === PACKAGE_STATUS.TERMINATED
                ? 'No active plan'
                : subscription
                ? subscription
                : 'No active'}
            </b>
          </p>
          <p className="dashboard-label">
            Package status: {status}{' '}
            {status === PACKAGE_STATUS.TERMINATED ? (
              <Button
                name="Reactivate"
                style="dashboard-vpn-active"
                onClick={this.reactivateFreePlan}
              />
            ) : (
              ''
            )}
          </p>
          <RemainingIpUpdates value={remainingIpUpdates} />
          <p className="dashboard-label">VPN</p>
          <div className="dashboard-flex-buttons">
            {isOpenVpnConnected ? (
              <Button
                style="dashboard-vpn-inactive"
                name="Disconnect"
                disabled={isOpenVpnDisabled}
                onClick={this.startHandleDisconnect}
              />
            ) : (
              <Button
                style="dashboard-vpn-active"
                name="Connect"
                disabled={isOpenVpnDisabled}
                onClick={this.startConnectToVpn}
              />
            )}
            <Button name="Connection Logs" onClick={this.handleLogs} />
            <Button name="Usage Stats" onClick={this.handleUsageStats} />
          </div>
          <p className="dashboard-label">Protocol</p>
          <div className="dashboard-flex-buttons">
            <Button
              style={
                protocol !== 'tcp' ? 'dashboard-protocol-active' : 'dashboard-protocol-inactive'
              }
              disabled={!subscription}
              name="UDP"
              onClick={() => this.handleProtocol('udp')}
            />
            <Button
              style={
                protocol === 'tcp' ? 'dashboard-protocol-active' : 'dashboard-protocol-inactive'
              }
              disabled={!subscription}
              name="TCP"
              onClick={() => this.handleProtocol('tcp')}
            />
          </div>
          <p className="dashboard-smart-dns">
            <input
              checked={isSmartVpnEnabled}
              type="checkbox"
              onChange={this.handleSmartDns}
              disabled={!subscription}
              id="smartDns"
            />
            <label className="dashboard-text" htmlFor="smartDns">
              Smart VPN
            </label>
          </p>
          <div>
            <span className="dashboard-text">Choose DNS option: </span>
            <Select
              selected={selectedDns}
              className="dashboard-select-dns"
              values={Object.keys(dnsServers).map((e) => ({ value: e, label: e }))}
              onChange={this.changeDnsServer}
              disabled={isSmartVpnEnabled}
            />
          </div>
          <p className="dashboard-smart-dns">
            <input
              checked={shouldOpenVpnConnectOnStartUp}
              type="checkbox"
              onChange={this.setOpenVpnStartUpConnect}
              disabled={!subscription || isOpenVpnDisabled}
              id="openVpnConnectOnStartUp"
            />
            <label className="dashboard-text" htmlFor="openVpnConnectOnStartUp">
              Connect VPN on start up
            </label>
          </p>
          <br />
          <p className="dashboard-label">Manage account</p>
          <div className="dashboard-flex-buttons">
            {upgrade_package_link && <Button name="Update Plan" onClick={this.buyPremium} />}
            <Button name="Manage Account" onClick={this.manageAccount} />
          </div>
        </div>
      </div>
    );
  }
}

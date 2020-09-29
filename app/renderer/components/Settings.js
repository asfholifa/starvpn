import map from 'lodash/map';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Select from './statelessComponents/MainSelect';
import Api from '../helpers/api';
import { parseDnsString } from '../helpers/util';
import app from '../helpers/app';
import Toggle from './statelessComponents/Toggle';
import ToggleBlocked from './statelessComponents/ToggleBlocked'
import { ipcRenderer } from 'electron';

const protocols = [{ label: 'UDP', value: 'udp' }, { label: 'TCP', value: 'tcp' }];

export default class Settings extends PureComponent {
  static propTypes = {
    setSelectedDns: PropTypes.func.isRequired,
    setOpenVpnProtocol: PropTypes.func.isRequired,
    refreshUserData: PropTypes.func.isRequired,
    setSmartDns: PropTypes.func.isRequired,
    setAutoUpdate: PropTypes.func.isRequired,
    selectedDns: PropTypes.string,
    setOpenVpnStartUpConnect: PropTypes.func.isRequired,
  };

  state = {
    modal: [{
      status: [],
      option: 'close'
    }],
    dnsServers: {},
  };

  componentDidMount() {
    this.retrieveDnsOptions();
  }

  retrieveDnsOptions = () => {
    Api.getDNSServers()
      .then((response) => parseDnsString(response.data.data))
      .then((dnsServers) => this.setState({ dnsServers }));
  };

  connectToVpn = () => {
    const { metadataPersisted: { selectedDns } = {} } = this.props;
    return app.connectToVpn({ dns: this.state.dnsServers[selectedDns] });
  };

  handleDisconnect = () => {
    return app.disconnectVpn();
  };

  changeDnsServer = ({ target: { value } }) => {
    const {
      metadataPersisted: { isOpenVpnDisabled } = {},
      metadata: { isOpenVpnConnected } = {},
    } = this.props;

    this.props.setSelectedDns(value);
    if (isOpenVpnConnected && !isOpenVpnDisabled) {
      return this.handleDisconnect()
        .then(() => this.connectToVpn())
        .finally(() => this.props.endLoading());
    }
  };

  changeProtocol = ({ target: { value } }) => {
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

  handleAutoUpdate = ({ target: { checked } }) => {
    this.props.setAutoUpdate(checked);
  };

  handleOpenVpnStartUpConnect = ({ target: { checked } }) => {
    const { setOpenVpnStartUpConnect = noop } = this.props;
    setOpenVpnStartUpConnect(checked);
  };

  openLogs = () => {
    ipcRenderer.send('get-connection-log');
  };

  render() {
    const { dnsServers, modal } = this.state;
    const {
      user: { data: { package: subscription } = {} } = {},
      metadataPersisted: {
        selectedDns,
        isSmartVpnEnabled,
        protocol,
        autoUpdate,
        shouldOpenVpnConnectOnStartUp,
      },
    } = this.props;

    const listWithToggle = [
      {
        checked: shouldOpenVpnConnectOnStartUp,
        description: 'If VPN connection is active on device shutdown, try to reconnect on reboot.',
        handleChange: this.handleOpenVpnStartUpConnect,
        title: 'Reconnect on Reboot',
      },
      {
        title: 'WebRTC Leak Protection',
        description: 'Keep your connection safe and secure from 3rd party API services.',
        checked: true,
        disabled: false,
      },
      {
        title: 'DNS Leak Protection',
        description: 'Force DNS over VPN connection, block outside DNS.',
        checked: true,
        disabled: false,
      },
      {
        title: 'Software Updates',
        description: 'Automatically download and Install the latest software updates.',
        checked: true,
        disabled: true,
      },
    ];

    const showModal = () => {
      if(!isSmartVpnEnabled){
        if(modal[0].option === 'close'){
          this.setState({ modal: [{
            status: [1],
            option: 'open'
          }]});
        } else if(modal[0].option === 'open'){
          this.setState({modal: [{
            status: [],
            option: 'start'
          }]});
          console.log(!!isSmartVpnEnabled)
        } else if(modal[0].option === 'start'){
          this.setState({modal: [{
            status: [],
            option: 'close'
          }]});
        }
      } else {
        this.setState({modal: [{
          status: [],
          option: 'close'
        }]});
      }
    }

    return (
      <div className="settings-page">
        {this.state.modal[0].status.map(item => (
           <div key={Date.now()} id="openModal" className="modal">
           <div className="modal-dialog">
             <div className="modal-content">
               <div className="modal-header">
                 <h3 className="modal-title">Warning</h3>
                 <a onClick={showModal} title="Close" className="close">×</a>
               </div>
               <div className="modal-body">
                 <p>Smart VPN service is recommended for Datacenter IP Type only.</p>
               </div>
               <div className="modal-body">
                <a
                 className="styled-btn modalConnectButton"
                 onClick={showModal}
                 >
                 Go Back
                </a>
                <a
                 className="styled-btn modalConnectButton"
                 onClick={showModal}
                 >
                 Ok
                </a>
               </div>
             </div>
           </div>
         </div>
        ))}
        <div className="title-block">
          <h2>Settings</h2>
        </div>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-text">
              <h4 className="settings-title">Choose DNS Server</h4>
              <span className="settings-description">
                Choose the DNS Server for your VPN Connection.
              </span>
            </div>
            <Select
              selected={selectedDns}
              values={map(dnsServers, (value, key) => ({ value: key, label: key }))}
              onChange={this.changeDnsServer}
              disabled={isSmartVpnEnabled}
            />
          </div>
          <div className="settings-item">
            <div className="settings-text">
              <h4 className="settings-title">VPN Protocol</h4>
              <span className="settings-description">
                Set the VPN Protocol used for the connection.
              </span>
            </div>
            <Select
              selected={protocol}
              values={map(protocols, (e) => ({ value: e.value, label: e.label }))}
              onChange={this.changeProtocol}
              disabled={!subscription}
            />
          </div>
          <div className="settings-item">
            <div className="settings-text">
              <h4 className="settings-title">Enable Smart VPN</h4>
              <span className="settings-description">Media Streamer/Unblocker. Unblock your favourite websites and streaming services.</span>
            </div>
            {(modal[0].option !== 'start' && !isSmartVpnEnabled) && <ToggleBlocked
            onClick={showModal}/>}
            {(modal[0].option === 'start' || isSmartVpnEnabled) && <Toggle
              checked={isSmartVpnEnabled}
              disabled={!subscription}
              onChange={this.handleSmartDns}
              onClick={showModal}
            />}
          </div>
          {map(listWithToggle, (item, index) => (
            <div key={index} className="settings-item">
              <div className="settings-text">
                <h4 className="settings-title">{item.title}</h4>
                <span className="settings-description">{item.description}</span>
              </div>
              <Toggle
                checked={item.checked}
                disabled={item.disabled}
                onChange={item.handleChange}
              />
            </div>
          ))}
          <div className="download-item">
            <div className="download-title">
              <div className="download-img" />
              <span onClick={this.openLogs}>Download Log File</span>
            </div>
            <span className="settings-description">
              Share this log file with our support in a case of troubleshooting
            </span>
          </div>
        </div>
      </div>
    );
  }
}

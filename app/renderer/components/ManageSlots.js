import classNames from 'classnames';
import find from 'lodash/find';
import get from 'lodash/get';
import head from 'lodash/head';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import noop from 'lodash/noop';
import toLower from 'lodash/toLower';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import StyledButton from './statelessComponents/StyledButton';
import { IP_TYPES_MAPPING } from '../reducers/slots';
import app from '../helpers/app';
import Api from '../helpers/api';
import { parseDnsString } from '../helpers/util';
import SlotConfigurations from './statelessComponents/slotConfigurations';
import TextField from './statelessComponents/TextField';
import openExternal from '../helpers/openExternal';
import {
  REMAINING_IP_TYPES_MAP,
  PACKAGE_STATUS,
  IP_TYPES,
} from '../helpers/constants';
import sortOptions from '../helpers/sortOptions';

export default class ManageSlots extends PureComponent {
  static propTypes = {
    getAvailableData: PropTypes.func.isRequired,
    ipTypes: PropTypes.shape({}),
    setSlotAsActive: PropTypes.func.isRequired,
    saveSlotConfigurationToApi: PropTypes.func.isRequired,
    updateDnsUser: PropTypes.func.isRequired,
    slotsList: PropTypes.array,
    refreshActiveSlotData: PropTypes.func.isRequired,
    updateSlotName: PropTypes.func.isRequired,
  };

  state = {
    modal: [{
      status: [1],
      option: 'close'
    }],
    userIpTypes: [],
    dnsServers: {},
    showSlotNameInput: false,
    currentSlot: undefined,
    isSlotSaved: false,
    slotName: undefined,
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    if (
      get(nextProps, 'user.ip_types', []) !== prevState.userIpTypes &&
      !prevState.wasUpdated
    ) {
      return {
        userIpTypes: get(nextProps, 'user.ip_types', []),
        wasUpdated: true,
      };
    }
    return null;
  }

  componentDidMount() {
    const { refreshUserData = noop, userEmail } = this.props;
    this.retrieveDnsOptions();
    refreshUserData(userEmail, false);
    this.props.getAvailableData().then(() => {
      const {
        availableIpTypes,
        currentSavedSlot: { ip_type },
      } = this.props;
      this.refreshCurrentSlot();
      if (availableIpTypes.length === 1 && ip_type !== availableIpTypes[0]) {
        console.log(`Setting FREE IP TYPE`);
        this.onTypeChoose({
          target: {
            getAttribute() {
              return `types-${get(this.state, 'currentSlot.port')}`;
            },
            value: availableIpTypes[0],
          },
        });
      }
    });
  }

  refreshCurrentSlot = () => {
    const {
      slotsList,
      activeSlot: { port: activePort } = {},
      refreshActiveSlotData,
    } = this.props;
    console.info(`Updating current slot`);
    const foundSlot = slotsList.filter(({ port }) => port === activePort)[0];
    if (!foundSlot) {
      return console.debug(`Not found last configuration: `);
    }
    refreshActiveSlotData(foundSlot);
  };

  getDefaultSelectValues = ({ ip_type, country, region }) => {
    const { ipTypes } = this.props;
    const { countries } = ipTypes[IP_TYPES_MAPPING[ip_type]];
    const countriesSortedByName = sortOptions(countries);
    const selectedCountry = country || get(head(countriesSortedByName), 'key');
    const { region: regions } = countries[selectedCountry];
    const regionsSortedByName = sortOptions(regions);
    const selectedRegion = region || get(head(regionsSortedByName), 'key');
    const { isp: isps, timeinterval: intervals } = find(regions, [
      'key',
      selectedRegion,
    ]);
    const selectedLastValue = isps
      ? { isp: get(head(sortOptions(isps)), 'key'), ti: null }
      : { ti: get(head(sortOptions(intervals)), 'key'), isp: null };

    return {
      ip_type,
      country: selectedCountry,
      region: selectedRegion,
      ...selectedLastValue,
    };
  };

  onTypeChoose = ({ target }) => {
    const elName = target.getAttribute('name');
    const port = elName.split('-')[1];

    const ipTypesList = map(this.state.userIpTypes, (item) => {
      if (item.port === Number.parseInt(port)) {
        const ip_type = IP_TYPES_MAPPING[target.value];
        const countries = get(this.props, ['ipTypes', ip_type, 'countries']);
        const defaultCountry = head(sortOptions(countries));
        const regions = get(defaultCountry, 'region');

        const defaultRegion = head(sortOptions(regions));
        const isps = get(defaultRegion, 'isp');
        const intervals = get(defaultRegion, 'timeinterval');

        const defaultLastValue = isps
          ? { isp: get(head(sortOptions(isps)), 'key'), ti: null }
          : { ti: get(head(sortOptions(intervals)), 'key'), isp: null };
        return {
          ...item,
          ip_type: target.value,
          country: get(defaultCountry, 'key'),
          region: get(defaultRegion, 'key'),
          ...defaultLastValue,
        };
      }
      return item;
    });
    this.setState({ userIpTypes: ipTypesList });
  };

  onCountrySelect = ({ target }) => {
    const elName = target.getAttribute('name');
    const port = elName.split('-')[1];

    const ipTypesList = map(this.state.userIpTypes, (item) => {
      if (item.port === Number(port)) {
        const updatedCurrentSlot = {
          ...item,
          ...this.getDefaultSelectValues({
            ip_type: item.ip_type,
            country: target.value,
          }),
        };
        return { ...updatedCurrentSlot };
      }
      return item;
    });
    this.setState({ userIpTypes: ipTypesList });
  };

  onRegionSelect = ({ target }) => {
    const elName = target.getAttribute('name');
    const port = elName.split('-')[1];

    const ipTypesList = map(this.state.userIpTypes, (item) => {
      if (item.port === Number(port)) {
        const updatedCurrentSlot = {
          ...item,
          ...this.getDefaultSelectValues({
            ip_type: item.ip_type,
            country: item.country,
            region: target.value,
          }),
        };
        return { ...updatedCurrentSlot };
      }
      return item;
    });
    this.setState({ userIpTypes: ipTypesList });
  };

  onIspsSelect = ({ target }) => {
    const elName = target.getAttribute('name');
    const port = elName.split('-')[1];

    const ipTypesList = map(this.state.userIpTypes, (item) => {
      if (item.port === Number(port)) {
        const defaultLastValue = {};
        if (item.isp) {
          defaultLastValue.isp = target.value;
        } else {
          defaultLastValue.ti = target.value;
        }
        return { ...item, ...defaultLastValue };
      }
      return item;
    });
    this.setState({ userIpTypes: ipTypesList });
  };

  retrieveDnsOptions = () => {
    Api.getDNSServers()
      .then((response) => parseDnsString(response.data.data))
      .then((dnsServers) => this.setState({ dnsServers }));
  };

  connectToVpn = (item) => {
    const {
      showError,
      endLoading,
      setSlotAsActive,
      updateDnsUser,
      user,
      metadataPersisted: { selectedDns },
    } = this.props;

    const savedSlot = find(user.ip_types, { port: item.port });

    const isChanged = this.isChanged(item, savedSlot);

    const { vpnusername, vpnpassword, port } = item;
    if (!vpnpassword || !vpnusername) {
      return showError(
        `Missed required fields for slot ${port}. Please contact support...`,
      );
    }
    return (isChanged ? this.saveSlotConfiguration(item) : Promise.resolve())
      .then(() => updateDnsUser(item))
      .then(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(setSlotAsActive(item, selectedDns)), 0),
          ),
      )
      .catch((err) => {
        showError(err.message || 'Error set current slot as active!');
        console.log(`Slot could not be set as active `);
        console.error(err);
      })
      .finally(endLoading);
  };

  saveSlotConfiguration = (item) => {
    const {
      userEmail,
      endLoading,
      refreshUserData,
      saveSlotConfigurationToApi,
      auth_token,
    } = this.props;
    const currentTypeData = IP_TYPES_MAPPING[item.ip_type.toLowerCase()];
    const { country, region } = item;

    return saveSlotConfigurationToApi(
      { ...item, userEmail, ip_type: currentTypeData },
      auth_token,
    )
      .then(() => refreshUserData(userEmail, false))
      .catch((err) => {
        this.props.showError(
          err.message || 'Error saving slots configuration!',
        );
        console.error(err);
      })
      .finally(() => {
        app.updateXYCoordinates({ country, region });
        app.refreshPublicIp();
        endLoading();
        this.setState({ isSlotSaved: true });
      });
  };

  updateIP = async (item) => {
   // if()
    const { refreshUserData, userEmail, auth_token } = this.props;
    await this.props.updateIP({ ...item, userEmail }, auth_token);
    await refreshUserData(userEmail, false);
    app.refreshPublicIp();
  };

  buyPremium = () => {
    const { upgrade_package_link } = this.props.user;
    if (!upgrade_package_link) return;

    return openExternal(upgrade_package_link);
  };

  handleDisconnect = () => {
    return app.disconnectVpn();
  };

  startHandleDisconnect = () =>
    this.handleDisconnect().finally(() => this.props.endLoading());

  editSlotName = (index, slotName) => {
    this.setState({ showSlotNameInput: true, currentSlot: index, slotName });
  };

  onSlotNameChange = (e) => {
    this.setState({ slotName: e.target.value });
  };

  onSlotNameBlur = (port) => {
    this.setState({ showSlotNameInput: false });
    this.props.updateSlotName({
      email: this.props.userEmail,
      port,
      slotName:
        this.state.slotName !== ''
          ? this.state.slotName
          : this.getDefaultSlotName(port),
    });
  };

  getDefaultSlotName = (port) => `Slot ${port}`;

  isChanged = (slot, savedSlot) => {
    let isChanged = false;
    Object.keys(slot).forEach((key) => {
      if (slot && slot[key] && savedSlot[key] !== slot[key]) {
        isChanged = true;
      }
    });
    if (isChanged) {
      this.setState({ isSlotSaved: false });
    }
    return isChanged;
  };

  render() {
    const {
      user = {},
      ipTypes,
      availableIpTypes,
      activeSlot = {},
      isOpenVpnConnected,
      isPremium,
      slotNames,
    } = this.props;
    const { remaining_ip_updates: remainingIpUpdates, status } = user;

    const {
      userIpTypes,
      showSlotNameInput,
      currentSlot,
      isSlotSaved,
    } = this.state;

    const isCurrentSlotConnected = (port) => {
      return activeSlot.port === port && isOpenVpnConnected;
    };

    const slotText = user.totalslots > 1 ? 'slots' : 'slot';

    if (status !== PACKAGE_STATUS.ACTIVE) {
      return (
        <div className="manage-slots-page">
          <h2>Manage Slots</h2>
          <h3 className="setup-title">
            Your subscription is {toLower(status)}.
          </h3>
        </div>
      );
    }

    const modalShow = () => {
      const { modal } = this.state;
      if(user.package === 'Free VPN'){
        this.setState({ modal: [{
          status: [1],
          option: 'open'
        }]});
      } else {
        this.updateIP(item);
      }
    }

    const closeModal = () => {
      const { modal } = this.state;
      if(modal[0].status.length){
        this.setState({ modal: [{
          status: [],
          option: 'close'
        }]});
      }
    }

    return (
      <div className="manage-slots-page">
        {this.state.modal[0].status.map(item => (
           <div key={Date.now()} id="openModal" className="modal">
           <div className="modal-dialog">
             <div className="modal-content">
               <div className="modal-header">
                 <h3 className="modal-title">Warning</h3>
                 <a onClick={closeModal} title="Close" className="close">×</a>
               </div>
               <div className="modal-body">
                 <p>This feature is for paid members only.</p>
               </div>
               <div className="modal-body">
                 <a
                 className="styled-btn modalConnectButton"
                 onClick={closeModal}
                 >
                 Ok
                 </a>
               </div>
             </div>
           </div>
         </div>
        ))}
        <h2>Manage Slots</h2>
        <h3 className="setup-title">
          You have <strong>{user.totalslots} available</strong> {slotText}
        </h3>
        {map(userIpTypes, (item, index) => {
          const isDisabled =
            (activeSlot.port !== item.port &&
              !isEmpty(activeSlot) &&
              isOpenVpnConnected) ||
            (!item.country ||
              item.country === 'Please Select' ||
              !item.region ||
              item.region === 'Please Select' ||
              (item.ip_type === IP_TYPES.ROTATING_RESIDENTAL_IP
                ? !item.ti || item.ti === 'Please Select'
                : !item.isp || item.isp === 'Please Select'));

          const savedSlot = find(user.ip_types, ['port', item.port]);

          const isChanged = this.isChanged(item, savedSlot);

          const port = index + 1;
          const slotName =
            slotNames && slotNames[port] !== undefined
              ? slotNames[port]
              : this.getDefaultSlotName(port);
          const remainingIpUpdatesForSlot = get(remainingIpUpdates, [
            item.port,
            REMAINING_IP_TYPES_MAP[toLower(item.ip_type)],
          ]);

          const remainingIpUpdatesText = `Remaining IP updates: ${remainingIpUpdatesForSlot ||
            0}`;

          return (
            <div key={index} className="slots-container">
              <div className="configure-block">
                <div className="top-block">
                  <span className={isDisabled ? 'disabled' : undefined}>
                    <strong>IP Configuration</strong> for
                    {(!showSlotNameInput ||
                      (showSlotNameInput && index !== currentSlot)) && (
                      <strong
                        id={`slot_${index}`}
                        className="slot-name"
                        onClick={() => this.editSlotName(index, slotName)}
                        title="Edit name of the slot">
                        <span>{slotName}</span>
                        <span className="edit-img" />
                      </strong>
                    )}
                    {showSlotNameInput && index === currentSlot && (
                      <TextField
                        name={`slot_name_${port}`}
                        value={this.state.slotName}
                        onChange={this.onSlotNameChange}
                        onBlur={(e) => this.onSlotNameBlur(port, e)}
                      />
                    )}
                  </span>
                  <div title={remainingIpUpdatesText}>
                    <span
                      onClick={
                        isDisabled
                          ? undefined
                          : isCurrentSlotConnected(item.port)
                          ? this.startHandleDisconnect
                          : () => this.connectToVpn(item)
                      }
                      className={classNames(
                        'connect-title',
                        isDisabled && 'disabled',
                      )}>
                      <strong>
                        {isCurrentSlotConnected(item.port)
                          ? 'Disconnect'
                          : 'Connect'}
                      </strong>
                    </span>
                    <button
                      className={classNames(
                        'connection-btn',
                        isCurrentSlotConnected(item.port) && 'connect-btn',
                      )}
                      onClick={
                        isCurrentSlotConnected(item.port)
                          ? this.startHandleDisconnect
                          : () => this.connectToVpn(item)
                      }
                      disabled={isDisabled}>
                      <div className="connect-img" />
                    </button>
                  </div>
                </div>
                <SlotConfigurations
                  availableIpTypes={availableIpTypes}
                  ipTypes={ipTypes || {}}
                  item={item}
                  onCountrySelect={this.onCountrySelect}
                  onIspsSelect={this.onIspsSelect}
                  onRegionSelect={this.onRegionSelect}
                  onTypeChoose={this.onTypeChoose}
                />
              </div>
              <div className="buttons-block">
                <div className="remaining-ip-updates">
                  <span>{remainingIpUpdatesText}</span>
                </div>
                <StyledButton
                  label="Update IP"
                  disabled={!isCurrentSlotConnected(item.port) || isPremium}
                  onClick={modalShow}
                  title={remainingIpUpdatesText}
                />
                <StyledButton
                  label="Save Settings"
                  disabled={!isChanged || isSlotSaved}
                  onClick={() => this.saveSlotConfiguration(item)}
                />
              </div>
            </div>
          );
        })}
        {user.upgrade_package_link && (
          <div className="one-more-slot">
            <h4>Thinking of adding more slots?</h4>
            <StyledButton onClick={this.buyPremium} label="Upgrade Plan" />
          </div>
        )}
      </div>
    );
  }
}

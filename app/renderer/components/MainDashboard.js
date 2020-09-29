import classNames from 'classnames';
import find from 'lodash/find';
import get from 'lodash/get';
import head from 'lodash/head';
import isEmpty from 'lodash/isEmpty';
import join from 'lodash/join';
import map from 'lodash/map';
import noop from 'lodash/noop';
import toLower from 'lodash/toLower';
import values from 'lodash/values';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import StyledButton from './statelessComponents/StyledButton';
import { IP_TYPES_MAPPING } from '../reducers/slots';
import app from '../helpers/app';
import Api from '../helpers/api';
import { parseDnsString } from '../helpers/util';
import SlotConfigurations from './statelessComponents/slotConfigurations';
import Select from './statelessComponents/MainSelect';
import StatsChart from './statelessComponents/StatsChart';
import sortOptions from '../helpers/sortOptions';
import { REMAINING_IP_TYPES_MAP } from '../helpers/constants';

const CHART_STYLE = { maxHeight: '100px' };

export default class MainDashboard extends PureComponent {
  static propTypes = {
    getAvailableData: PropTypes.func.isRequired,
    ipTypes: PropTypes.shape({}),
    setSlotAsActive: PropTypes.func.isRequired,
    saveSlotConfigurationToApi: PropTypes.func.isRequired,
    updateDnsUser: PropTypes.func.isRequired,
    slotsList: PropTypes.array,
    refreshActiveSlotData: PropTypes.func.isRequired,
  };

  state = {
    userIpTypes: [],
    currentSlot: {},
    dnsServers: {},
    isSlotSaved: false,
    selectValue: []
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const ipTypes = get(nextProps, 'user.ip_types', []);
    const activeSLot = get(nextProps, 'activeSlot');
    if (ipTypes !== prevState.userIpTypes && !prevState.wasUpdated) {
      return {
        userIpTypes: ipTypes,
        currentSlot: find(ipTypes, {
          port: isEmpty(activeSLot) ? 1 : get(nextProps, 'activeSlot.port'),
        }),
        wasUpdated: true,
      };
    }
    return null;
  }

  componentDidMount() {
    const {
      userEmail,
      metadataPersisted: { shouldOpenVpnConnectOnStartUp } = {},
      setIsStartup = noop,
      isStartup,
    } = this.props;
    this.props.refreshUserData(userEmail);
    this.retrieveDnsOptions();
    this.props.getAvailableData().then(() => {
      const {
        availableIpTypes,
        currentSavedSlot: { ip_type },
      } = this.props;
      this.refreshCurrentSlot();
      if (availableIpTypes.length === 1 && ip_type !== availableIpTypes[0]) {
        console.log(`Setting FREE IP TYPE`);
        this.onTypeChoose({ target: { value: availableIpTypes[0] } });
      }
    });
    if (isStartup && shouldOpenVpnConnectOnStartUp) {
      this.connectToVpn();
    }
    if (isStartup) {
      setIsStartup(false);
    }
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
    const selectedCountry = country || get(head(sortOptions(countries)), 'key');
    const { region: regions } = countries[selectedCountry];
    const selectedRegion = region || get(head(sortOptions(regions)), 'key');
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

  onTypeChoose = ({ target: { value } }) => {
    const { userIpTypes, currentSlot } = this.state;
    const ipTypesList = map(userIpTypes, (item) => {
      if (item.port === Number.parseInt(currentSlot.port, 10)) {
        const ip_type = IP_TYPES_MAPPING[value];
        const countries = get(this.props, ['ipTypes', ip_type, 'countries']);
        const countriesSortedByName = sortOptions(countries);
        const defaultCountry = head(countriesSortedByName);
        const regions = get(defaultCountry, 'region');
        const defaultRegion = head(values(regions));
        const isps = get(defaultRegion, 'isp');
        const intervals = get(defaultRegion, 'timeinterval');

        const defaultLastValue = isps
          ? { isp: get(head(sortOptions(isps)), 'key'), ti: null }
          : { ti: get(head(sortOptions(intervals)), 'key'), isp: null };

        const preparedSlot = {
          ...item,
          ip_type: value,
          country: get(defaultCountry, 'key'),
          region: get(defaultRegion, 'key'),
          ...defaultLastValue,
        };

        this.setState({ currentSlot: preparedSlot });

        return preparedSlot;
      }
      return item;
    });
    this.setState({ userIpTypes: ipTypesList });
  };

  onCountrySelect = ({ label, value }) => {
    const { userIpTypes, currentSlot } = this.state;
    const ipTypesList = map(userIpTypes, (item) => {
      if (item.port === Number(currentSlot.port)) {
        const updatedCurrentSlot = {
          ...item,
          ...this.getDefaultSelectValues({
            ip_type: item.ip_type,
            country: value,
          }),
        };
        this.setState({ currentSlot: updatedCurrentSlot });
        return { ...updatedCurrentSlot };
      }
      return item;
    });
    this.setState({ userIpTypes: ipTypesList, selectValue: [{value, label}] });
  };

  onRegionSelect = ({ target: { value } }) => {
    const { userIpTypes, currentSlot } = this.state;
    const ipTypesList = map(userIpTypes, (item) => {
      if (item.port === Number(currentSlot.port)) {
        const updatedCurrentSlot = {
          ...item,
          ...this.getDefaultSelectValues({
            ip_type: item.ip_type,
            country: item.country,
            region: value,
          }),
        };
        this.setState({ currentSlot: updatedCurrentSlot });
        return { ...updatedCurrentSlot };
      }
      return item;
    });
    this.setState({ userIpTypes: ipTypesList });
  };

  onIspsSelect = ({ target: { value } }) => {
    const { userIpTypes, currentSlot } = this.state;
    const ipTypesList = map(userIpTypes, (item) => {
      if (item.port === Number.parseInt(currentSlot.port)) {
        const defaultLastValue = {};
        if (item.isp) {
          console.info('isp', value);
          defaultLastValue.isp = value;
        } else {
          defaultLastValue.ti = value;
        }
        this.setState({ currentSlot: { ...item, ...defaultLastValue } });
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

  isChanged = (slot, savedSlot) => {
    const currentTypeData = IP_TYPES_MAPPING[slot.ip_type.toLowerCase()];
    const preparedSlot = { ...slot, ip_type: currentTypeData };
    let isChanged = false;

    Object.keys(preparedSlot).forEach((key) => {
      if (preparedSlot[key] && savedSlot[key] !== preparedSlot[key]) {
        isChanged = true;
        setTimeout(() => this.setState({ isSlotSaved: false }), 0);
      }
    });
    return isChanged;
  };

  connectToVpn = () => {
    const {
      showError,
      endLoading,
      setSlotAsActive,
      updateDnsUser,
      user,
      metadataPersisted: { selectedDns },
    } = this.props;
    const { currentSlot, dnsServers } = this.state;

    const savedSlot = find(user.ip_types, { port: currentSlot.port });

    const isChanged = this.isChanged(currentSlot, savedSlot);

    const { vpnusername, vpnpassword, port } = currentSlot;
    if (!vpnpassword || !vpnusername) {
      return showError(
        `Missed required fields for slot ${port}. Please contact support...`,
      );
    }
    return (isChanged ? this.saveSlotConfigurationLoading() : Promise.resolve())
      .then(() => updateDnsUser(currentSlot))
      .then(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(setSlotAsActive(currentSlot, dnsServers[selectedDns])),
              0,
            ),
          ),
      )
      .catch((err) => {
        showError(err.message || 'Error set current slot as active!');
        console.log(`Slot could not be set as active `);
        console.error(err);
      })
      .finally(endLoading());
  };

  saveSlotConfigurationLoading = () => {
    const {
      userEmail,
      endLoading,
      saveSlotConfigurationToApi,
      auth_token,
      refreshUserData = noop,
    } = this.props;
    const { currentSlot } = this.state;
    const { country, region } = currentSlot;

    const currentTypeData = IP_TYPES_MAPPING[currentSlot.ip_type.toLowerCase()];

    return saveSlotConfigurationToApi(
      { ...currentSlot, userEmail, ip_type: currentTypeData },
      auth_token,
    )
      .then(() => refreshUserData(userEmail, false))
      .catch((err) => {
        this.props.showError(
          err.message || 'Error saving slots configuration!',
        );
        console.error(err);
      })
      .then(() => {
        app.updateXYCoordinates({ country, region });
        app.refreshPublicIp();
        this.setState({ isSlotSaved: true });
      });
  };


  saveSlotConfiguration = () => {
    const {
      userEmail,
      endLoading,
      saveSlotConfigurationToApi,
      auth_token,
      refreshUserData = noop,
    } = this.props;
    const { currentSlot } = this.state;
    const { country, region } = currentSlot;

    const currentTypeData = IP_TYPES_MAPPING[currentSlot.ip_type.toLowerCase()];

    return saveSlotConfigurationToApi(
      { ...currentSlot, userEmail, ip_type: currentTypeData },
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

  handleDisconnect = () => {
    return app.disconnectVpn();
  };

  startHandleDisconnect = () =>
    this.handleDisconnect().finally(() => this.props.endLoading());

  changeSlot = ({ target: { value } }) => {
    const { userIpTypes } = this.state;
    this.setState({ currentSlot: find(userIpTypes, { port: Number(value) }) });
  };

  render() {
    const {
      user,
      ipTypes,
      availableIpTypes,
      activeSlot = {},
      isOpenVpnConnected,
      networkName,
      publicIp,
      geoLocation,
      slotNames,
    } = this.props;

    let locationStyle;
    if (geoLocation) {
      locationStyle = {
        left: geoLocation.x * 0.95 + 5,
        top: geoLocation.y + 15,
      };
    }

    const { currentSlot, userIpTypes, isSlotSaved } = this.state;

    const { data, labels, total, bytesIn, bytesOut } = this.props.usage;
    const { remaining_ip_updates: remainingIpUpdates } = user;
    const remainingIpUpdatesForSlot = currentSlot
      ? get(remainingIpUpdates, [
          currentSlot.port,
          REMAINING_IP_TYPES_MAP[toLower(currentSlot.ip_type)],
        ])
      : 0;
    const remainingIpUpdatesText = `Remaining IP updates: ${remainingIpUpdatesForSlot ||
      0}`;

    const usedMb = Math.round(total / 1024 / 1024);

    const isCurrentSlotConnected = () => {
      if (!currentSlot) {
        return false;
      }
      return activeSlot.port === currentSlot.port && isOpenVpnConnected;
    };
    const savedSlot = find(user.ip_types, { port: get(currentSlot, 'port') });
    let currentTypeData,
      isChanged = false,
      isDisabled = true;
    if (savedSlot) {
      currentTypeData = IP_TYPES_MAPPING[savedSlot.ip_type.toLowerCase()];
      isChanged = this.isChanged(currentSlot, {
        ...savedSlot,
        ip_type: currentTypeData,
      });
      isDisabled =
        activeSlot.port !== currentSlot.port &&
        !isEmpty(activeSlot) &&
        isOpenVpnConnected;
    }

    const usage = join(
      [
        usedMb || '-',
        get(user, 'package', 'Free VPN') === 'Free VPN' ? '1000' : 'Unmetered',
      ],
      '/',
    );

    return (
      <div className="main-dashboard-page">
        <div className="logo" />
        <div className="slots-container">
          <div className="configure-block">
            <div className="top-block">
              <div className="ip-configure">
                <span>
                  <strong>IP Configuration</strong>
                </span>
                <div className="settings-img" />
              </div>
              <div>
                <StyledButton
                  label="Save Settings"
                  disabled={!isChanged || isSlotSaved}
                  style="save-btn"
                  onClick={this.saveSlotConfiguration}
                />
                <Select
                  selected={currentSlot ? currentSlot.port : false}
                  values={userIpTypes.map((item, index) => ({
                    value: item.port,
                    label: slotNames[index + 1] || `Slot ${index + 1}`,
                  }))}
                  onChange={this.changeSlot}
                />
                <button
                  className={classNames(
                    'connection-btn',
                    isCurrentSlotConnected() && 'connect-btn',
                  )}
                  onClick={
                    isCurrentSlotConnected()
                      ? this.startHandleDisconnect
                      : this.connectToVpn
                  }
                  disabled={isDisabled}
                  title={remainingIpUpdatesText}>
                  <div className="connect-img" />
                </button>
              </div>
            </div>
            {isDisabled || (
              <SlotConfigurations
                availableIpTypes={availableIpTypes}
                ipTypes={ipTypes || {}}
                item={currentSlot}
                onCountrySelect={this.onCountrySelect}
                onIspsSelect={this.onIspsSelect}
                onRegionSelect={this.onRegionSelect}
                onTypeChoose={this.onTypeChoose}
              />
            )}
          </div>
        </div>
        <div className="dashboard-middle-container">
          <div
            className={classNames('dashboard-stats', {
              disabled: !isCurrentSlotConnected(),
            })}>
            <span>Total Daily Usage, MB</span>
            <div className="traffic-block">
              <div className="circle" />
              <span>{usage}</span>
            </div>
            <StatsChart style={CHART_STYLE} data={data} labels={labels} />
            <div className="bytes-block">
              <div>
                <span className="bytes-text">Bytes in</span>
                <span className="point">•</span>
                <span className="bytes-value">{bytesIn || '-'}</span>
                <div className="arrow-bottom" />
              </div>
              <div>
                <span className="bytes-text">Bytes out</span>
                <span className="point">•</span>
                <span className="bytes-value">{bytesOut || '-'}</span>
                <div className="arrow-top" />
              </div>
            </div>
          </div>
          <div
            className={classNames('dashboard-map', {
              disabled: !isCurrentSlotConnected(),
            })}>
            <span>Location Map</span>
            <div className="map-img">
              {isCurrentSlotConnected() && geoLocation && (
                <div className="map-marker" style={locationStyle} />
              )}
            </div>
          </div>
        </div>
        <div className="dashboard-bottom-container">
          <div className="network">
            <span
              className={classNames(
                'container-title',
                !isCurrentSlotConnected() && 'disabled',
              )}>
              Network
            </span>
            <div>
              {isCurrentSlotConnected() && <div className="wifi-img" />}
              <span
                className={classNames(
                  'network-name',
                  !isCurrentSlotConnected() && 'disabled',
                )}>
                {networkName}
              </span>
            </div>
          </div>
          <div className="ip-info">
            <span
              className={classNames(
                'container-title',
                !isCurrentSlotConnected() && 'disabled',
              )}>
              IP Info
            </span>
            <span
              className={classNames(
                'ip',
                !isCurrentSlotConnected() && 'disabled',
              )}>
              {publicIp}
            </span>
          </div>
        </div>
      </div>
    );
  }
}

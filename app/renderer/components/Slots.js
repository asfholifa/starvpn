import map from 'lodash/map';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from './statelessComponents/Select';
import Button from './statelessComponents/Button';
import app from '../helpers/app';

export default class Slots extends Component {
  static propTypes = {
    getAvailableData: PropTypes.func.isRequired,
    ipTypes: PropTypes.shape({}),
    onTypeChoose: PropTypes.func.isRequired,
    onCountryChoose: PropTypes.func.isRequired,
    onRegionChoose: PropTypes.func.isRequired,
    onLastValueChoose: PropTypes.func.isRequired,
    onSlotChange: PropTypes.func.isRequired,
    setSlotAsActive: PropTypes.func.isRequired,
    saveSlotConfigurationToApi: PropTypes.func.isRequired,
    updateDnsUser: PropTypes.func.isRequired,
    slotsList: PropTypes.array,
    refreshActiveSlotData: PropTypes.func.isRequired,
  };

  state = {
    currentIpType: 'Static residential IP', // Oneof
  };

  componentDidMount() {
    this.props.getAvailableData().then(() => {
      const {
        availableIpTypes,
        currentSavedSlot: { ip_type },
      } = this.props;
      // console.log(this.props.currentSavedSlot)
      this.refreshCurrentSlot();
      if (availableIpTypes.length === 1 && ip_type !== availableIpTypes[0]) {
        console.log(`Setting FREE IP TYPE`);
        this.onTypeChoose({ target: { value: availableIpTypes[0] } });
      }
    });
  }

  refreshCurrentSlot = () => {
    const { slotsList, activeSlot: { port: activePort } = {}, refreshActiveSlotData } = this.props;
    console.info(`Updating current slot`);
    const foundSlot = slotsList.filter(({ port }) => port === activePort)[0];
    if (!foundSlot) {
      return console.debug(`Not found last configuration: `);
    }
    refreshActiveSlotData(foundSlot);
  };

  onSlotChange = ({ target: { value } }) => {
    const slot = this.props.slotsList.filter(({ port }) => port === +value)[0];
    this.props.onSlotChange(slot);
  };

  onTypeChoose = ({ target: { value } }) => {
    this.props.onTypeChoose(value);
  };

  onCountrySelect = ({ target: { value } }) => {
    this.props.onCountryChoose(value);
  };

  onRegionSelect = ({ target: { value } }) => {
    this.props.onRegionChoose(value);
  };

  onIspsSelect = ({ target: { value } }) => {
    this.props.onLastValueChoose(value);
  };

  setSlotAsActive = () => {
    const {
      currentSlotData,
      userEmail,
      saveSlotConfigurationToApi,
      showError,
      currentSavedSlot,
      endLoading,
      setSlotAsActive,
      updateDnsUser,
      isOpenVpnConnected,
      auth_token,
    } = this.props;

    let isChanged = false;
    Object.keys(currentSlotData).forEach((key) => {
      if (currentSlotData[key] && currentSavedSlot[key] !== currentSlotData[key]) {
        isChanged = true;
      }
    });
    const { country, region } = currentSlotData;
    const { vpnusername, vpnpassword, port } = currentSlotData;
    if (!vpnpassword || !vpnusername) {
      return showError(`Missed required fields for slot ${port}. Please contact support...`);
    }
    return (isChanged
      ? saveSlotConfigurationToApi({ ...currentSlotData, userEmail }, auth_token)
      : Promise.resolve()
    )
      .then(() => updateDnsUser(currentSlotData))
      .then(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(setSlotAsActive(currentSlotData, isOpenVpnConnected)), 0),
          ),
      )
      .catch((err) => {
        showError(err.message || 'Error set current slot as active!');
        console.log(`Slot could not be set as active `);
        console.error(err);
      })
      .finally(() => {
        app.updateXYCoordinates({ country, region });
        app.refreshPublicIp();
        endLoading();
      });
  };

  saveSlotConfiguration = () => {
    const {
      currentSlotData,
      userEmail,
      endLoading,
      saveSlotConfigurationToApi,
      auth_token,
    } = this.props;

    return saveSlotConfigurationToApi({ ...currentSlotData, userEmail }, auth_token)
      .catch((err) => {
        this.props.showError(err.message || 'Error saving slots configuration!');
        console.error(err);
      })
      .finally(endLoading);
  };

  updateIP = () => {
    const { currentSlotData, userEmail, auth_token } = this.props;
    return this.props.updateIP({ ...currentSlotData, userEmail }, auth_token);
  };

  render() {
    if (!this.props.currentSlotData) {
      return <p className="slots-loading">LOADING...</p>;
    }
    let {
      ipTypes,
      availableIpTypes,
      currentSlotData: { ip_type, country, region, ti, isp, port },
      slotsList,
      activeSlot = {},
    } = this.props;

    slotsList = slotsList.length ? slotsList : [{ ...this.props.currentSlotData, port: 1 }];

    if (!ipTypes) return <p className="slots-loading">No data available...</p>;

    const currentTypeData = ipTypes[ip_type];
    if (!currentTypeData) {
      return <p className="slots-loading">No data available...</p>;
    }

    const isCurrentSlotActive = activeSlot.port === port;
    const isPossibleSetSlotActive = !isCurrentSlotActive;

    // Slots data
    const { countries } = currentTypeData;

    // Selected country regions
    if (!countries[country]) return <p className="slots-loading">No data available...</p>;
    const { region: regions = {} } = countries[country];

    // Selected region
    if (!regions[region]) return <p className="slots-loading">No data available...</p>;
    const { timeinterval, isp: isps } = regions[region];

    return (
      <div className="slots-bordered">
        <div className="slots-header">
          <span className="slots-current-label">
            Slot {port} {isCurrentSlotActive && 'Active'}
          </span>
          <Select
            onChange={this.onSlotChange}
            selected={port}
            values={slotsList.map((slot) => ({
              value: slot.port,
              label: `Slot ${slot.port} ${slot.ip_type}` || 'Slot name label',
            }))}
          />
        </div>
        <div className="slots-container">
          <div className="slots-raw-wrap">
            <div className="slots-left-column">
              <div className="slots-raw-around slots-title-container">
                <p className="slots-bold">IP Configuration</p>
                {/* <span className="slots-remaining"> */}
                {/* </span> */}
              </div>
              <div className="slots-raw-around slots-select-header">
                <span className="slots-select-label">Country</span>
                <span className="slots-select-label">Region</span>
                <span className="slots-select-label">{isp ? 'ISP' : 'Time Interval'}</span>
              </div>
              <div className="slots-raw-around slots-bordered">
                <Select
                  values={Object.keys(countries).map((country) => ({
                    value: country,
                    label: countries[country].label,
                  }))}
                  className="slots-select-configs"
                  onChange={this.onCountrySelect}
                  selected={country}
                />
                <Select
                  onChange={this.onRegionSelect}
                  className="slots-select-configs"
                  values={map(regions, (region) => ({ value: region.key, label: region.label }))}
                  selected={region}
                />
                {ti && timeinterval && (
                  <Select
                    onChange={this.onIspsSelect}
                    className="slots-select-configs"
                    values={map(timeinterval, (tiItem) => ({
                      value: tiItem.key,
                      label: tiItem.label,
                    }))}
                    selected={ti}
                  />
                )}
                {isp && isps && (
                  <Select
                    onChange={this.onIspsSelect}
                    className="slots-select-configs"
                    values={map(isps, (ispItem) => ({ value: ispItem.key, label: ispItem.label }))}
                    selected={isp}
                  />
                )}
              </div>
            </div>
            <div className="slots-right-column">
              <Select
                onChange={this.onTypeChoose}
                label="Select Type"
                className="slots-ip-type-select"
                id="types"
                values={availableIpTypes.map((value) => ({ label: value, value }))}
                selected={ip_type}
              />
              {/* <p>Which to choose?</p> */}
              <Button
                style="slots-btn"
                name={isPossibleSetSlotActive ? 'Use slot' : 'Slot already used'}
                onClick={this.setSlotAsActive}
                disabled={!isPossibleSetSlotActive}
              />
              <Button style="slots-btn" name="Save Settings" onClick={this.saveSlotConfiguration} />
              <Button style="slots-btn" name="Update IP" onClick={this.updateIP} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

import find from 'lodash/find';
import get from 'lodash/get';
import map from 'lodash/map';
import React, { useMemo } from 'react';
import StyledSelect from './StyledSelect';
import Select from 'react-select';
import { IP_TYPES_MAPPING } from '../../reducers/slots';
import sortOptions from '../../helpers/sortOptions';

function toDropdownOption(item) {
  return {
    value: item.key,
    label: item.label,
  };
}

function SlotConfiguration({
  item,
  availableIpTypes,
  ipTypes,
  onTypeChoose,
  onCountrySelect,
  onRegionSelect,
  onIspsSelect,
}) {
  const countries = get(ipTypes, [
    IP_TYPES_MAPPING[item.ip_type.toLowerCase()],
    'countries',
  ]);
  const country = useMemo(() => get(countries, item.country), [
    countries,
    item.country,
  ]);
  console.log(country);
  const regions = get(country, 'region');
  const region = find(regions, ['key', item.region]);
  const timeintervals = get(region, 'timeinterval');
  const timeinterval = find(timeintervals, ['key', item.ti]);
  const isps = get(region, 'isp');
  const isp = find(isps, ['key', item.isp]);
  const countriesOptions = useMemo(() => {
    const co = map(sortOptions(countries), toDropdownOption);
    if (!country) {
      co.unshift({ value: null, label: 'Please Select' });
    }
    return co;
  }, [countries, country]);
  const regionsOptions = useMemo(() => {
    const ro = map(sortOptions(regions), toDropdownOption);
    if (!region) {
      ro.unshift({
        label: 'Please Select',
        value: null,
      });
    }
    return ro;
  }, [region, regions]);
  const ispsOptions = useMemo(() => {
    const io = map(sortOptions(isps), toDropdownOption);
    if (!isp) {
      io.unshift({ label: 'Please Select', value: 'Please Select' });
    }
    return io;
  }, [isp, isps]);
  const timeintervalOptions = useMemo(() => {
    const tio = map(timeintervals, toDropdownOption);
    if (!timeinterval) {
      tio.unshift({
        label: 'Please Select',
        value: null,
      });
    }
    return tio;
  }, [timeintervals]);
  const ipTypesValues = map(availableIpTypes, (value) => ({
    label: value,
    value,
  }));

  let key = get(country, 'key');

  return (
    <div className="bottom-block">
      <div className="left-block">
        <span className="configure-title">Type:</span>
        <StyledSelect
          onChange={onTypeChoose}
          label="Select Type"
          className="slots-type-select"
          name={`types-${item.port}`}
          values={ipTypesValues}
          selected={IP_TYPES_MAPPING[item.ip_type.toLowerCase()]}
        />
      </div>
      <div className="right-block">
        <div>
          <span className="configure-title">Country:</span>
          <Select
            name={`country-${item.port}`}
            options={countriesOptions.map( option =>{
              return {...option, label: <span><span className={`flag-icon flag-icon-${option.value}`}></span> {option.label}</span>}
            })}
            onChange={onCountrySelect}
            className="basic-select"
            classNamePrefix="select"
            value={countriesOptions.filter(item => item.value === key)}
          />
        </div>
        <div>
          <span className="configure-title">Region:</span>
          <StyledSelect
            name={`region-${item.port}`}
            onChange={onRegionSelect}
            values={regionsOptions}
            selected={get(region, 'key')}
          />
        </div>
        <div>
          <span className="configure-title">
            {item.ti ? 'Time Interval:' : 'ISP'}
          </span>
          {item && item.ti && (
            <StyledSelect
              onChange={onIspsSelect}
              values={timeintervalOptions}
              name={`ti-${item.port}`}
              selected={get(timeinterval, 'key')}
            />
          )}
          {item && item.isp && (
            <StyledSelect
              onChange={onIspsSelect}
              values={ispsOptions}
              name={`isp-${item.port}`}
              selected={get(isp, 'key')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SlotConfiguration;

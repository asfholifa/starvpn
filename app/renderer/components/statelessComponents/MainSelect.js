import React from 'react';
import { map } from 'lodash';

export default ({ className, values, selected, id, ...rest }) => (
  <select className={`main-select ${className}`} id={id} value={selected} {...rest}>{
    map(values, ({ value, label }, ind) => (
        <option value={value} key={value + ind}>
          {label}
        </option>
      )
    )}
  </select>
);

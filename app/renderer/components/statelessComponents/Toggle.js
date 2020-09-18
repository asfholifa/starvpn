import React from 'react';

const Toggle = props => (
  <label className="toggle-switch">
    <input type="checkbox" {...props} />
    <span className="slider round" />
  </label>
);

export default Toggle;

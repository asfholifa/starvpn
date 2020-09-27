import React from 'react';

const ToggleBlocked = props => (
  <label className="toggle-switch">
    <input type="button" {...props} />
    <span className="slider round" />
  </label>
);

export default ToggleBlocked;

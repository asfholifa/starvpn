import React from 'react';
import classNames from 'classnames';

const StyledButton = ({ style, label, ...rest }) => (
  <button className={classNames("styled-btn", style)} {...rest}>{label}</button>
);

export default StyledButton;

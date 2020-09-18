import React from 'react';

export default ({ style, name, children, ...rest }) => (
  <button className={`main-button-style ${style}`} {...rest}>{children}{name}</button>
);

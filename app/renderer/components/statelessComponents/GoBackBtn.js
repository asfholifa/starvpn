import React from 'react';

export default ({ style, goBack, ...rest }) => (
  <img
    className={`back-button-style ${style}`}
    onClick={() => goBack()}
    {...rest}
    src='./styles/icons/arrow-left.svg'
  />
);

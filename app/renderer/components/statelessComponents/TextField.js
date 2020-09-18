import React from 'react';
import PropTypes from 'prop-types';

const TextFieldComponent = ({ style, name, handleChange, placeholder, label, type, ...rest }) => (
  <div className="input-block">
    <input className='form-input'
           onChange={handleChange}
           type={type}
           name={name}
           placeholder={placeholder}
           style={style}
           {...rest}
    />
    <label className="input-label">{label}</label>
  </div>
);

TextFieldComponent.propTypes = {
  type: PropTypes.string
}

TextFieldComponent.defaultProps = {
  type: 'text'
}

export default TextFieldComponent;

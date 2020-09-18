import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Api from '../helpers/api';
import Button from './statelessComponents/Button';
import { isValidEmail } from '../helpers/util';
import { COUNTRIES_BY_ISO } from '../helpers/constants';
import GoBackBtn from '../containers/GoBackBtn';

export default class SignUp extends Component {
  static propTypes = {
    onHome: PropTypes.func.isRequired,
    startLoading: PropTypes.func.isRequired,
    endLoading: PropTypes.func.isRequired,
  };

  state = {
    firstname: '',
    lastname: '',
    email: '',
    city: '',
    state: '',
    country: '',
    password2: '',
    message: ''
  };

  handleSignUp = (e) => {
    e.preventDefault();
    const { startLoading, endLoading, showError } = this.props;
    const {
      firstname,
      lastname,
      email,
      city,
      state,
      country,
      password,
      password2
    } = this.state;

    if (!email) {
      return showError(`Email is required`)
    }
    if (!isValidEmail(email)) {
      return showError(`Please provide correct email`)
    }
    if (!password) {
      return showError(`Password is required`)
    }
    if (password.length < 6) {
      return showError(`Password length should be more then 5 characters`)
    }
    if (password !== password2) {
      return showError(`Passwords do not match`)
    }
    const data = {
      firstname: firstname,
      lastname: lastname,
      email: email,
      city: city,
      state: state,
      country: country,
      password2: password2,
    }
    return this.props.signUp(data);
    // startLoading('Please wait...');
    // // Promise.resolve({ data: { result: 'success', message: '' } })
    // Api.signup(data)
    //   .then((response) => {
    //     const { result, message } = response.data;
    //     if (result === 'success') {
    //       alert('Registration completed. Please Sign In!')
    //       setTimeout(() => {
    //         this.props.onHome();
    //       }, 0);
    //     } else {
    //       showError(message || 'Registration error!')
    //     }
    //   })
    //   .catch((error) => {
    //     showError(error.message || 'Signup error!')
    //     console.log(error);
    //   }).finally(endLoading);
  };

  handleChange = ({ target: { name, value, pattern } }) => {
    this.props.closeError();
    // Used as flag to avoid numbers in some of inputs
    if (pattern) {
      value = value.replace(/[0-9]/g, "");
    }
    this.setState({ [name]: value });
  };

  render() {
    const { firstname, lastname, email, city, state, country, password2, message, password } = this.state;

    const countriesKeys = Object.keys(COUNTRIES_BY_ISO);
    // Adding empty key for label
    countriesKeys.unshift('');

    return (
      <div className='signup-page'>
        <GoBackBtn />
        <h2 className='signup-title'>Sign Up</h2>
        <form onSubmit={this.handleSignUp}>
          <input
            className='signup-input'
            onChange={this.handleChange}
            type="text"
            name='firstname'
            pattern='[A-Z,a-z]'
            value={firstname}
            placeholder='First Name' />
          <input
            className='signup-input'
            onChange={this.handleChange}
            type="text"
            pattern='[A-Z,a-z]'
            name='lastname'
            value={lastname}
            placeholder='Last Name' />
          <input
            className='signup-input'
            onChange={this.handleChange}
            type="email"
            name='email'
            value={email}
            placeholder='Email' />
          <input
            className='signup-input'
            onChange={this.handleChange}
            type="text"
            pattern='[A-Z,a-z]'
            name='city'
            value={city}
            placeholder='City' />
          <input
            className='signup-input'
            onChange={this.handleChange}
            type="text"
            name='state'
            value={state}
            placeholder='State' />
          <select className="main-select-style signup-select"
            onChange={this.handleChange}
            name='country'
            value={country}>
            {countriesKeys.map(counryCodeKey => (
              <option
                key={counryCodeKey}
                selected={country}
                value={counryCodeKey}
              >
                {COUNTRIES_BY_ISO[counryCodeKey] || 'Please choose your country'}
              </option>
            ))}
          </select>
          <input
            className='signup-input'
            onChange={this.handleChange}
            type="password"
            name='password'
            value={password}
            placeholder='Password' />
          <input
            className='signup-input'
            onChange={this.handleChange}
            type="password"
            name='password2'
            value={password2}
            placeholder='Repeat Password' />
          <p className='signup-message'>{message}</p>
          <p>
            <Button style='signup-button' name='Signup' onClick={this.handleSignUp} />
          </p>
        </form>
      </div>
    );
  }
}

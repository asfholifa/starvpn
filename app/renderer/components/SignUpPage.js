import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isValidEmail } from '../helpers/util';
import { COUNTRIES_BY_ISO } from '../helpers/constants';
import TextField from "./statelessComponents/TextField";
import StyledButton from "./statelessComponents/StyledButton";
import Select from "./statelessComponents/MainSelect";
import GoBackBtn from '../containers/GoBackBtn';

export default class SignUp extends Component {
  static propTypes = {
    goToLogin: PropTypes.func.isRequired,
    startLoading: PropTypes.func.isRequired,
    endLoading: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired
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
    const { showError } = this.props;
    const {
      firstname,
      lastname,
      country,
      email,
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
      firstname,
      lastname,
      country,
      email,
      password2
    };
    return this.props.signUp(data);
  };

  goToLogin = () => this.props.goToLogin();

  handleChange = ({ target: { name, value, pattern } }) => {
    this.props.closeError();
    // Used as flag to avoid numbers in some of inputs
    if (pattern) {
      value = value.replace(/[0-9]/g, "");
    }
    this.setState({ [name]: value });
  };

  render() {
    const { message, country } = this.state;

    const countriesKeys = Object.keys(COUNTRIES_BY_ISO);
    // Adding empty key for label
    countriesKeys.unshift('');

    return (
      <div className='signup'>
        <div className="signup-container">
          <div className="logo" />
          <GoBackBtn/>
          <h2 className='signup-title'>Create a StarVPN account</h2>
          <form className="signup-form-block">
            <div className="form">
              <div>
                <TextField label="First name" handleChange={this.handleChange} placeholder="Enter first name" name="firstname" />
                <TextField label="Last name" handleChange={this.handleChange} placeholder="Enter last name" name="lastname" />
                <div>
                  <label className="input-label">Select country</label>
                  <Select
                    className="country-select"
                    selected={country}
                    name='country'
                    values={countriesKeys.map(e => ({value: e, label: COUNTRIES_BY_ISO[e] || 'Please choose your country'}))}
                    onChange={this.handleChange}
                  />
                </div>
              </div>
              <div>
                <TextField label="Email" handleChange={this.handleChange} placeholder="Enter email" name="email" />
                <TextField label="Password" type="password" handleChange={this.handleChange} placeholder="Enter password" name="password" />
                <TextField label="Confirm password" type="password" handleChange={this.handleChange} placeholder="Confirm password" name="password2" />
              </div>
            </div>
            <p className='home-message'>{message}</p>
          </form>
          <div className="buttons-block">
            <StyledButton label="Signup" onClick={this.handleSignUp}/>
            <StyledButton label="Go to login" onClick={this.goToLogin}/>
          </div>
        </div>
      </div>
    );
  }
}

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Api from '../helpers/api';
import _ from 'lodash';
import Button from './statelessComponents/Button';
import GoBackBtn from '../containers/GoBackBtn';
// import FacebookLogin from 'react-facebook-login';
// import GoogleLogin from 'react-google-login';

export default class Home extends Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    onSignUp: PropTypes.func.isRequired,
  };

  state = {
    username: '',
    password: '',
    usernameError: '',
    passwordError: '',
    message: '',
  };

  handleLogin = (e) => {
    e.preventDefault();
    const { showError, endLoading, startLoading, onLogin } = this.props;
    const { username: email, password } = this.state;

    if (!email) {
      return this.setState({ message: 'Please enter email' });
    }
    if (!password) {
      return this.setState({ message: 'Please enter password' });
    }

    startLoading('Signing in...');

    Api.login({ email, password })
      .then((response) => {
        const { result, data, message } = response.data;
        console.log(`\nAuth RESPONSE result : ${result}`);
        if (result !== 'success') {
          throw new Error(message);
        }
        return onLogin({ data, loggedIn: true, password });
      })
      .catch((error) => {
        let errorMessage = error.message || 'Login error';
        if (errorMessage.indexOf('ENOTFOUND') !== -1) {
          errorMessage = 'No internet';
        }
        showError(_.unescape(errorMessage));
        console.log(`Error: `, errorMessage);
        console.error(error);
      })
      .finally(endLoading);
  };

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
      message: '',
    });
  };

  render() {
    const { username, password, message } = this.state;

    return (
      <div className="home-page">
        <GoBackBtn />
        <h2 className="home-title">VPN</h2>
        <form onSubmit={this.handleLogin}>
          <input
            className="home-input"
            onChange={this.handleChange}
            type="text"
            name="username"
            value={username}
            placeholder="Enter email"
          />
          <input
            className="home-input"
            onChange={this.handleChange}
            type="password"
            name="password"
            value={password}
            placeholder="Enter password"
          />
          <p className="home-message">{message}</p>
          <p>
            <Button style="home-login-button" name="Login" onClick={this.handleLogin} />
          </p>
        </form>
        <div className="home-line">
          <hr />
        </div>
        <br />
        <br />
      </div>
    );
  }
}

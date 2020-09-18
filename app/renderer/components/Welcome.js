import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import StyledButton from './statelessComponents/StyledButton';
import app from '../helpers/app';
import { ipcRenderer } from 'electron';
import TextField from './statelessComponents/TextField';
import Api from '../helpers/api';
import _ from 'lodash';
import openExternal from '../helpers/openExternal';

export default class Dashboard extends PureComponent {
  static propTypes = {
    goToPlans: PropTypes.func.isRequired,
    onLogin: PropTypes.func.isRequired,
  };

  state = {
    username: '',
    password: '',
    message: '',
  };

  componentDidMount() {
    if (this.props.user) {
      app.logoutUser();
    }
  }

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
        if (errorMessage.indexOf('ENOTFOUND www.starvpn.com') !== -1) {
          errorMessage = 'No internet';
        }
        showError(_.unescape(errorMessage));
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

  goToPlans = () => this.props.goToPlans();

  facebookAuth = () => {
    ipcRenderer.send('facebook-auth');
  };

  googleAuth = () => {
    ipcRenderer.send('google-auth');
  };

  goToChangePassword = () => openExternal('https://www.starvpn.com/dashboard/pwreset.php');

  render() {
    const { message } = this.state;

    return (
      <div className="welcome-page">
        <div className="welcome-container">
          <div className="logo" />
          <h2 className="welcome-title">Sign in to My Account</h2>
          <form onSubmit={this.handleLogin} className="login-form-block">
            <div>
              <TextField
                handleChange={this.handleChange}
                placeholder="Enter email"
                name="username"
              />
              <TextField
                type="password"
                handleChange={this.handleChange}
                placeholder="Enter password"
                name="password"
              />
            </div>
            <input type="submit" style={{ position: 'absolute', left: '-9999px' }} />
            <p className="home-message">{message}</p>
          </form>
          <StyledButton style="login-btn" label="Log in" onClick={this.handleLogin} />
          <div className="buttons-block">
            <button className="fb-btn" name="Login with Facebook" onClick={this.facebookAuth}>
              <div className="fb-img" />
              Sign in with Facebook
            </button>
            <button className="google-btn" name="Login with Google" onClick={this.googleAuth}>
              <div className="google-img" />
              Sign in with Google
            </button>
          </div>
          <div className="new-user-block">
            <div>
              <span>New user?</span> <a onClick={this.goToPlans}>Create new account</a>
              <p className="forgot-password" onClick={this.goToChangePassword}>
                Forgot Password?
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

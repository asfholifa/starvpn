import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { bindActionCreators } from 'redux';
import SignUp from '../components/SignUpPage';
import metaActions from '../actions/metadata';
import { ROUTES } from '../helpers/constants';
import Api from '../helpers/api';
import App from '../helpers/app';

const mapStateToProps = (state) => {
  return state;
};

const mapDispatchToProps = (dispatch) => {
  const {
    startLoading,
    showError,
    closeError,
    endLoading
  } = bindActionCreators(metaActions, dispatch);

  return {
    goToLogin: () => {
      dispatch(push(ROUTES.ROOT));
    },
    signUp: (data) => {
      const { email, password2 } = data;
      startLoading('Please wait...');
      Api.signup(data)
        .then(response => {
          const { result, message } = response.data;
          console.info(`Registration result: ${result}`)
          if (result === 'error') {
            throw new Error(message || 'Sign up error')
          }
          console.info(`Signing to api...`)
          return Api.login({ email, password: password2 })
        })
        .then(loginResponse => {
          const { result, message, data: { auth_token } } = loginResponse.data;

          console.info(`Sign in to API result: ${result}`)

          if (result === 'error') {
            throw new Error(message || 'Unable to login')
          }
          // Set up free VPN plan
          console.info(`Retrieving free package...`)
          return Api.setupFreeVPN({ email, auth_token });
        })
        .then(freeVpnResponse => {
          const { result, message } = freeVpnResponse.data;
          console.info(`Getting free package result: ${result}`)
          if (result === 'error') {
            throw new Error(message || 'Retrieving free VPN package error')
          }
          // 2nd sign-in (first was to receive auth token, 2nd one to receive packages, after free package created)
          // TODO: Create free vpn package on backend side during Sign Up
          console.info(`Signing to api...`)
          return Api.login({ email, password: password2 })
        })
        .then(loginResponse => {
          const { result, message, data } = loginResponse.data;

          console.info(`Sign in to API result: ${result}`)

          if (result === 'error') {
            throw new Error(message || 'Unable to login')
          }
          console.info(`Logging to the application...`)
          return App.loginUserToApp({ loggedIn: true, data })
        })
        .catch((error) => {
          showError(error.message || 'Sign up error!')
          console.error(error);
        }).finally(endLoading);
    },
    showError: showError,
    closeError: closeError,
    startLoading: startLoading,
    endLoading: endLoading,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SignUp);

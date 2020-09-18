import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import Plans from '../components/Plans';
import { ROUTES } from '../helpers/constants';
import { bindActionCreators } from 'redux';
import metaActions from '../actions/metadata';
import Api from '../helpers/api';
import App from '../helpers/app';

const mapStateToProps = (state) => {
  return {
    user: state.user.data,
    auth_token: state.user.auth_token,
  };
};

const mapDispatchToProps = (dispatch) => {
  const metadata = bindActionCreators(metaActions, dispatch);

  return {
    proceedAsFree: (user, auth_token) => {
      if (!user) {
        // not logged user, go to sign up
        return dispatch(push(ROUTES.SIGN_UP));
      } else {
        metadata.startLoading('Getting free package...');
        // Already logged in
        // Buy free package and go to home page
        const { email } = user;
        return Api.setupFreeVPN({ email, auth_token })
          .then((response) => {
            const { result, message } = response.data;
            console.info(`Getting free package result: ${result}`);
            if (result === 'error') {
              throw new Error(message || 'Retrieving free VPN package error');
            }
            return dispatch(push(ROUTES.HOME));
          })
          .catch((err) => {
            metadata.showError(err.message || 'Error retrieving free package');
          })
          .finally(() => metadata.endLoading());
      }
    },
    showError: metadata.showError,
    startLoading: metadata.startLoading,
    endLoading: metadata.endLoading,
    refreshUserData: (email, goToDashboard) => {
      return App.refreshUserData(email, goToDashboard);
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Plans);

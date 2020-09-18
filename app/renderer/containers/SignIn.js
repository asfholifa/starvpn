import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { bindActionCreators } from 'redux';

import SignIn from '../components/SignIn';
import metaActions from '../actions/metadata';
import { ROUTES } from '../helpers/constants';
import App from '../helpers/app';

const mapStateToProps = (state) => {
  return state;
};

const mapDispatchToProps = (dispatch) => {
  const metadata = bindActionCreators(metaActions, dispatch);

  return {
    onLogin: ({ loggedIn, password, data }) => {
      return App.loginUserToApp({ loggedIn, password, data });
    },
    onSignUp: () => {
      dispatch(push(ROUTES.SIGN_UP));
    },
    showError: metadata.showError,
    startLoading: metadata.startLoading,
    endLoading: metadata.endLoading
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SignIn);

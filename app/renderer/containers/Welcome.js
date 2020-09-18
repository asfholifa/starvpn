import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import Welcome from '../components/Welcome'
import { ROUTES } from '../helpers/constants';
import App from "../helpers/app";
import {bindActionCreators} from "redux";
import metaActions from "../actions/metadata";

const mapStateToProps = (state) => {
  return { user: state.user.data };
};

const mapDispatchToProps = (dispatch) => {
  const metadata = bindActionCreators(metaActions, dispatch);

  return {
    goRegister: () => {
      dispatch(push(ROUTES.BUY_PACKAGE));
    },
    onLogin: ({ loggedIn, password, data }) => {
      return App.loginUserToApp({ loggedIn, password, data });
    },
    onSignUp: () => {
      dispatch(push(ROUTES.SIGN_UP));
    },
    goToPlans: () => {
      dispatch(push(ROUTES.PLANS));
    },
    showError: metadata.showError,
    startLoading: metadata.startLoading,
    endLoading: metadata.endLoading
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Welcome);

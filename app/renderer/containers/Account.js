import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import Account from '../components/Account'
import { ROUTES } from '../helpers/constants';
import {bindActionCreators} from "redux";
import metaActions from "../actions/metadata";
import App from "../helpers/app";

const mapStateToProps = (state) => {
  return {
    user: state.user.data,
    auth_token: state.user.auth_token
  };
};

const mapDispatchToProps = (dispatch) => {
  const metadata = bindActionCreators(metaActions, dispatch);

  return {
    onLogout: () => {
      App.logoutUser();
      dispatch(push(ROUTES.ROOT));
    },
    showError: metadata.showError,
    startLoading: metadata.startLoading,
    endLoading: metadata.endLoading
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Account);

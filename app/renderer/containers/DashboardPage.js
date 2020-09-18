import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import Dashboard from '../components/Dashboard';

import { ROUTES } from '../helpers/constants';
import app from '../helpers/app';

const mapStateToProps = (state) => {
  return state;
};

const mapDispatchToProps = (dispatch) => {
  
  return {
    onMainPage: () => {
      dispatch(push(ROUTES.HOME));
    },
    onLogout: (data) => {
      app.logoutUser()
      dispatch(push(ROUTES.ROOT));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Dashboard);

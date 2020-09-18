import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { bindActionCreators } from 'redux';
import Home from '../components/Home';
import metaActions from '../actions/metadata';
import slotsActions from '../actions/slots';
import App from '../helpers/app';
import { ROUTES } from '../helpers/constants';

const mapStateToProps = (state) => {
  return state;
};

const mapDispatchToProps = (dispatch) => {
  const metadata = bindActionCreators(metaActions, dispatch);
  const slots = bindActionCreators(slotsActions, dispatch);

  return {
    setOpenVpnProtocol: ({ protocol }) => {
      metadata.setProtocol(protocol);
    },
    onLogout: () => {
      App.logoutUser();
      dispatch(push(ROUTES.ROOT));
    },
    clearSlotsData: () => {
      slots.clearSlotsData();
    },
    refreshUserData: (email, goToDashboard) => {
      return App.refreshUserData(email, goToDashboard);
    },
    goToDashboard: () => {
      dispatch(push(ROUTES.DASHBOARD));
    },
    goToLogs: () => {
      dispatch(push(ROUTES.LOGS));
    },
    goToUsageStats: () => {
      dispatch(push(ROUTES.STATS));
    },
    startLoading: metadata.startLoading,
    endLoading: metadata.endLoading,
    showError: metadata.showError,
    setConnectionVPN: (data) => {
      metadata.setConnectionVPN(data);
    },
    setSelectedDns: (dns) => {
      metadata.setSelectedDns(dns);
    },
    setOpenVpnStartUpConnect: (flag) => {
      metadata.setOpenVpnStartUpConnect(flag);
    },
    setSmartDns: (flag) => {
      if (flag) metadata.setSelectedDns('');
      metadata.setSmartDns(flag);
    },
    // reactivateFreePlan: () => {
    //
    // }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Home);

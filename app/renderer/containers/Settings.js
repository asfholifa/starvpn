import { connect } from 'react-redux';
import Settings from '../components/Settings';
import App from '../helpers/app';
import { bindActionCreators } from 'redux';
import metaActions from '../actions/metadata';

const mapStateToProps = (state) => {
  return state;
};

const mapDispatchToProps = (dispatch) => {
  const metadata = bindActionCreators(metaActions, dispatch);

  return {
    refreshUserData: (email, goToDashboard) => {
      return App.refreshUserData(email, goToDashboard);
    },
    setSelectedDns: (dns) => {
      metadata.setSelectedDns(dns);
    },
    setOpenVpnProtocol: ({ protocol }) => {
      metadata.setProtocol(protocol);
    },
    setSmartDns: (flag) => {
      if (flag) metadata.setSelectedDns('');
      metadata.setSmartDns(flag);
    },
    setAutoUpdate: metadata.setAutoUpdate,
    showError: metadata.showError,
    startLoading: metadata.startLoading,
    endLoading: metadata.endLoading,
    setOpenVpnStartUpConnect: metadata.setOpenVpnStartUpConnect,
    setIsStartup: metadata.setIsStartup,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Settings);

import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import Logs from '../components/Logs'
import { ROUTES } from '../helpers/constants';

const mapStateToProps = (state) => {
  return { logs: state.metadata.logs, firstLogLine: state.metadata.firstLogLine };
};

const mapDispatchToProps = (dispatch) => {
  return {
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Logs);

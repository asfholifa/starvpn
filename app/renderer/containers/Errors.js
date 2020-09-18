import { connect } from 'react-redux';
import Errors from '../components/statelessComponents/Errors';
import metaActions from '../actions/metadata';
import openExternal from '../helpers/openExternal';

const mapStateToProps = (state) => {
  return { ...state.metadata.error };
};

const mapDispatchToProps = (dispatch) => ({
  closeError: () => {
    dispatch(metaActions.closeError());
  },
  openUrl: openExternal,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Errors);

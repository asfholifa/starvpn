import { connect } from 'react-redux';
import Loading from '../components/statelessComponents/Loading';

const mapStateToProps = (state) => {
  const { loading, loadingDescription } = state.metadata;
  return { loading, description: loadingDescription }
};

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Loading);

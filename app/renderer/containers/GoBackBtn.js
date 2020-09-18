import { connect } from 'react-redux';
import { goBack } from 'connected-react-router';
import GoToWelcomeButton from '../components/statelessComponents/GoBackBtn'
// import { ROUTES } from '../helpers/constants';

const mapStateToProps = () => {
  return {};
};

const mapDispatchToProps = (dispatch) => {

  return {
    goBack: () => {
      dispatch(goBack());
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GoToWelcomeButton);

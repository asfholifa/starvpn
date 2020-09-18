import metadata from '../../actions/metadata';
import { connect } from 'react-redux';
import React, { PureComponent } from 'react';
import Errors from '../../components/statelessComponents/Errors';
import openExternal from '../../helpers/openExternal';

export default connect(
  null,
  (dispatch) => ({
    showError: (error) => {
      dispatch(metadata.showError(error));
    },
  }),
)(
  class ErrorBoundary extends PureComponent {
    state = {
      error: null,
    };
    handleClose = () => {
      localStorage.clear();
      location.reload();
    };
    static getDerivedStateFromError(error) {
      return { error };
    }
    componentDidCatch(error, errorInfo) {
      console.error('Error caught', error, errorInfo);
      this.setState({ error });
    }
    render() {
      const { children } = this.props;
      const { error } = this.state;
      if (error) {
        return (
          <Errors
            closeError={this.handleClose}
            closeText="Reload app"
            isVisible={true}
            link={error.link}
            message={error.message}
            openUrl={openExternal}
          />
        );
      }
      return children;
    }
  },
);

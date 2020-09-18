import { ConnectedRouter } from 'connected-react-router';
import React from 'react';
import { Provider } from 'react-redux';

import ErrorBoundary from './components/statelessComponents/ErrorBoundary';
import Errors from './containers/Errors';
import Loading from './containers/Loading';
import Menu from './components/Menu';
import routes from './routes';
import store, { routerHistory } from './store';

export default function Root() {
  return (
    <Provider store={store}>
      <Menu />
      <div className="app-container">
        <Loading />
        <Errors />
        <ErrorBoundary>
          <ConnectedRouter history={routerHistory}>{routes}</ConnectedRouter>
        </ErrorBoundary>
      </div>
    </Provider>
  );
}

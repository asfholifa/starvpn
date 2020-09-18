import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import { connectRouter, push, routerMiddleware } from 'connected-react-router';
import persistState from 'redux-localstorage';
import user from './reducers/user';
import userActions from './actions/user';
import metadata from './reducers/metadata';
import metadataActions from './actions/metadata';
import metadataPersisted from './reducers/metadataPersisted';
import slots from './reducers/slots';
import slotsActions from './actions/slots';
import usage from './reducers/usage';
import usageActions from './actions/usage';
import { createMemoryHistory } from 'history';
import { ROUTES } from './helpers/constants';

function configureStore(initialState, routerHistory) {
  const router = routerMiddleware(routerHistory);

  const actionCreators = {
    ...userActions,
    ...slotsActions,
    ...metadataActions,
    ...usageActions,
    push,
  };

  const reducers = {
    router: connectRouter(routerHistory),
    user,
    slots,
    metadata,
    metadataPersisted,
    usage,
  };

  const middlewares = [router];

  const composeEnhancers = (() => {
    const compose_ = window && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
    if (process.env.NODE_ENV === 'development' && compose_) {
      return compose_({ actionCreators, trace: true });
    }
    return compose;
  })();

  const enhancer = composeEnhancers(
    applyMiddleware(...middlewares),
    persistState(['metadataPersisted', 'user', 'slots', 'router']),
  );

  const rootReducer = combineReducers(reducers);

  return createStore(rootReducer, initialState, enhancer);
}

const syncHistoryWithStore = (store, history) => {
  const {
    router,
    user: { loggedIn, data },
  } = store.getState();
  if (router && router.location && loggedIn) {
    router.location.pathname = data.package
      ? ROUTES.MAIN_DASHBOARD
      : ROUTES.BUY_PACKAGE;
    history.replace(router.location);
  }
};

const initialState = {
  user: {},
  slots: {},
  metadata: {},
  metadataPersisted: {
    autoUpdate: true,
    openVpnStartUpConnect: false,
  },
  usage: {},
};

const routesHistory = createMemoryHistory();
const store = configureStore(initialState, routesHistory);
syncHistoryWithStore(store, routesHistory);

export default store;

export const routerHistory = routesHistory;

import React from 'react';
import {Route, Switch} from 'react-router';
import {ROUTES} from "./helpers/constants";
import SignIn from './containers/SignIn'
import Home from './containers/Home';
import SignUpPage from './containers/SignUpPage';
import DashboardPage from './containers/DashboardPage';
import LogsPage from './containers/LogsPage';
import BuyPackageScreen from './containers/BuyPackageScreen';
import Welcome from './containers/Welcome';
import ManageSlots from "./containers/ManageSlots";
import Plans from "./containers/Plans";
import About from "./components/About";
import Settings from "./containers/Settings";
import Account from "./containers/Account";
import MainDashboard from "./containers/MainDashboard";

export default (
  <Switch>
    <Route exact path={ROUTES.ROOT} component={Welcome} />
    <Route exact path={ROUTES.MANAGE_SLOTS} component={ManageSlots} />
    <Route exact path={ROUTES.SIGN_IN} component={SignIn} />
    <Route exact path={ROUTES.SIGN_UP} component={SignUpPage} />
    <Route exact path={ROUTES.BUY_PACKAGE} component={BuyPackageScreen} />
    <Route exact path={ROUTES.HOME} component={Home} />
    <Route exact path={ROUTES.DASHBOARD} component={DashboardPage} />
    <Route exact path={ROUTES.LOGS} component={LogsPage} />
    <Route exact path={ROUTES.PLANS} component={Plans} />
    <Route exact path={ROUTES.ABOUT} component={About} />
    <Route exact path={ROUTES.SETTINGS} component={Settings} />
    <Route exact path={ROUTES.ACCOUNT} component={Account} />
    <Route exact path={ROUTES.MAIN_DASHBOARD} component={MainDashboard} />
  </Switch>
);

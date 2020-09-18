import classNames from 'classnames';
import { push } from 'connected-react-router';
import property from 'lodash/property';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import usage from '../actions/usage';
import api from '../helpers/api';
import { ROUTES } from '../helpers/constants';

const FIVE_MINUTES = 5 * 60 * 1000;

export default function Menu() {
  const dispatch = useDispatch();
  const authToken = useSelector(property('user.auth_token'));
  const pathname = useSelector(property('router.location.pathname'));
  const showMenu = useSelector(property('metadata.showMenu'));
  const userEmail = useSelector(property('user.data.email'));
  const getCurrentVpnUsage = useCallback(async () => {
    try {
      const {
        data: { data },
      } = await api.getCurrentVpnUsage({
        email: userEmail,
        auth_token: authToken,
      });
      // API returns megabytes
      dispatch(usage.setCurrentUsage(parseInt(data) * 1024 * 1024));
    } catch (error) {
      console.log("Can't get current vpn usage");
      console.error(error);
    }
  }, [authToken, dispatch, userEmail]);
  useEffect(() => {
    getCurrentVpnUsage();
    const interval = setInterval(getCurrentVpnUsage, FIVE_MINUTES);
    return () => {
      clearInterval(interval);
    };
  }, [getCurrentVpnUsage]);
  const goToAbout = useCallback(() => {
    dispatch(push(ROUTES.ABOUT));
  }, [dispatch]);
  const goToAccount = useCallback(() => {
    dispatch(push(ROUTES.ACCOUNT));
  }, [dispatch]);
  const goToDashboard = useCallback(() => {
    dispatch(push(ROUTES.MAIN_DASHBOARD));
  }, [dispatch]);
  const goToPlans = useCallback(() => {
    dispatch(push(ROUTES.PLANS));
  }, [dispatch]);
  const goToSettings = useCallback(() => {
    dispatch(push(ROUTES.SETTINGS));
  }, [dispatch]);
  const goToSlots = useCallback(() => {
    dispatch(push(ROUTES.MANAGE_SLOTS));
  }, [dispatch]);

  return (
    <div className="menu-container">
      {showMenu && (
        <div className="nav-menu">
          <div className="menu-icon" />
          <button
            id="dashboard"
            className={classNames({
              active: ROUTES.MAIN_DASHBOARD === pathname,
            })}
            onClick={goToDashboard}>
            <div className="dashboard-img" />
            Dashboard
          </button>
          <button
            id="slots"
            className={classNames({ active: ROUTES.MANAGE_SLOTS === pathname })}
            onClick={goToSlots}>
            <div className="slots-img" />
            Manage Slots
          </button>
          <button
            id="account"
            className={classNames({ active: ROUTES.ACCOUNT === pathname })}
            onClick={goToAccount}>
            <div className="account-img" />
            Account
          </button>
          <button
            id="plans"
            className={classNames({ active: ROUTES.PLANS === pathname })}
            onClick={goToPlans}>
            <div className="plans-img" />
            Plans
          </button>
          <button
            id="about"
            className={classNames({ active: ROUTES.ABOUT === pathname })}
            onClick={goToAbout}>
            <div className="about-img" />
            About
          </button>
          <button
            id="settings"
            className={classNames({ active: ROUTES.SETTINGS === pathname })}
            onClick={goToSettings}>
            <div className="settings-img" />
            Settings
          </button>
        </div>
      )}
    </div>
  );
}

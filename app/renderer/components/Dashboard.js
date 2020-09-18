import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slots from '../containers/Slots';
import Button from './statelessComponents/Button';
import GoBackBtn from '../containers/GoBackBtn';

export default class Dashboard extends Component {
  static propTypes = {
    onLogout: PropTypes.func.isRequired,
    onMainPage: PropTypes.func.isRequired,
  };

  handleMainPage = () => {
    this.props.onMainPage();
  }

  handleLogout = () => {
    this.props.onLogout({
      data: null,
      loggedIn: false,
    });
  };

  render() {
    const { data } = this.props.user;

    return (
      <div className='dashboard-page'>
        <div className='dashboard-top'>
          <GoBackBtn />
          <h2 className='dashboard-title'>Dashboard</h2>
          {/* <Button style='dashboard-button-main' name='Main' onClick={this.handleMainPage} /> */}
          {/* <Button style='dashboard-button-logout' name='Logout' onClick={this.handleLogout} /> */}
        </div>
        <hr className='dashboard-line' />
        <div className='dashboard-main'>
          {/* <p>Package: {data.package}</p> */}
          <p className='slots-current-label'>Available Slots: {data.totalslots}</p>
          <Slots />
        </div>
      </div>
    );
  }
}

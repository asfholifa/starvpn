import React, { PureComponent } from 'react';
import GoBackBtn from '../containers/GoBackBtn';

export default class Logs extends PureComponent {
  render() {
    const start = this.props.firstLogLine || 0;
    const logs = this.props.logs || [{ text: 'No logs yet' }];
    const logItems = logs.map((line, i) => {
      return <li key={start + i} className={line.important ? 'log-line-important' : 'log-line'}>{line.text}</li>
    });
    return (
      <div className='logs-page'>
        <div className='dashboard-top'>
          <GoBackBtn />
          <h2 className='welcome-title'>Connection logs</h2>
          <hr className='welcome-line' />
        </div>
        <div className='logs-container'>
          <ul className='logs-list'>
            {logItems}
          </ul>
        </div>
      </div>
    );
  }
}

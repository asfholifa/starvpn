import React, { Component } from 'react';

export default class RestUpdatesTable extends Component {
  render() {
    const { value } = this.props;
    // weirdest key-value map format ever: {1: {name: value}, 2: {name2: value2}, ...}
    // const rows = Object.keys(remainingIpUpdates).map(e => {
    //   const item = remainingIpUpdates[e];
    //   const [name] = Object.keys(item);
    //   return <tr key={name}><td>{name}</td><td>{item[name]}</td></tr>
    // });
    return <div>IP Updates Remaining this Month: {value}</div>
  }
}

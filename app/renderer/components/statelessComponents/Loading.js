import React from 'react'

export default class Loader extends React.Component {
  render() {
    const { loading, description } = this.props;
    return loading ? (
      <div className="base-loading">
        <div className="base-loader" />
        <span className="base-loader-text">{description}</span>
      </div>) : null;
  }
}
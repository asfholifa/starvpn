import React from 'react';

export default class ErrorsPopUp extends React.PureComponent {
  componentWillUnmount() {
    this.props.closeError();
  }

  openUrl = (e) => {
    e.preventDefault();
    this.props.openUrl(this.props.link.url);
  };

  render() {
    const { isVisible, message, closeError, closeText = 'Close', link } = this.props;
    return (
      <div className={`base-error ${isVisible ? 'visible' : ''}`}>
        <div className="base-error-container">
          <span className="base-error-message">
            {message}{' '}
            {link && (
              <a href={link.url} onClick={this.openUrl}>
                {link.text}
              </a>
            )}
          </span>
        </div>
        {closeError && (
          <div className="base-error-close" onClick={closeError}>
            {closeText}
          </div>
        )}
      </div>
    );
  }
}

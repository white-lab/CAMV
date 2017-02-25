import React from 'react'

class AcceptButton extends React.Component {
  onChange() {
    this.props.callback('accept')
  }

  render() {
    return (
      <input
        className="choiceButton"
        disabled={this.props.disabled}
        id="acceptButton"
        onClick={this.onChange.bind(this)}
        type="button"
        value="Accept"
      />
    )
  }
}

AcceptButton.propTypes = {
  disabled: React.PropTypes.bool,
  callback: React.PropTypes.func,
}

AcceptButton.defaultProps = {
  disabled: true,
  callback: null,
}

module.exports = AcceptButton

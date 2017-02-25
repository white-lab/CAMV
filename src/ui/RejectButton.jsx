import React from 'react'

class RejectButton extends React.Component {
  onChange() {
    this.props.callback('reject')
  }

  render() {
    return (
      <input
        id="rejectButton"
        className="choiceButton"
        type="button"
        value="Reject"
        disabled={this.props.disabled}
        onClick={this.onChange.bind(this)}
      />
    )
  }
}

RejectButton.propTypes = {
  disabled: React.PropTypes.bool,
  callback: React.PropTypes.func,
}

RejectButton.defaultProps = {
  disabled: true,
  callback: null,
}

module.exports = RejectButton

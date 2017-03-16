import React from 'react'
import { Button } from 'react-bootstrap'

class RejectButton extends React.Component {
  onChange() {
    this.props.callback('reject')
  }

  render() {
    return (
      <Button
        id="rejectButton"
        bsStyle="danger"
        className="choiceButton"
        value="Reject"
        disabled={this.props.disabled}
        onClick={this.onChange.bind(this)}
      >
        Reject
      </Button>
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

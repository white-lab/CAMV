import React from 'react'
import PropTypes from 'prop-types'
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
  disabled: PropTypes.bool,
  callback: PropTypes.func,
}

RejectButton.defaultProps = {
  disabled: true,
  callback: null,
}

module.exports = RejectButton

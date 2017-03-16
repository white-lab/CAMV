import React from 'react'
import { Button } from 'react-bootstrap'

class AcceptButton extends React.Component {
  onChange() {
    this.props.callback('accept')
  }

  render() {
    return (
      <Button
        className="choiceButton"
        bsStyle="success"
        disabled={this.props.disabled}
        id="acceptButton"
        onClick={this.onChange.bind(this)}
      >
        Accept
      </Button>
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

import React from 'react'
import { Button } from 'react-bootstrap'

class MaybeButton extends React.Component {
  onChange() {
    this.props.callback('maybe')
  }

  render() {
    return (
      <Button
        className="choiceButton"
        bsStyle="warning"
        disabled={this.props.disabled}
        id="maybeButton"
        onClick={this.onChange.bind(this)}
      >
        Maybe
      </Button>
    )
  }
}

MaybeButton.propTypes = {
  disabled: React.PropTypes.bool,
  callback: React.PropTypes.func,
}

MaybeButton.defaultProps = {
  disabled: true,
  callback: null,
}

module.exports = MaybeButton

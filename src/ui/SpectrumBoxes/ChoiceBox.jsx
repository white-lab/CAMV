import React from 'react'
import PropTypes from 'prop-types'

import AcceptButton from './Buttons/AcceptButton'
import MaybeButton from './Buttons/MaybeButton'
import RejectButton from './Buttons/RejectButton'

class ChoiceBox extends React.Component {
  render() {
    return (
      <div
        id="updateBox"
      >
        <div id="choiceBox">
          <AcceptButton
            callback={this.props.updateChoice}
            disabled={this.props.inputDisabled}
          />
          <MaybeButton
            callback={this.props.updateChoice}
            disabled={this.props.inputDisabled}
          />
          <RejectButton
            callback={this.props.updateChoice}
            disabled={this.props.inputDisabled}
          />
        </div>
      </div>
    )
  }
}

ChoiceBox.propTypes = {
  inputDisabled: PropTypes.bool,
  updateChoice: PropTypes.func,
}

ChoiceBox.defaultProps = {
  inputDisabled: true,
  updateChoice: null,
}

module.exports = ChoiceBox

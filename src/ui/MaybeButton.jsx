import React from 'react'

class MaybeButton extends React.Component {
  onChange() {
    this.props.callback('maybe')
  }

  render() {
    return (
      <input
        className="choiceButton"
        disabled={this.props.disabled}
        id="maybeButton"
        onClick={this.onChange.bind(this)}
        type="button"
        value="Maybe"
      />
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

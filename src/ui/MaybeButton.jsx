import React from 'react'

var MaybeButton = React.createClass({
  onChange: function() {
    this.props.callback('maybe')
  },

  render: function() {
    return (
      <input
        className="choiceButton"
        disabled={this.props.disabled}
        id="maybeButton"
        onClick={this.onChange}
        type="button"
        value="Maybe"
      />
    )
  }
});

module.exports = MaybeButton

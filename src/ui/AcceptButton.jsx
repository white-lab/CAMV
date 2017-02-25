import React from 'react'

var AcceptButton = React.createClass({
  onChange: function() {
    this.props.callback('accept')
  },

  render: function() {
    return (
      <input
        className="choiceButton"
        disabled={this.props.disabled}
        id="acceptButton"
        onClick={this.onChange}
        type="button"
        value="Accept"
      />
    )
  }
});

module.exports = AcceptButton

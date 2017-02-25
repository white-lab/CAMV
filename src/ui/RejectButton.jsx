import React from 'react'

var RejectButton = React.createClass({
  onChange: function() {
    this.props.callback('reject')
  },

  render: function() {
    return (
      <input
        id="rejectButton"
        className="choiceButton"
        type="button"
        value="Reject"
        disabled={this.props.disabled}
        onClick={this.onChange}
      />
    )
  }
});

module.exports = RejectButton

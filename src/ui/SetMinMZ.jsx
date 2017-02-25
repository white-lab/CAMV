import React from 'react'

var SetMinMZ = React.createClass({
  handleChange: function(event) {
    this.props.callback(event.target.value)
  },

  render: function() {
    return (
      <div id="setMinMZ">
        Min. m/z:
        <input
          className="numInput"
          disabled={this.props.disabled}
          onChange={this.handleChange}
          type="number"
          value={this.props.minMZ}
        />
      </div>
    )
  }
});

module.exports = SetMinMZ

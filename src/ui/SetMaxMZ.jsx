import React from 'react'

var SetMaxMZ = React.createClass({
  handleChange: function(event) {
    this.props.callback(event.target.value)
  },

  render: function() {
    return (
      <div id="setMaxMZ">
        Max. m/z:
        <input
          className="numInput"
          disabled={this.props.disabled}
          onChange={this.handleChange}
          type="number"
          value={this.props.maxMZ == null ? this.props.scanMaxMZ : this.props.maxMZ}
        />
      </div>
    )
  }
});

module.exports = SetMaxMZ

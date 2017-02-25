import React from 'react'

class SetMaxMZ extends React.Component {
  handleChange(event) {
    this.props.callback(event.target.value)
  }

  render() {
    return (
      <div id="setMaxMZ">
        Max. m/z:
        <input
          className="numInput"
          disabled={this.props.disabled}
          onChange={this.handleChange.bind(this)}
          type="number"
          value={this.props.maxMZ == null ? this.props.scanMaxMZ : this.props.maxMZ}
        />
      </div>
    )
  }
}

SetMaxMZ.propTypes = {
  callback: React.PropTypes.func.isRequired,
  disabled: React.PropTypes.bool,
  maxMZ: React.PropTypes.number,
  scanMaxMZ: React.PropTypes.number.isRequired,
}

SetMaxMZ.defaultProps = {
  disabled: false,
  maxMZ: null,
}

module.exports = SetMaxMZ

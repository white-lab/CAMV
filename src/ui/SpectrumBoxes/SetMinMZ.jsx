import React from 'react'

class SetMinMZ extends React.Component {
  handleChange(event) {
    this.props.callback(event.target.value)
  }

  render() {
    return (
      <div id="setMinMZ">
        Min. m/z:
        <input
          className="numInput"
          disabled={this.props.disabled}
          onChange={this.handleChange.bind(this)}
          type="number"
          value={this.props.minMZ}
        />
      </div>
    )
  }
}

SetMinMZ.propTypes = {
  callback: React.PropTypes.func.isRequired,
  disabled: React.PropTypes.bool,
  minMZ: React.PropTypes.number.isRequired,
}

SetMinMZ.defaultProps = {
  disabled: false,
}

module.exports = SetMinMZ

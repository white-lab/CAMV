import React from 'react'

function IonElement( { bion, found }) {
  return (
    <td
      className={this.props.bion ? "bIon" : "yIon"}
      style={{ color: this.props.found ? "red" : "lightgray" }}
    >
      {this.props.bion ? '⌉' : '⌊'}
    </td>
  )
}

IonElement.propTypes = {
  bion: React.PropTypes.bool.isRequired,
  found: React.PropTypes.bool,
}

IonElement.defaultProps = {
  found: false,
}

module.exports = IonElement

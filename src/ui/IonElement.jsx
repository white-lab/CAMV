import React from 'react'

class IonElement extends React.Component {
  render() {
    return (
      <td
        className={this.props.bion ? "bIon" : "yIon"}
        style={{ color: this.props.found ? "red" : "lightgray" }}
      >
        {this.props.bion ? '⌉' : '⌊'}
      </td>
    )
  }
}

IonElement.propTypes = {
  bion: React.PropTypes.bool.isRequired,
  found: React.PropTypes.bool.isRequired,
}

module.exports = IonElement

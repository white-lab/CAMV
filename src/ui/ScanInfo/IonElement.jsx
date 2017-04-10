import React from 'react'
import PropTypes from 'prop-types'

class IonElement extends React.Component {
  handleClick(e) {
    if (this.props.found && this.props.clickCallback != null) {
      this.props.clickCallback(this.props.bion, this.props.index)
    }
  }

  render() {
    return (
      <td>
        <a
          onClick={this.handleClick.bind(this)}
          className={this.props.bion ? "bIon" : "yIon"}
          style={{ color: this.props.found ? "red" : "lightgray" }}
        >
          {this.props.bion ? '⌉' : '⌊'}
        </a>
      </td>
    )
  }
}

IonElement.propTypes = {
  bion: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  found: PropTypes.bool,
  clickCallback: PropTypes.func,
}

IonElement.defaultProps = {
  found: false,
  clickCallback: null
}

module.exports = IonElement

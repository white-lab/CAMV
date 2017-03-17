import React from 'react'

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
  bion: React.PropTypes.bool.isRequired,
  index: React.PropTypes.number.isRequired,
  found: React.PropTypes.bool,
  clickCallback: React.PropTypes.func,
}

IonElement.defaultProps = {
  found: false,
  clickCallback: null
}

module.exports = IonElement

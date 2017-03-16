import React from 'react'

class SequenceElement extends React.Component {
  render() {
    return (
      <td
        className="aminoAcid"
      >
        { this.props.AA }
      </td>
    )
  }
}

SequenceElement.propTypes = {
  AA: React.PropTypes.string.isRequired,
}

module.exports = SequenceElement

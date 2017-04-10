import React from 'react'
import PropTypes from 'prop-types'

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
  AA: PropTypes.string.isRequired,
}

module.exports = SequenceElement

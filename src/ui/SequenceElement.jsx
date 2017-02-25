import React from 'react'

function SequenceElement({ AA }) {
  return (
    <td
      className="aminoAcid"
    >
      { AA }
    </td>
  )
}

SequenceElement.propTypes = {
  AA: React.PropTypes.string.isRequired,
}

module.exports = SequenceElement

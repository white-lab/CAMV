import React from 'react'

import IonElement from './IonElement'
import SequenceElement from './SequenceElement'

function SequenceBox({ sequence, bFound, yFound }) {
  if (this.props.sequence != null) {
    var sequence = this.props.sequence.split('')

    var bs = [<td key={0} />]
    var seq = []
    var ys = [<td key={0} />]

    sequence.slice(0, -1).forEach(
      function (item, i) {
        let found = this.props.bFound.indexOf(i + 1) > -1
        bs.push(
          <IonElement
            bion
            found={found}
            key={i * 2 + 1}
          />
        )
        bs.push(<td key={i * 2 + 2} />)
      }.bind(this)
    )

    sequence.forEach(
      function (item, i) {
        seq.push(
          <SequenceElement
            AA={item}
            key={i * 2}
          />
        )
        seq.push(<td key={i * 2 + 1} />)
      }.bind(this)
    )

    sequence.slice(0, -1).forEach(
      function (item, i) {
        let found = this.props.yFound.indexOf(this.props.sequence.length - i - 1) > -1
        ys.push(
          <IonElement
            bion={false}
            found={found}
            key={i * 2 + 1}
          />
        )
        ys.push(<td key={i * 2 + 2} />)
      }.bind(this)
    )

    var rows = [bs, seq, ys]

    return (
      <div id="sequence">
        <table>
          <tbody>
            {
              rows.map(
                (row, i) => {
                  return <tr key={i}>{row}</tr>
                }
              )
            }
          </tbody>
        </table>
      </div>
    )
  } else {
    return <table><tbody /></table>
  }
}

SequenceBox.propTypes = {
  sequence: React.PropTypes.string,
  bFound: React.PropTypes.arrayOf(React.PropTypes.number),
  yFound: React.PropTypes.arrayOf(React.PropTypes.number),
}

SequenceBox.defaultProps = {
  sequence: null,
  bFound: [],
  yFound: [],
}

module.exports = SequenceBox

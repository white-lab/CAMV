import React from 'react'

import IonElement from './IonElement'
import SequenceElement from './SequenceElement'

class SequenceBox extends React.Component {
  byClick(bion, index) {
    if (this.props.clickCallback != null) {
      let bindex = index
      let yindex = this.props.sequence.length - index

      if (!bion) {
        bindex = this.props.sequence.length - index
        yindex = index
      }

      let bions = this.props.bFound.filter(i => i[0] == bindex).map(i => i.slice(1))
      let yions = this.props.yFound.filter(i => i[0] == yindex).map(i => i.slice(1))

      this.props.clickCallback(bions, yions)
    }
  }

  render() {
    if (this.props.sequence != null) {
      var sequence = this.props.sequence.split('')

      var bs = [<td key={0} />]
      var seq = []
      var ys = [<td key={0} />]

      sequence.slice(0, -1).forEach(
        function (item, i) {
          let found = this.props.bFound.map(i => i[0])
            .indexOf(i + 1) > -1

          bs.push(
            <IonElement
              bion
              found={found}
              key={i * 2 + 1}
              index={i + 1}
              clickCallback={this.byClick.bind(this)}
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
          let found = this.props.yFound.map(i => i[0])
            .indexOf(this.props.sequence.length - i - 1) > -1

          ys.push(
            <IonElement
              bion={false}
              found={found}
              key={i * 2 + 1}
              index={this.props.sequence.length - i - 1}
              clickCallback={this.byClick.bind(this)}
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
}

SequenceBox.propTypes = {
  sequence: React.PropTypes.string,
  bFound: React.PropTypes.array,
  yFound: React.PropTypes.array,
  clickCallback: React.PropTypes.func,
}

SequenceBox.defaultProps = {
  sequence: null,
  bFound: [],
  yFound: [],
  clickCallback: null,
}

module.exports = SequenceBox

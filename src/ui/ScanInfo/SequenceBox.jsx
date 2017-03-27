import React from 'react'

import IonElement from './IonElement'
import SequenceElement from './SequenceElement'

class SequenceBox extends React.Component {
  byClick(bion, index) {
    if (this.props.clickCallback != null) {
      let sequence = this.props.ptm.name
      let bindex = index
      let yindex = sequence.length - index

      if (!bion) {
        bindex = sequence.length - index
        yindex = index
      }

      let [bFound, yFound] = this.getBYFound()

      let bions = bFound.filter(i => i[0] == bindex).map(i => i[1])
      let yions = yFound.filter(i => i[0] == yindex).map(i => i[1])

      this.props.clickCallback(bions, yions)
    }
  }

  getBYFound() {
    let bFound = []
    let yFound = []

    this.props.spectrumData.forEach(function(peak, index) {
      if (peak.ionType == 'b') {
        bFound.push([peak.ionPos, peak])
      } else if (peak.ionType == 'y') {
        yFound.push([peak.ionPos, peak])
      }
    }.bind(this))

    return [bFound, yFound]
  }

  render() {
    if (this.props.ptm != null) {
      let sequence = this.props.ptm.name.split('')
      let [bFound, yFound] = this.getBYFound()

      let bs = [<td key={0} />]
      let seq = []
      let ys = [<td key={0} />]

      sequence.slice(0, -1).forEach(
        function (item, i) {
          let found = bFound.map(i => i[0])
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
          let found = yFound.map(i => i[0])
            .indexOf(sequence.length - i - 1) > -1

          ys.push(
            <IonElement
              bion={false}
              found={found}
              key={i * 2 + 1}
              index={sequence.length - i - 1}
              clickCallback={this.byClick.bind(this)}
            />
          )
          ys.push(<td key={i * 2 + 2} />)
        }.bind(this)
      )

      let rows = [bs, seq, ys]

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
  ptm: React.PropTypes.object,
  spectrumData: React.PropTypes.array,
  clickCallback: React.PropTypes.func,
}

SequenceBox.defaultProps = {
  ptm: null,
  spectrumData: [],
  clickCallback: null,
}

module.exports = SequenceBox

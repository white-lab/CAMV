import React from 'react';

var YIonElement = React.createClass({
  render: function() {
    if (this.props.found) {
      return <td className="yIon" style={{color:"red"}}>&lfloor;</td>
    } else {
      return <td className="yIon" style={{color:"lightgray"}}>&lfloor;</td>
    }
  }
});

var BIonElement = React.createClass({
  render: function() {
    if (this.props.found) {
      return <td className="bIon" style={{color:"red"}}>&rceil;</td>
    } else{
      return <td className="bIon" style={{color:"lightgray"}}>&rceil;</td>
    }
  }
});

var SequenceElement = React.createClass({
  render: function() {
    return <td className="aminoAcid">{this.props.AA}</td>
  }
});

var SequenceBox = React.createClass({
  render: function() {
    if (this.props.sequence != null) {
      var sequence = this.props.sequence.split('')

      var bs = [<td key={0}></td>]
      var seq = []
      var ys = [<td key={0}></td>]

      sequence.slice(0, -1).forEach(
        function (item, i) {
          let found = this.props.bFound.indexOf(i + 1) > -1
          bs.push(<BIonElement key={i * 2 + 1} found={found}/>)
          bs.push(<td key={i * 2 + 2}></td>)
        }.bind(this)
      )

      sequence.forEach(
        function (item, i) {
          seq.push(<SequenceElement AA={item} key={i * 2}/>)
          seq.push(<td key={i * 2 + 1}></td>)
        }.bind(this)
      )

      sequence.slice(0, -1).forEach(
        function (item, i) {
          let found = this.props.yFound.indexOf(this.props.sequence.length - i - 1) > -1
          ys.push(<YIonElement key={i * 2 + 1} found={found}/>)
          ys.push(<td key={i * 2 + 2}></td>)
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
      );
    } else {
      return <table><tbody></tbody></table>
    }
  }

});

module.exports = SequenceBox

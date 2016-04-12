
var YIonElement = React.createClass({
  render: function(){
    if (this.props.found){
      return <td className="yIon" style={{color:"red"}}>&lceil;</td>
    } else {
      return <td className="yIon" style={{color:"lightgray"}}>&lceil;</td>
    }
  }
});

var BIonElement = React.createClass({
  render: function(){
    if (this.props.found){
      return <td className="bIon" style={{color:"red"}}>&rfloor;</td>
    } else{
      return <td className="bIon" style={{color:"lightgray"}}>&rfloor;</td>
    }
  }
});

var SequenceElement = React.createClass({
  render: function(){
    return <td className="aminoAcid">{this.props.AA}</td>
  }
});

var SequenceBox = React.createClass({
  render: function(){
    if (this.props.sequence != null){
      var sequence = this.props.sequence.split('')
      var rows = []
      rows.push(sequence.map(function(item, i){
                               found = this.props.yFound.indexOf(this.props.sequence.length - i - 1) > -1
                               return <YIonElement key={i} found={found}/>
                             }.bind(this)))

      rows.push(sequence.map(function(item, i){
                                  return <SequenceElement AA={item} key={i}/>
                                }.bind(this)))

      rows.push(sequence.map(function(item, i){
                                     found = this.props.bFound.indexOf(i + 1) > -1
                                     return <BIonElement key={i} found={found}/>
                                   }.bind(this)))
      return ( 
        <div id="sequence">
          <table><tbody>
          {rows.map(function(row, i){
            return <tr key={i}>{row}</tr>
          })}
          </tbody></table>
        </div>
      );
    } else {
      return <table><tbody></tbody></table>
    }
  }

});

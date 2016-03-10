var RunFileNameDropDown = React.createClass({
  handleChange: function(event) {
    console.log(event.target.value)
    this.props.callback(event.target.value)
  },
  buildDropDown: function() {
    return (
      <select defaultValue="0" onChange={this.handleChange}>
        <option value="0" disabled="disabled">Run File Name</option>
        {
          this.props.runNames.map(function(i){
            return (
              <option key={i} value={i}>{i}</option>
            )
          })
        }
      </select>
    )
  },

  render: function(){
    return ( this.buildDropDown() );
  }
}); 

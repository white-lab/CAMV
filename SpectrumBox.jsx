var SpectrumBox = React.createClass({

  drawChart: function() {

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'mz');
    data.addColumn('number', 'Intensity');
    data.addColumn({'type': 'string', 'role': 'style'})
    data.addColumn({'type': 'string', 'role': 'annotation'})

    this.props.spectrumData.forEach(function(peak){
      mz = peak.mz
      into = peak.into
      name = ''
      ppm = null

      if (this.props.selectedPTMPlacement != null){
        style = 'point {size: 5; fill-color: red; visible: true}'
      } else {
        style = 'point {size: 5; fill-color: red; visible: false}'
      }
      var matchInfo = peak.matchInfo[this.props.selectedPTMPlacement]
      if (matchInfo != null){
        var matchId = matchInfo.matchId
        if (matchId){
          var match = this.props.matchData[matchId]
          ppm = Math.abs(match.mz - mz) / mz * 1000000 
          name = match.name
          // TO DO: change these conditions to match color coding
          if (into == 0) {
            // Plot intermediate line-plot points along x-axis
            style = null
          } else if (ppm < 10){
            style = 'point {size: 5; fill-color: green; visible: true}'
          }
        }
      }
           
      data.addRows([[mz, 0, null, null], 
                    [mz, into, style, name], 
                    [mz, 0, null, null]])
    }.bind(this))

    var options = {
      // title: 'Age vs. Weight comparison',
      hAxis: {title: 'mz', 
              //minValue: this.props.data[0][0] - 5, 
              //maxValue: this.props.data[this.props.data.length - 1][0] + 5
             },
      vAxis: {title: 'Intensity', 
              minValue: 0, 
              maxValue: 15},
      annotations: { textStyle: { }},
      legend: 'none',
      tooltip: {trigger: 'none'}
    };

    var chart = new google.visualization.LineChart(document.getElementById('spectrumBox'));

    google.visualization.events.addListener(chart, 'select', selectHandler.bind(this));

    function selectHandler(e) {
      var selectedItem = chart.getSelection()[0];
      if (selectedItem) {
        var mz = data.getValue(selectedItem.row, 0)
        this.props.pointChosenCallback(mz)
      }
    }
    chart.draw(data, options);
  },

  componentDidMount: function(){
    var component = this;

    // Load the chart API
    return jQuery.ajax({
      dataType: "script",
      cache: true,
      url: "https://www.google.com/jsapi",
    })
      .done(function () {
        google.load("visualization", "1", {
          packages:["corechart"],
          callback: function () {
            component.drawChart();
          },
        });
      }); 
  },
  
  componentDidUpdate: function (prevProps, prevState) {
    if (prevProps.spectrumData != this.props.spectrumData) {
      this.drawChart();
    } else if (prevProps.selectedPTMPlacement != this.props.selectedPTMPlacement){
      this.drawChart();
    }
  },

  render: function(){
    return (
      <div>
        <div id="spectrumBox"></div>
      </div>
    );
  } 
});

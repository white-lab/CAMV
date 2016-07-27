var PrecursorSpectrumBox = React.createClass({
  getInitialState: function(){
    return {chartLoaded: false}
  },

  drawChart: function() {
    var data = new google.visualization.DataTable();
    data.addColumn('number', 'mz');
    data.addColumn('number', 'Intensity');
    data.addColumn({'type': 'string', 'role': 'style'})
    data.addColumn({'type': 'string', 'role': 'annotation'})

    var precursorMz = this.props.precursorMz
    var chargeState = this.props.chargeState
    var ppm = this.props.ppm

    this.props.spectrumData.forEach(function(peak){
      var mz = peak.mz
      var into = peak.into
      var name = ''

      var found = false

      var ionSeries = [0,1,2,3,4,5]

      ionSeries.forEach(function(val){
        var currPPM = 1000000 * (mz - precursorMz - 1.0079 * val / chargeState) / mz
        if (Math.abs(currPPM) < ppm){
          found = true
        }
      })

      if (found){
        style = 'point {size: 5; fill-color: green; visible: true}'
      } else {
        style = 'point {size: 5; fill-color: green; visible: false}'
      }

      data.addRows([[mz, 0, null, null],
                    [mz, into, style, name],
                    [mz, 0, null, null]])
    })

    var options = {
      title: 'Precursor',
      hAxis: {title: 'mz',
              minValue: this.props.precursorMz - 1,
              maxValue: this.props.precursorMz + 1
             },
      vAxis: {title: 'Intensity'},
      annotations: { textStyle: { }},
      legend: 'none',
      tooltip: {trigger: 'none'}
    };

    var chart = new google.visualization.LineChart(document.getElementById('precursorGoogleChart'));

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
            component.setState({chartLoaded: true})
          },
        });
      });
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (this.state.chartLoaded){
      if (prevProps.spectrumData != this.props.spectrumData) {
        this.drawChart();
      }
    }
  },

  render: function(){
    return (
      <div>
        <div id="precursorGoogleChart"></div>
      </div>
    );
  }
});

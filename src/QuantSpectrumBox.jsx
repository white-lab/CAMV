var QuantSpectrumBox = React.createClass({
  getInitialState: function(){
    return {chartLoaded: false}
  },

  drawChart: function() {

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'mz');
    data.addColumn('number', 'Intensity');
    data.addColumn({'type': 'string', 'role': 'style'})
    data.addColumn({'type': 'string', 'role': 'annotation'})

    var quantMz = this.props.quantMz
    var minMZ = Math.round(2 * Math.min.apply(null, quantMz)) / 2 - 1
    var maxMZ = Math.round(2 * Math.max.apply(null, quantMz)) / 2 + 1
    var ppm = this.props.ppm

    if (this.props.spectrumData.length > 0) {
      data.addRows([[minMZ, 0, null, null]])

      this.props.spectrumData.forEach(function(peak){
        var mz = peak.mz
        var into = peak.into
        var name = ''

        var found = false

        quantMz.forEach(function(val){
          var currPPM = 1000000 * Math.abs(mz - val) / val
          if (currPPM < ppm){
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

      data.addRows([[maxMZ, 0, null, null]])
    }

    var options = {
      title: 'Quantification',
      hAxis: {
        // title: 'mz',
        minValue: minMZ,
        maxValue: maxMZ
      },
      vAxis: {
        // title: 'Intensity'
      },
      annotations: { textStyle: { }, stemColor: 'none' },
      legend: 'none',
      tooltip: {trigger: 'none'}
    };

    var chart = new google.visualization.LineChart(document.getElementById('quantGoogleChart'));

    chart.draw(data, options);
  },

  componentDidMount: function(){
    window.addEventListener('resize', this.handleResize);

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
    if (this.state.chartLoaded) {
      if (prevProps.spectrumData != this.props.spectrumData) {
        this.drawChart();
      }
    }
  },

  componentWillUnmount: function() {
    window.removeEventListener('resize', this.handleResize);
  },

  handleResize: function(e) {
    if (this.state.chartLoaded) {
      this.drawChart();
    }
  },

  render: function(){
    return (
      <div>
        <div id="quantGoogleChart"></div>
      </div>
    );
  }
});

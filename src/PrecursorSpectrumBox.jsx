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
    data.addColumn('number', 'Isolation');

    var precursorMz = this.props.precursorMz
    var minMZ = precursorMz - 1
    var maxMZ = precursorMz + 1
    var chargeState = this.props.chargeState
    var ppm = this.props.ppm

    if (this.props.spectrumData.length > 0) {
      var max_y = Math.max.apply(
        null,
        this.props.spectrumData.filter(
          function(element) { return element.mz >= minMZ && element.mz <= maxMZ }
        ).map(
          function(element) { return element.into }
        )
      );

      data.addRows([[minMZ, 0, null, null, null]]);

      /* Draw a box for the isolation window, if data is available */
      if (this.props.isolationWindow != null) {
        var lower_window = precursorMz - this.props.isolationWindow[0];
        var upper_window = precursorMz + this.props.isolationWindow[1];

        data.addRows([
          [lower_window, 0, null, null, 0],
          [lower_window, 0, null, null, max_y * 1.1],
          [upper_window, 0, null, null, max_y * 1.1],
          [upper_window, 0, null, null, 0]
        ]);
      }

      this.props.spectrumData.forEach(function(peak) {
        var mz = peak.mz
        var into = peak.into
        var name = ''

        var found = false

        var ionSeries = [0,1,2,3,4,5]

        ionSeries.forEach(function(val) {
          var currPPM = 1000000 * (mz - precursorMz - 1.0079 * val / chargeState) / mz
          if (Math.abs(currPPM) < ppm) {
            found = true
          }
        })

        if (found) {
          style = 'point {size: 5; fill-color: green; visible: true}'
        } else {
          style = 'point {size: 5; fill-color: green; visible: false}'
        }

        data.addRows([
          [mz, 0,    null,  null, null],
          [mz, into, style, name, null],
          [mz, 0,    null,  null, null]
        ])
      })

      data.addRows([
        [maxMZ, 0, null, null, null]
      ])
    }

    var options = {
      title: 'Precursor',
      hAxis: {
        // title: 'mz',
        gridlines: { color: 'transparent' },
        minValue: minMZ,
        maxValue: maxMZ
      },
      vAxis: {
        // title: 'Intensity',
        gridlines: { color: 'transparent' },
        minValue: 0,
        maxValue: max_y * 1.1
      },
      annotations: { textStyle: { }, stemColor: 'none' },
      legend: 'none',
      tooltip: {trigger: 'none'}
    };

    var chart = new google.visualization.AreaChart(document.getElementById('precursorGoogleChart'));

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
        <div id="precursorGoogleChart"></div>
      </div>
    );
  }
});

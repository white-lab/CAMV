import React from 'react'

class PrecursorSpectrumBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      chartLoaded: false,
    }
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
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
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.chartLoaded) {
      if (prevProps.spectrumData != this.props.spectrumData) {
        this.drawChart();
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  drawChart() {
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
          (element) => { return element.mz >= minMZ && element.mz <= maxMZ }
        ).map(
          (element) => { return element.into }
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

        var style = ''

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
  }

  handleResize() {
    if (this.state.chartLoaded) {
      this.drawChart();
    }
  }

  render() {
    return (
      <div>
        <div id="precursorGoogleChart" />
      </div>
    );
  }
}

PrecursorSpectrumBox.propTypes = {
  chargeState: React.PropTypes.number,
  isolationWindow: React.PropTypes.number,
  ppm: React.PropTypes.number,
  precursorMz: React.PropTypes.number,
  spectrumData: React.PropTypes.array,
}

PrecursorSpectrumBox.defaultProps = {
  chargeState: 2,
  isolationWindow: 0.4,
  ppm: 20,
  precursorMz: 0,
  spectrumData: [],
}

module.exports = PrecursorSpectrumBox

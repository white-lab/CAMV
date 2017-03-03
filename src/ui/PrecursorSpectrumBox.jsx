import React from 'react'

class PrecursorSpectrumBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      chartLoaded: false,
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize.bind(this));

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
    window.removeEventListener('resize', this.handleResize.bind(this));
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
        let lower_window = precursorMz - this.props.isolationWindow[0];
        let upper_window = precursorMz + this.props.isolationWindow[1];

        data.addRows([
          [lower_window, 0, null, null, 0],
          [lower_window, 0, null, null, max_y * 1.1],
          [upper_window, 0, null, null, max_y * 1.1],
          [upper_window, 0, null, null, 0]
        ]);
      }

      this.props.spectrumData.forEach(function(peak) {
        let mz = peak.mz
        let into = peak.into
        let name = ''
        let found = false
        let ionSeries = [0, 1, 2, 3, 4, 5]

        ionSeries.forEach(function(val) {
          var currPPM = 1000000 * (mz - precursorMz - 1.0079 * val / chargeState) / mz
          if (Math.abs(currPPM) < ppm) {
            found = true
          }
        })

        let contaminant = !found && this.props.isolationWindow != null && (
          mz >= precursorMz - this.props.isolationWindow[0] &&
          mz <= precursorMz + this.props.isolationWindow[1]
        )

        let style = ''

        if (found) {
          style = 'point {size: 5; fill-color: #5CB85C; visible: true}'
        } else if (contaminant) {
          style = 'point {size: 3; fill-color: red; visible: true}'
        } else {
          style = 'point {size: 5; fill-color: #5CB85C; visible: false}'
        }

        data.addRows([
          [mz, 0,    null,  null, null],
          [mz, into, style, name, null],
          [mz, 0,    null,  null, null]
        ])
      }.bind(this))

      data.addRows([
        [maxMZ, 0, null, null, null]
      ])
    }

    var options = {
      title: 'Precursor',
      hAxis: {
        // title: 'mz',
        gridlines: { color: 'transparent' },
        minValue: this.props.spectrumData.length > 0 ? minMZ : 0,
        maxValue: this.props.spectrumData.length > 0 ? maxMZ : 100,
      },
      vAxis: {
        // title: 'Intensity',
        gridlines: { color: 'transparent' },
        format: 'scientific',
        minValue: 0,
        maxValue: this.props.spectrumData.length > 0 ? null : 100,
      },
      chartArea: { left: "15%", bottom: "15%", width: "75%", height: "75%" },
      annotations: { textStyle: { }, stemColor: 'none' },
      legend: 'none',
      tooltip: {trigger: 'none'},
      explorer: {
        actions: ['dragToZoom', 'rightClickToReset'],
        axis: 'horizontal',
        maxZoomIn: 0.01,
      },
    };

    var chart = new google.visualization.AreaChart(document.getElementById('precursorGoogleChart'));

    chart.draw(data, options);
  }

  handleResize() {
    this.drawChart();
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
  isolationWindow: React.PropTypes.array,
  ppm: React.PropTypes.number,
  precursorMz: React.PropTypes.number,
  spectrumData: React.PropTypes.array,
}

PrecursorSpectrumBox.defaultProps = {
  chargeState: 2,
  isolationWindow: null,
  ppm: 20,
  precursorMz: 0,
  spectrumData: [],
}

module.exports = PrecursorSpectrumBox

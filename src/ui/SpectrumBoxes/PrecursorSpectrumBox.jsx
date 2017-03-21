import React from 'react'

class PrecursorSpectrumBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      chartLoaded: false,
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize.bind(this))

    let component = this

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
            component.drawChart()
            component.setState({chartLoaded: true})
          },
        })
      })
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.chartLoaded) {
      if (prevProps.spectrumData != this.props.spectrumData) {
        this.drawChart()
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize.bind(this))
  }

  drawChart() {
    if (!this.state.chartLoaded) { return }

    let data = new google.visualization.DataTable()

    data.addColumn('number', 'mz')
    data.addColumn('number', 'Intensity')
    data.addColumn({'type': 'string', 'role': 'style'})
    data.addColumn({'type': 'string', 'role': 'annotation'})
    data.addColumn('number', 'Isolation')

    let precursorMz = this.props.precursorMz
    let minMZ = precursorMz - 1
    let maxMZ = precursorMz + 1
    let chargeState = this.props.chargeState
    let ppm = this.props.ppm

    console.log(this.props.spectrumData)

    if (this.props.spectrumData.length > 0) {
      let max_y = Math.max.apply(
        null,
        this.props.spectrumData.filter(
          (element) => { return element.mz >= minMZ && element.mz <= maxMZ }
        ).map(
          (element) => { return element.into }
        )
      )

      data.addRows([[minMZ, 0, null, null, null]])

      /* Draw a box for the isolation window, if data is available */
      if (this.props.isolationWindow != null) {
        let lower_window = precursorMz - this.props.isolationWindow[0]
        let upper_window = precursorMz + this.props.isolationWindow[1]

        data.addRows([
          [lower_window, 0, null, null, 0],
          [lower_window, 0, null, null, max_y * 1.1],
          [upper_window, 0, null, null, max_y * 1.1],
          [upper_window, 0, null, null, 0]
        ])
      }

      let ionSeries = []

      for (let i = -this.props.c13Num; i <= 5; i++) {
        ionSeries.push(i)
      }

      let indices = ionSeries.map(
        function(val) {
          let errs = this.props.spectrumData.map(
            peak => 1e6 * Math.abs(peak.mz - (precursorMz + 1.003355 * val / chargeState)) / peak.mz
          )

          if (errs.every(val => val > ppm))
            return null

          return errs.indexOf(Math.min.apply(Math, errs))
        }.bind(this)
      )

      this.props.spectrumData.forEach(function(peak, index) {
        let mz = peak.mz
        let into = peak.into
        let name = ''
        let found = (indices.indexOf(index) != -1)

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

    let options = {
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
    }

    let chart = new google.visualization.AreaChart(
      document.getElementById('precursorGoogleChart')
    )

    chart.draw(data, options)
  }

  handleResize() {
    this.drawChart()
  }

  render() {
    return (
      <div>
        <div id="precursorGoogleChart" />
      </div>
    )
  }
}

PrecursorSpectrumBox.propTypes = {
  chargeState: React.PropTypes.number,
  isolationWindow: React.PropTypes.array,
  c13Num: React.PropTypes.number,
  ppm: React.PropTypes.number,
  precursorMz: React.PropTypes.number,
  spectrumData: React.PropTypes.array,
}

PrecursorSpectrumBox.defaultProps = {
  chargeState: 2,
  isolationWindow: null,
  c13Num: 0,
  ppm: 20,
  precursorMz: 0,
  spectrumData: [],
}

module.exports = PrecursorSpectrumBox

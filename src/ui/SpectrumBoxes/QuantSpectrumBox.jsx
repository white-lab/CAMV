import React from 'react'
import PropTypes from 'prop-types'

class QuantSpectrumBox extends React.Component {
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

    let quantMz = this.props.spectrumData
    let minMZ = Math.round(2 * Math.min.apply(null, quantMz.map(i => i.mz))) / 2 - 1
    let maxMZ = Math.round(2 * Math.max.apply(null, quantMz.map(i => i.mz))) / 2 + 1
    let ppm = this.props.ppm

    if (this.props.spectrumData.length > 0) {
      data.addRows([[minMZ, 0, null, null]])

      let ppm_cutoff = 10

      if (this.props.collisionType == "CID") {
        ppm_cutoff = 1000
      } else if (this.props.collisionType == "HCD") {
        ppm_cutoff = 10
      }

      this.props.spectrumData.forEach(function(peak, index) {
        let mz = peak.mz
        let into = peak.into
        let name = ''
        let style = ''

        if (peak.name != null) {
          name = peak.name

          if (peak.ppm < ppm_cutoff) {
            style = 'point {size: 5; fill-color: #5CB85C; visible: true}'
          } else {
            style = 'point {size: 5; shape-type: star; fill-color: #FF00FF; visible: true}'
          }
        } else {
          style = 'point {size: 5; fill-color: #5CB85C; visible: false}'
        }

        data.addRows([
          [mz, 0, null, null],
          [mz, into, style, name],
          [mz, 0, null, null]
        ])
      })

      data.addRows([[maxMZ, 0, null, null]])
    }

    let options = {
      title: 'Quantification',
      hAxis: {
        // title: 'mz',
        gridlines: { color: 'transparent' },
        minValue: this.props.spectrumData.length > 0 ? minMZ : 0,
        maxValue: this.props.spectrumData.length > 0 ? maxMZ : 100,
      },
      vAxis: {
        // title: 'Intensity'
        gridlines: { color: 'transparent' },
        format: 'scientific',
        maxValue: this.props.spectrumData.length > 0 ? null : 100,
      },
      chartArea: { left: "15%", bottom: "15%", width: "75%", height: "75%" },
      annotations: { textStyle: { }, stemColor: 'none' },
      legend: 'none',
      tooltip: {trigger: 'none'},
      explorer: {
        actions: ['dragToZoom', 'rightClickToReset'],
        axis: 'horizontal',
        maxZoomIn: 0.00001,
      },
    }

    let chart = new google.visualization.LineChart(
      document.getElementById('quantGoogleChart')
    )

    if (this.props.pointChosenCallback != null) {
      google.visualization.events.addListener(
        chart, 'select',
        function (e) {
          let selectedItem = chart.getSelection()[0]

          if (selectedItem) {
            if (
              data.getValue(selectedItem.row, 1) == 0
            ) { return}

            let mz = data.getValue(selectedItem.row, 0)
            let peak = this.props.spectrumData.find(
              peak => peak.mz === mz
            )
            this.props.pointChosenCallback(peak)
          }
        }.bind(this)
      )
    }

    chart.draw(data, options)
  }

  handleResize() {
    this.drawChart()
  }

  render() {
    return (
      <div>
        <div id="quantGoogleChart" />
      </div>
    )
  }
}

QuantSpectrumBox.propTypes = {
  ppm: PropTypes.number,
  quantMz: PropTypes.arrayOf(PropTypes.object),
  spectrumData: PropTypes.array,

  pointChosenCallback: PropTypes.func,
}

QuantSpectrumBox.defaultProps = {
  ppm: 20,
  spectrumData: [],

  pointChosenCallback: null,
}

module.exports = QuantSpectrumBox

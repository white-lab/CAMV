import React from 'react'
import PropTypes from 'prop-types'

import cmp from '../../utils/cmp'
import newId from '../../utils/newId'

class BaseSpectrum extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      chartLoaded: false,
      exporting: false,
    }

    this.chartId = newId()
    this.resetMinMax()
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
      .done(() => {
        google.load("visualization", "1", {
          packages:["corechart"],
          callback: () => {
            this.setState({chartLoaded: true})
          },
        })
      })
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.chartLoaded) {
      if (
        !cmp(prevProps.spectrumData, this.props.spectrumData) ||
        prevState.chartLoaded != this.state.chartLoaded
      ) {
        this.updatePeaks()
        this.drawChart()
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize.bind(this))
  }

  resetMinMax() {
    this.minMZ = 0
    this.maxMZ = 100
    this.maxY = 100
  }

  getOptions() {
    return {
      hAxis: {
        // title: 'mz',
        gridlines: { color: 'transparent' },
        minValue: this.minMZ,
        maxValue: this.maxMZ,
      },
      vAxis: {
        // title: 'Intensity'
        gridlines: { color: 'transparent' },
        format: 'scientific',
        maxValue: this.maxY,
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
  }

  updatePeaks() {
    if (this.props.spectrumData.length <= 0) { return }

    this.maxMZ = Math.ceil(
      this.props.spectrumData[this.props.spectrumData.length - 1].mz + 1
    )
    this.maxY = null

    let ppm_cutoff = 10

    if (this.props.collisionType == "CID") {
      ppm_cutoff = 1000
    } else if (this.props.collisionType == "HCD") {
      ppm_cutoff = 10
    }

    this.props.spectrumData.forEach(peak => {
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

      peak.style = style
      peak.peak_name = name
    })
  }

  getData() {
    let arr = [
      [
        {label: "mz", type: "number"},
        {label: "Intensity", type: "number"},
        {type: 'string', role: 'style'},
        {type: 'string', role: 'annotation'},
      ],
    ]

    if (this.props.spectrumData.length > 0) {
      arr.push([this.minMZ, 0, null, null])

      this.props.spectrumData.forEach(peak => {
        arr.push([peak.mz, 0, null, null])
        arr.push([peak.mz, peak.into, peak.style, peak.peak_name])
        arr.push([peak.mz, 0, null, null])
      })

      arr.push([this.maxMZ, 0, null, null])
    }

    return arr
  }

  drawChart() {
    if (!this.state.chartLoaded) { return }

    let data = new google.visualization.arrayToDataTable(
      this.getData(), false,
    )

    let chart = new google.visualization.AreaChart(
      document.getElementById(this.chartId)
    )

    if (this.props.pointChosenCallback != null) {
      google.visualization.events.addListener(
        chart, 'select',
        e => {
          let selectedItem = chart.getSelection()[0]

          if (selectedItem) {
            let name = data.getValue(selectedItem.row, 3)
            if (name == null) { return }

            let mz = data.getValue(selectedItem.row, 0)
            let peak = this.props.spectrumData.find(
              peak => peak.mz === mz
            )
            this.props.pointChosenCallback(peak)
          }
        }
      )
    }

    chart.draw(data, this.getOptions())
  }

  handleResize() {
    this.drawChart()
  }

  render() {
    return (
      <div>
        <div
          id={this.chartId}
          className="baseSpectrumChart"
        />
      </div>
    )
  }
}

BaseSpectrum.propTypes = {
  spectrumData: PropTypes.array,
  pointChosenCallback: PropTypes.func,
}

BaseSpectrum.defaultProps = {
  spectrumData: [],
  pointChosenCallback: null,
}

module.exports = BaseSpectrum

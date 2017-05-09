import React from 'react'
import PropTypes from 'prop-types'

import cmp from '../../utils/cmp'
import newId from '../../utils/newId'

import MassSpectrum from './MassSpectrum'

class BaseSpectrum extends React.Component {
  constructor(props) {
    super(props)

    this.chartId = newId()
    this.resetMinMax()
    this.graph = null
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize.bind(this))
    this.drawChart()
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      !cmp(prevProps.spectrumData, this.props.spectrumData)
    ) {
      this.updatePeaks()
      this.drawChart()
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
      "xmin": this.minMZ,
      "xmax": this.maxMZ,
      "ymin": 0,
      "ymax": this.maxY * 1.1,
      "xlabel": "m/z",
      "ylabel": "Intensity",
      "clickCallback": this.props.pointChosenCallback,
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
      let size = 5
      let color = '#5CB85C'
      let visible = true
      let shape = 'circle'

      if (peak.name != null) {
        name = peak.name

        if (peak.ppm > ppm_cutoff) {
          color = "#FF00FF"
          shape = 'star'
        }
      } else {
        visible = false
      }

      peak.size = size
      peak.color = color
      peak.visible = visible
      peak.shape = shape
      peak.peak_name = name
    })
  }

  drawChart() {
    if (this.graph != null) {
      this.graph.remove()
    }

    this.graph = new MassSpectrum(
      this.chartId,
      this.props.spectrumData,
      this.getOptions(),
    )
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

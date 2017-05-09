import React from 'react'
import PropTypes from 'prop-types'

import BaseSpectrum from './BaseSpectrum'

import cmp from '../../utils/cmp'

class QuantSpectrumBox extends BaseSpectrum {
  getOptions() {
    let options = super.getOptions()
    options.title = "Quantification"
    options.xlabel = ''
    options.ylabel = ''
    return options
  }

  updatePeaks() {
    if (this.props.spectrumData.length <= 0) { return }

    let quantMz = this.props.spectrumData
    this.minMZ = Math.round(2 * Math.min.apply(null, quantMz.map(i => i.mz))) / 2 - 1
    this.maxMZ = Math.round(2 * Math.max.apply(null, quantMz.map(i => i.mz))) / 2 + 1
    this.maxY = Math.max.apply(null, quantMz.map(i => i.into))

    let ppm_cutoff = 10

    if (this.props.collisionType == "CID") {
      ppm_cutoff = 1000
    } else if (this.props.collisionType == "HCD") {
      ppm_cutoff = 10
    }

    this.props.spectrumData.forEach(peak => {
      let name = ''
      let style = ''
      let color = '#5CB85C'
      let visible = true
      let shape = 'circle'
      let size = 5

      if (peak.name != null) {
        name = peak.name

        if (peak.ppm < ppm_cutoff) {
        } else {
          shape = 'star'
          color = '#FF00FF'
        }
      } else {
        style = 'point {size: 5; fill-color: #5CB85C; visible: false}'
        visible = false
      }

      peak.size = size
      peak.color = color
      peak.visible = visible
      peak.shape = shape
      peak.peak_name = name
    })
  }

  render() {
    // this.drawChart()
    return (
      <div>
        <div
          id={this.chartId}
          className="quantChart"
        />
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

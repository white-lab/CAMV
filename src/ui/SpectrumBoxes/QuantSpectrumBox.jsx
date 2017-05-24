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
    options.xticks = 5
    return options
  }

  updatePeaks() {
    if (this.props.spectrumData.length <= 0) { return }

    let quantMz = this.props.spectrumData
    this.minMZ = Math.min.apply(null, quantMz.map(i => i.mz)) - 1
    this.maxMZ = Math.max.apply(null, quantMz.map(i => i.mz)) + 1
    this.maxY = Math.max.apply(null, quantMz.map(i => i.into))

    let ppm_cutoff = 10

    if (this.props.collisionType == "CID") {
      ppm_cutoff = 1000
    } else if (this.props.collisionType == "HCD") {
      ppm_cutoff = 10
    }

    this.props.spectrumData.forEach(peak => {
      let name = ''
      let color = '#5CB85C'
      let always_visible = true
      let shape = 'circle'
      let size = 5

      if (peak.name != null) {
        name = peak.name

        if (peak.ppm > ppm_cutoff) {
          shape = 'star'
          color = '#FF00FF'
        }
      } else {
        always_visible = false
      }

      peak.size = size
      peak.color = color
      peak.always_visible = always_visible
      peak.visible = false
      peak.shape = shape
      peak.peak_name = name
    })
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

import React from 'react'
import PropTypes from 'prop-types'

import BaseSpectrum from './BaseSpectrum'

import cmp from '../../utils/cmp'

class QuantSpectrumBox extends BaseSpectrum {
  getOptions() {
    return {
      title: 'Quantification',
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

    let quantMz = this.props.spectrumData
    this.minMZ = Math.round(2 * Math.min.apply(null, quantMz.map(i => i.mz))) / 2 - 1
    this.maxMZ = Math.round(2 * Math.max.apply(null, quantMz.map(i => i.mz))) / 2 + 1
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

  render() {
    return (
      <div>
        <div
          id={this.chartId}
          className="quantGoogleChart"
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

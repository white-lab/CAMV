import React from 'react'
import PropTypes from 'prop-types'

import BaseSpectrum from './BaseSpectrum'

import cmp from '../../utils/cmp'

class PrecursorSpectrumBox extends BaseSpectrum {
  getOptions() {
    let options = super.getOptions()

    if (this.props.isolationWindow != null) {
      options.isolationWindow = [
        this.props.precursorMz - this.props.isolationWindow[0],
        this.props.precursorMz + this.props.isolationWindow[1],
      ]
    }

    options.title = 'Precursor'
    options.hideLabels = true
    options.xlabel = ''
    options.ylabel = ''
    return options
  }

  updatePeaks() {
    if (this.props.spectrumData.length <= 0) { return }

    let precursorMz = this.props.precursorMz
    this.minMZ = (
      precursorMz -
      (this.props.isolationWindow != null ? this.props.isolationWindow[0] : 0)
      - 1
    )
    this.maxMZ = (
      precursorMz +
      (this.props.isolationWindow != null ? this.props.isolationWindow[1] : 0)
      + 1
    )

    this.maxY = Math.max.apply(
      null,
      this.props.spectrumData.filter(
        element => element.mz >= this.minMZ && element.mz <= this.maxMZ
      ).map(
        element => element.into
      ),
    )

    if (this.maxY < 0) {
      this.maxY = Math.max.apply(
        null,
        this.props.spectrumData.map(element => element.into)
      )
    }

    let ionSeries = []

    for (let i = -this.props.c13Num; i <= 5; i++) {
      ionSeries.push(i)
    }

    let indices = ionSeries.map(
      val => {
        let errs = this.props.spectrumData.map(
          peak => 1e6 * Math.abs(
            peak.mz - (precursorMz + 1.003355 * val / this.props.chargeState)
          ) / peak.mz
        )

        if (errs.every(val => val > this.props.ppm))
          return null

        return errs.indexOf(Math.min.apply(Math, errs))
      }
    )

    this.props.spectrumData.forEach((peak, index) => {
      let name = ''
      let ionIndex = indices.indexOf(index)
      let found = (ionIndex != -1)

      let contaminant = !found && this.props.isolationWindow != null && (
        peak.mz >= precursorMz - this.props.isolationWindow[0] &&
        peak.mz <= precursorMz + this.props.isolationWindow[1]
      )

      let size = 5
      let color = '#5CB85C'
      let shape = 'circle'
      let visible = true

      if (found) {
      } else if (contaminant) {
        size = 3
        color = 'red'
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

  render() {
    // this.drawChart()
    return (
      <div>
        <div
          id={this.chartId}
          className="precursorChart"
        />
      </div>
    )
  }
}

PrecursorSpectrumBox.propTypes = {
  chargeState: PropTypes.number,
  isolationWindow: PropTypes.array,
  c13Num: PropTypes.number,
  ppm: PropTypes.number,
  precursorMz: PropTypes.number,
  spectrumData: PropTypes.array,

  pointChosenCallback: PropTypes.func,
}

PrecursorSpectrumBox.defaultProps = {
  chargeState: 2,
  isolationWindow: null,
  c13Num: 0,
  ppm: 20,
  precursorMz: 0,
  spectrumData: [],

  pointChosenCallback: null,
}

module.exports = PrecursorSpectrumBox

import React from 'react'
import PropTypes from 'prop-types'

import BaseSpectrum from './BaseSpectrum'

import cmp from '../../utils/cmp'

class PrecursorSpectrumBox extends BaseSpectrum {
  getOptions() {
    return {
      title: 'Precursor',
      hAxis: {
        // title: 'mz',
        gridlines: { color: 'transparent' },
        minValue: this.minMZ,
        maxValue: this.maxMZ,
      },
      vAxis: {
        // title: 'Intensity',
        gridlines: { color: 'transparent' },
        format: 'scientific',
        minValue: 0,
        maxValue: this.maxY,
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

      let style = ''

      if (found) {
        style = 'point {size: 5; fill-color: #5CB85C; visible: true}'
      } else if (contaminant) {
        style = 'point {size: 3; fill-color: red; visible: true}'
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
        {label: "Isolation", type:'number'},
      ],
    ]

    if (this.props.spectrumData.length > 0) {
      if (this.props.isolationWindow != null) {
        let lower_window = this.props.precursorMz - this.props.isolationWindow[0]
        let upper_window = this.props.precursorMz + this.props.isolationWindow[1]

        arr.push([lower_window, 0, null, null, 0])
        arr.push([lower_window, 0, null, null, this.maxY * 1.1])
        arr.push([upper_window, 0, null, null, this.maxY * 1.1])
        arr.push([upper_window, 0, null, null, 0])
      }

      arr.push([this.minMZ, 0, null, null, null])

      this.props.spectrumData.forEach(peak => {
        arr.push([peak.mz, 0, null, null, null])
        arr.push([peak.mz, peak.into, peak.style, peak.peak_name, null])
        arr.push([peak.mz, 0, null, null, null])
      })
      arr.push([this.maxMZ, 0, null, null, null])
    }

    return arr
  }

  render() {
    return (
      <div>
        <div
          id={this.chartId}
          className="precursorGoogleChart"
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

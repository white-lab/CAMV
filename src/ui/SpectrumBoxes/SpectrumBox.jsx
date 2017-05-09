import React from 'react'
import PropTypes from 'prop-types'

import BaseSpectrum from './BaseSpectrum'

import cmp from '../../utils/cmp'

class SpectrumBox extends BaseSpectrum {
  getOptions() {
    let options = super.getOptions()
    options.xticks = 10
    return options
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      !cmp(prevProps.spectrumData, this.props.spectrumData) ||
      prevProps.ptmSet != this.props.ptmSet
    ) {
      this.updatePeaks()
      this.drawChart()
    }
  }

  updatePeaks() {
    this.resetMinMax()

    if (this.props.spectrumData.length > 0) {
      this.maxMZ = Math.ceil(
        this.props.spectrumData[this.props.spectrumData.length - 1].mz + 1
      )

      this.maxY = Math.max.apply(
        null,
        this.props.spectrumData.filter(
          element => (element.mz >= this.minMZ && element.mz <= this.maxMZ)
        ).map(
          element => element.into
        )
      )
    }

    let ppm_cutoff = 10

    if (this.props.collisionType == "CID") {
      ppm_cutoff = 1000
    } else if (this.props.collisionType == "HCD") {
      ppm_cutoff = 10
    }

    this.props.spectrumData.forEach(peak => {
      let mz = peak.mz
      let into = peak.into
      let name = ''
      let color = 'red'
      let size = 3
      let shape = 'circle'
      let visible = true

      if (mz > this.minMZ && mz < this.maxMZ) {
        if (!this.props.ptmSet) {
          visible = false
        }

        if (peak.name != null) {
          let isotope = (
            peak.name != null &&
            peak.name.includes("¹³C")
          )
          let by_ion = (
            peak.name != null &&
            peak.name.match(/^[abcxyz][^-]*$/) != null
          )

          name = (
            (
              !isotope && ((into >= this.maxY / 10) || by_ion)
            ) ? peak.name : null
          )

          if (peak.ppm != null && peak.ppm < ppm_cutoff) {
            if (isotope) {
              color = '#F0AD4E'
            } else {
              color = '#5CB85C'
            }
          } else {
            size = 5
            color = '#FF00FF'
            shape = 'star'
          }
        } else if (into < this.maxY / 10) {
          visible = false
        }

        peak.size = size
        peak.shape = shape
        peak.color = color
        peak.visible = visible
        peak.peak_name = name
      }
    })
  }
}

SpectrumBox.propTypes = {
  spectrumData: PropTypes.array,
  collisionType: PropTypes.string,

  ptmSet: PropTypes.bool,

  pointChosenCallback: PropTypes.func,
}

SpectrumBox.defaultProps = {
  spectrumData: [],
  collisionType: null,

  ptmSet: false,

  pointChosenCallback: null,
}

module.exports = SpectrumBox

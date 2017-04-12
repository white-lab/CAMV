import React from 'react'
import PropTypes from 'prop-types'

import AcceptButton from './Buttons/AcceptButton'
import MaybeButton from './Buttons/MaybeButton'
import RejectButton from './Buttons/RejectButton'

import BaseSpectrum from './BaseSpectrum'

import cmp from '../../utils/cmp'

class SpectrumBox extends BaseSpectrum {
  componentDidUpdate(prevProps, prevState) {
    if (this.state.chartLoaded) {
      if (
        !cmp(prevProps.spectrumData, this.props.spectrumData) ||
        prevProps.ptmSet != this.props.ptmSet ||
        prevState.chartLoaded != this.state.chartLoaded
      ) {
        this.updatePeaks()
        this.drawChart()
      }
    }
  }

  getOptions() {
    return {
      hAxis: {
        title: 'mz',
        gridlines: { color: 'transparent' },
        minValue: this.minMZ,
        maxValue: this.maxMZ,
      },
      vAxis: {
        title: 'Intensity',
        format: 'scientific',
        gridlines: { color: 'transparent' },
        minValue: 0,
        maxValue: this.maxY,
      },
      annotations: { style: 'line', stemColor: 'none', auraColor: 'none' },
      chartArea: { left: "12.5%", bottom: "10%", width: "90%", height: "85%" },
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
      let style = ''

      if (mz > this.minMZ && mz < this.maxMZ) {
        if (this.props.ptmSet) {
          style = 'point {size: 3; fill-color: red; visible: true}'
        } else {
          style = 'point {size: 3; fill-color: red; visible: false}'
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

          if (into == 0) {
            // Plot intermediate line-plot points along x-axis
            style = null
          } else if (peak.ppm != null && peak.ppm < ppm_cutoff) {
            if (isotope) {
              style = 'point {size: 3; fill-color: #F0AD4E; visible: true}'
            } else {
              style = 'point {size: 3; fill-color: #5CB85C; visible: true}'
            }
          } else {
            style = 'point {size: 5; shape-type: star; fill-color: #FF00FF; visible: true}'
          }
        } else if (into < this.maxY / 10) {
          style = null
        }

        peak.style = style
        peak.peak_name = name
      }
    })
  }

  render() {
    return (
      <div>
        <div
          id={this.chartId}
          className="fragmentGoogleChart"
          style={{
            height: this.state.exporting ? "100%" : "92.5%"
          }}
        />
        <div
          id="updateBox"
          style={{display: this.state.exporting ? 'none' : null}}
        >
          <div id="choiceBox">
            <AcceptButton
              callback={this.props.updateChoice}
              disabled={this.props.inputDisabled}
            />
            <MaybeButton
              callback={this.props.updateChoice}
              disabled={this.props.inputDisabled}
            />
            <RejectButton
              callback={this.props.updateChoice}
              disabled={this.props.inputDisabled}
            />
          </div>
        </div>
      </div>
    )
  }
}

SpectrumBox.propTypes = {
  spectrumData: PropTypes.array,
  inputDisabled: PropTypes.bool,
  collisionType: PropTypes.string,

  ptmSet: PropTypes.bool,

  updateChoice: PropTypes.func,
  pointChosenCallback: PropTypes.func,
}

SpectrumBox.defaultProps = {
  spectrumData: [],
  inputDisabled: true,
  collisionType: null,

  ptmSet: false,

  updateChoice: null,
  pointChosenCallback: null,
}

module.exports = SpectrumBox

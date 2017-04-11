import React from 'react'
import PropTypes from 'prop-types'

import AcceptButton from './Buttons/AcceptButton'
import MaybeButton from './Buttons/MaybeButton'
import RejectButton from './Buttons/RejectButton'

import { cmp } from '../../utils/utils'

class SpectrumBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      chartLoaded: false,
      exporting: false,
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
            component.setState({chartLoaded: true})
            component.drawChart()
          },
        })
      })
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.chartLoaded) {
      if (
        !cmp(prevProps.spectrumData, this.props.spectrumData) ||
        prevProps.selectedScan != this.props.selectedScan ||
        prevProps.selectedPTM != this.props.selectedPTM
      ) {
        this.drawChart()
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize.bind(this))
  }

  drawChart() {
    if (!this.state.chartLoaded) { return }

    let minMZ = 0
    let maxMZ = 1
    let max_y = 15

    if (this.props.spectrumData.length > 0) {
      maxMZ = Math.ceil(
        this.props.spectrumData[this.props.spectrumData.length - 1].mz + 1
      )

      max_y = Math.max.apply(
        null,
        this.props.spectrumData.filter(
          element => (element.mz >= minMZ && element.mz <= maxMZ)
        ).map(
          element => element.into
        )
      )
    }

    let data = new google.visualization.DataTable()

    data.addColumn('number', 'mz')
    data.addColumn('number', 'Intensity')
    data.addColumn({'type': 'string', 'role': 'style'})
    data.addColumn({'type': 'string', 'role': 'annotation'})

    let ppm_cutoff = 10

    if (this.props.collisionType == "CID") {
      ppm_cutoff = 1000
    } else if (this.props.collisionType == "HCD") {
      ppm_cutoff = 10
    }

    if (this.props.spectrumData.length > 0) {
      data.addRows([[minMZ, 0, null, null]])

      this.props.spectrumData.forEach(function (peak) {
        let mz = peak.mz
        let into = peak.into
        let name = ''
        let ppm = null
        let style = ''

        if (mz > minMZ && mz < maxMZ) {
          if (this.props.selectedPTM != null) {
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
                !isotope && ((into >= max_y / 10) || by_ion)
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
          } else if (into < max_y / 10) {
            style = null
          }

          data.addRows([
            [mz, 0, null, null],
            [mz, into, style, name],
            [mz, 0, null, null]
          ])
        }
      }.bind(this))

      data.addRows([[maxMZ, 0, null, null]])
    }

    let options = {
      // title: 'Age vs. Weight comparison',
      hAxis: {
        title: 'mz',
        gridlines: { color: 'transparent' },
        minValue: this.props.spectrumData.length > 0 ? minMZ : 0,
        maxValue: this.props.spectrumData.length > 0 ? maxMZ : 100,
      },
      vAxis: {
        title: 'Intensity',
        format: 'scientific',
        gridlines: { color: 'transparent' },
        minValue: 0,
        maxValue: this.props.spectrumData.length > 0 ? null : 100,
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

    let chart = new google.visualization.LineChart(
      document.getElementById('fragmentGoogleChart')
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

  handleResize(e) {
    this.drawChart()
  }

  render() {
    return (
      <div>
        <div
          id="fragmentGoogleChart"
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

  selectedScan: PropTypes.number,
  selectedPTM: PropTypes.number,

  updateChoice: PropTypes.func,
  pointChosenCallback: PropTypes.func,
}

SpectrumBox.defaultProps = {
  spectrumData: [],
  inputDisabled: true,
  collisionType: null,

  selectedScan: null,
  selectedPTM: null,

  updateChoice: null,
  pointChosenCallback: null,
}

module.exports = SpectrumBox

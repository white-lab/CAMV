import React from 'react'
import hotkey from 'react-hotkey'

import AcceptButton from './Buttons/AcceptButton'
import MaybeButton from './Buttons/MaybeButton'
import RejectButton from './Buttons/RejectButton'
import SetMaxMZ from './SetMaxMZ'
import SetMinMZ from './SetMinMZ'

hotkey.activate();

class SpectrumBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      chartLoaded: false,
      exporting: false,
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize.bind(this));
    hotkey.addHandler(this.handleHotkey.bind(this))

    var component = this;

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
            component.drawChart();
          },
        });
      });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.chartLoaded) {
      if (prevProps.spectrumData != this.props.spectrumData) {
        this.drawChart();
      } else if (prevProps.selectedPTMPlacement != this.props.selectedPTMPlacement) {
        this.drawChart();
      } else if (prevProps.minMZ != this.props.minMZ || prevProps.maxMZ != this.props.maxMZ) {
        this.drawChart();
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize.bind(this));
    hotkey.removeHandler(this.handleHotkey.bind(this))
  }

  drawChart() {
    if (!this.state.chartLoaded) { return; }

    var minMZ = Math.max(0, this.props.minMZ == null ? 0 : this.props.minMZ)
    var maxMZ = 1
    var max_y = 15

    if (this.props.spectrumData.length > 0) {
      var scanMax = Math.ceil(
        this.props.spectrumData[this.props.spectrumData.length - 1].mz + 1
      )
      maxMZ = this.props.maxMZ == null ? scanMax : Math.min(scanMax, this.props.maxMZ)

      max_y = Math.max.apply(
        null,
        this.props.spectrumData.filter(
          element => (element.mz >= minMZ && element.mz <= maxMZ)
        ).map(
          element => element.into
        )
      )
    }

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'mz');
    data.addColumn('number', 'Intensity');
    data.addColumn({'type': 'string', 'role': 'style'})
    data.addColumn({'type': 'string', 'role': 'annotation'})

    if (this.props.spectrumData.length > 0) {
      data.addRows([[minMZ, 0, null, null]])

      this.props.spectrumData.forEach(function(peak) {
        let mz = peak.mz
        let into = peak.into
        let name = ''
        let ppm = null
        let style = ''

        if (mz > minMZ && mz < maxMZ) {
          if (this.props.selectedPTMPlacement != null) {
            style = 'point {size: 3; fill-color: red; visible: true}'
          } else {
            style = 'point {size: 3; fill-color: red; visible: false}'
          }

          var matchInfo = peak.matchInfo[this.props.selectedPTMPlacement]

          if (matchInfo != null) {
            var matchId = matchInfo.matchId

            if (matchId != null) {
              let match = this.props.matchData[matchId]
              let isotope = (
                match.name != null &&
                match.name.includes("¹³C")
              )
              let by_ion = (
                match.name != null &&
                match.name.match(/^[abcxyz][^-]*$/) != null
              )
              ppm = 1e6 * Math.abs(match.mz - mz) / mz
              name = (
                (
                  !isotope && ((into >= max_y / 10) || by_ion)
                ) ? match.name : null
              )

              let ppm_cutoff = 10

              if (this.props.collisionType == "CID") {
                ppm_cutoff = 1000
              } else if (this.props.collisionType == "HCD") {
                ppm_cutoff = 10
              }

              if (into == 0) {
                // Plot intermediate line-plot points along x-axis
                style = null
              } else if (ppm < ppm_cutoff) {
                if (isotope) {
                  style = 'point {size: 3; fill-color: yellow; visible: true}'
                } else {
                  style = 'point {size: 3; fill-color: #5CB85C; visible: true}'
                }
              } else {
                style = 'star {size: 3; fill-color: magenta; visible: true}'
              }
            } else if (into < max_y / 10) {
              style = null
            }
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

    var options = {
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
    };

    var chart = new google.visualization.LineChart(document.getElementById('fragmentGoogleChart'));

    google.visualization.events.addListener(chart, 'select', selectHandler.bind(this));

    function selectHandler(e) {
      var selectedItem = chart.getSelection()[0];
      if (selectedItem) {
        var mz = data.getValue(selectedItem.row, 0)
        this.props.pointChosenCallback(mz)
      }
    }
    chart.draw(data, options);
  }

  handleHotkey(e) {
    if (!this.props.inputDisabled) {
      switch (e.key) {
        case 'a':
          this.props.updateChoice('accept');
          break;
        case 's':
          this.props.updateChoice('maybe');
          break;
        case 'd':
          this.props.updateChoice('reject');
          break;
      }
    }
  }

  handleResize(e) {
    this.drawChart();
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
          <div id="mzBox">
            <div className="setMinMZ">
              <SetMinMZ
                callback={this.props.updateMinMZ}
                disabled={this.props.inputDisabled}
                minMZ={this.props.minMZ}
              />
            </div>

            <div className="setMaxMZ">
              <SetMaxMZ
                callback={this.props.updateMaxMZ}
                disabled={this.props.inputDisabled}
                maxMZ={this.props.maxMZ}
                scanMaxMZ={
                  Math.ceil(
                    this.props.spectrumData.length == 0 ?
                    1 :
                    this.props.spectrumData[this.props.spectrumData.length - 1].mz + 1
                  )
                }
              />
            </div>
          </div>

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
    );
  }
}

SpectrumBox.propTypes = {
  minMZ: React.PropTypes.number,
  maxMZ: React.PropTypes.number,
  spectrumData: React.PropTypes.array,
  updateChoice: React.PropTypes.func.isRequired,
  updateMinMZ: React.PropTypes.func.isRequired,
  updateMaxMZ: React.PropTypes.func.isRequired,
  pointChosenCallback: React.PropTypes.func.isRequired,
  inputDisabled: React.PropTypes.bool,
  selectedPTMPlacement: React.PropTypes.number,
  matchData: React.PropTypes.array.isRequired,
  collisionType: React.PropTypes.string,
}

SpectrumBox.defaultProps = {
  minMZ: null,
  maxMZ: null,
  spectrumData: null,
  inputDisabled: true,
  selectedPTMPlacement: null,
  collisionType: null,
}

module.exports = SpectrumBox

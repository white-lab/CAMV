import React from 'react'
import hotkey from 'react-hotkey'

import AcceptButton from './AcceptButton'
import MaybeButton from './MaybeButton'
import RejectButton from './RejectButton'
import SetMaxMZ from './SetMaxMZ'
import SetMinMZ from './SetMinMZ'

hotkey.activate();

var SpectrumBox = React.createClass({
  getInitialState: function() {
    return {chartLoaded: false}
  },

  mixins: [hotkey.Mixin('handleHotkey')],

  handleHotkey: function(e) {
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
  },

  drawChart: function() {

    var minMZ = Math.max(0, this.props.minMZ == null ? 0 : this.props.minMZ)
    var maxMZ = 1
    var max_y = 15

    if (this.props.spectrumData.length > 0) {
      var scanMax = this.props.spectrumData[this.props.spectrumData.length - 1].mz + 1
      maxMZ = this.props.maxMZ == null ? scanMax : Math.min(scanMax, this.props.maxMZ)

      max_y = Math.max.apply(
        null,
        this.props.spectrumData.filter(
          (element) => { return element.mz >= minMZ && element.mz <= maxMZ }
        ).map(
          (element) => { return element.into }
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
              var match = this.props.matchData[matchId]
              ppm = Math.abs(match.mz - mz) / mz * 1000000
              name = match.name
              // TO DO: change these conditions to match color coding
              if (into == 0) {
                // Plot intermediate line-plot points along x-axis
                style = null
              } else if (ppm < 10) {
                style = 'point {size: 3; fill-color: green; visible: true}'
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
        minValue: minMZ,
        maxValue: maxMZ
      },
      vAxis: {
        title: 'Intensity',
        gridlines: { color: 'transparent' },
        minValue: 0,
        maxValue: max_y
      },
      annotations: { style: 'line', stemColor: 'none' },
      chartArea: { width: "80%", height: "80%" },
      legend: 'none',
      tooltip: {trigger: 'none'}
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
  },

  componentDidMount: function() {
    window.addEventListener('resize', this.handleResize);

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
  },

  componentWillUnmount: function() {
    window.removeEventListener('resize', this.handleResize);
  },

  handleResize: function(e) {
    if (this.state.chartLoaded) {
      this.drawChart();
    }
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (this.state.chartLoaded) {
      if (prevProps.spectrumData != this.props.spectrumData) {
        this.drawChart();
      } else if (prevProps.selectedPTMPlacement != this.props.selectedPTMPlacement) {
        this.drawChart();
      } else if (prevProps.minMZ != this.props.minMZ || prevProps.maxMZ != this.props.maxMZ) {
        this.drawChart();
      }
    }
  },

  render: function() {
    return (
      <div>
        <div id="fragmentGoogleChart"></div>
        <div id="updateBox">
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
              scanMaxMZ={this.props.spectrumData.length == 0 ? 1 : this.props.spectrumData[this.props.spectrumData.length - 1].mz + 1}
            />
          </div>

          <div className="rejectButton">
            <RejectButton
              callback={this.props.updateChoice}
              disabled={this.props.inputDisabled}
            />
          </div>

          <div className="maybeButton">
            <MaybeButton
              callback={this.props.updateChoice}
              disabled={this.props.inputDisabled}
            />
          </div>

          <div className="acceptButton">
            <AcceptButton
              callback={this.props.updateChoice}
              disabled={this.props.inputDisabled}
            />
          </div>
        </div>
      </div>
    );
  }
});

module.exports = SpectrumBox

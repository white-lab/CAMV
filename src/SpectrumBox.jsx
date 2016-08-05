var AcceptButton = React.createClass({
  onChange: function(){
    this.props.callback('accept')
  },
  render: function(){
    return (<input id="acceptButton"
                   className="choiceButton"
                   type="button"
                   value="Accept"
                   disabled={this.props.disabled}
                   onClick={this.onChange}/>)
  }
});

var MaybeButton = React.createClass({
  onChange: function(){
    this.props.callback('maybe')
  },
  render: function(){
    return (<input id="maybeButton"
                   className="choiceButton"
                   type="button"
                   value="Maybe"
                   disabled={this.props.disabled}
                   onClick={this.onChange}/>)
  }
});

var RejectButton = React.createClass({
  onChange: function(){
    this.props.callback('reject')
  },
  render: function(){
    return (<input id="rejectButton"
                   className="choiceButton"
                   type="button"
                   value="Reject"
                   disabled={this.props.disabled}
                   onClick={this.onChange}/>)
  }
});

var SetMinMZ = React.createClass({
  handleChange: function(event) {
    this.props.callback(event.target.value)
  },
  render: function(){
    return (<div id="setMinMZ">
              Min. m/z:
              <input className="numInput"
                     type="number"
                     value={this.props.minMZ}
                     disabled={this.props.disabled}
                     onChange={this.handleChange}/>
            </div>)
  }
});

var SetMaxMZ = React.createClass({
  handleChange: function(event) {
    this.props.callback(event.target.value)
  },
  render: function(){
    return (<div id="setMaxMZ">
              Max. m/z:
              <input className="numInput"
                     type="number"
                     value={this.props.maxMZ == null ? this.props.scanMaxMZ : this.props.maxMZ}
                     disabled={this.props.disabled}
                     onChange={this.handleChange}/>
            </div>)
  }
});

var SpectrumBox = React.createClass({
  getInitialState: function(){
    return {chartLoaded: false}
  },

  drawChart: function() {

    var minMZ = Math.max(0, this.props.minMZ == null ? 0 : this.props.minMZ)
    var maxMZ = 1
    var max_y = 15

    if (this.props.spectrumData.length > 0){
      var scanMax = this.props.spectrumData[this.props.spectrumData.length - 1].mz + 1
      maxMZ = this.props.maxMZ == null ? scanMax : Math.min(scanMax, this.props.maxMZ)

      max_y = Math.max.apply(
        null,
        this.props.spectrumData.filter(
          function(element) { return element.mz >= minMZ && element.mz <= maxMZ }
        ).map(
          function(element) { return element.into }
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

      this.props.spectrumData.forEach(function(peak){
        mz = peak.mz
        into = peak.into
        name = ''
        ppm = null

        if (mz > minMZ && mz < maxMZ){
          if (this.props.selectedPTMPlacement != null){
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
              } else if (ppm < 10){
                style = 'point {size: 3; fill-color: green; visible: true}'
              }
            } else if (into < max_y / 10) {
              style = null
            }
        }

          data.addRows([[mz, 0, null, null],
                        [mz, into, style, name],
                        [mz, 0, null, null]])
        }
      }.bind(this))

      data.addRows([[maxMZ, 0, null, null]])
    }

    var options = {
      // title: 'Age vs. Weight comparison',
      hAxis: {title: 'mz',
              minValue: minMZ,
              maxValue: maxMZ
             },
      vAxis: {title: 'Intensity',
              minValue: 0,
              maxValue: max_y},
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

  componentDidMount: function(){
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
      } else if (prevProps.selectedPTMPlacement != this.props.selectedPTMPlacement){
        this.drawChart();
      } else if (prevProps.minMZ != this.props.minMZ || prevProps.maxMZ != this.props.maxMZ) {
        this.drawChart();
      }
    }
  },

  render: function(){
    return (
      <div>
        <div id="fragmentGoogleChart"></div>
        <div id="updateBox">
          <div className="setMinMZ">
            <SetMinMZ minMZ={this.props.minMZ}
                      disabled={this.props.inputDisabled}
                      callback={this.props.updateMinMZ}/>
          </div>

          <div className="setMaxMZ">
            <SetMaxMZ maxMZ={this.props.maxMZ}
                      disabled={this.props.inputDisabled}
                      scanMaxMZ={this.props.spectrumData.length == 0 ? 1 : this.props.spectrumData[this.props.spectrumData.length - 1].mz + 1}
                      callback={this.props.updateMaxMZ}/>
          </div>

          <div className="rejectButton">
            <RejectButton disabled={this.props.inputDisabled}
                          callback={this.props.updateChoice}/>
          </div>

          <div className="maybeButton">
            <MaybeButton disabled={this.props.inputDisabled}
                         callback={this.props.updateChoice}/>
          </div>

          <div className="acceptButton">
            <AcceptButton disabled={this.props.inputDisabled}
                          callback={this.props.updateChoice}/>
          </div>
        </div>
      </div>
    );
  }
});

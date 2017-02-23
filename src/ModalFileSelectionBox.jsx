var {dialog} = require('electron').remote;

// var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var ReactCSSTransitionGroup = require('react-addons-css-transition-group');

var ModalFileSelectionBox = React.createClass({
  getInitialState: function() {
    return {
      fileChosen: false,
      data: [],
      peptideData: [],
      fileName: ''
    }
  },

  setStateFromText: function(data) {
    inputData = JSON.parse(data);
    this.setState({
      data: inputData.scanData,
      peptideData: inputData.peptideData
    });
  },

  update: function() {
    var component = this;

    dialog.showOpenDialog(
      {
        filters: [{
          name: 'text',
          extensions: ['camv', 'camv.gz']
        }]
      },
      function (fileNames) {
        if (fileNames === undefined) return;
        var fileName = fileNames[0];
        var compressed = fileName.endsWith(".gz");

        fs.readFile(
          fileName,
          (compressed ? null : 'utf-8'),
          (err, data) => {
            if (err) { console.log(err); }

            if (compressed) {
              zlib.gunzip(data, (err, out) => {
                if (err) { console.log(err); }
                component.setStateFromText(out);
              })
            } else {
              component.setStateFromText(data);
            }
          }
        );

        component.setState({
          fileChosen: true,
          fileName: fileName
        })
      }.bind(this)
    )
  },

  submit: function() {
    this.props.setData(this.state.data)
    this.props.setPeptideData(this.state.peptideData)
    this.props.setSubmitted(true, this.state.fileName)
  },

  render: function() {
    return (
      <ReactBootstrap.Modal show={this.props.showModal} onHide={this.submit}>
        <ReactBootstrap.Modal.Header>
          <ReactBootstrap.Modal.Title>
            <div></div>
          </ReactBootstrap.Modal.Title>
        </ReactBootstrap.Modal.Header>
        <ReactBootstrap.Modal.Body>
          <button
            id="fileSelect"
            onClick={this.update}
            >
            Choose File
          </button>
          {this.state.fileName}
        </ReactBootstrap.Modal.Body>
        <ReactBootstrap.Modal.Footer>
          <ReactBootstrap.Button
            onClick={this.submit}
            disabled={!this.state.fileChosen}
            >
            Done
          </ReactBootstrap.Button>
        </ReactBootstrap.Modal.Footer>
      </ReactBootstrap.Modal>
    )
  }
});

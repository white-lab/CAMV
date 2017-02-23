var {dialog} = require('electron').remote;

var ReactCSSTransitionGroup = require('react-addons-css-transition-group');

var ModalExportBox = React.createClass({
  getInitialState: function() {
    return {
      exportDirectory: null,
      dirChosen: false,
      exportAcceptSpectra: true,
      exportMaybeSpectra: false,
      exportRejectSpectra: false,
      exportTables: true
    }
  },

  updateDir: function() {
    var component = this;

    dialog.showOpenDialog(
      {
        title: "Export Spectra",
        properties: ["createDirectory", "openDirectory"]
      },
      function(dirName) {
        if (dirName === undefined || dirName.length != 1)
          return;

        component.setState({
          dirChosen: true,
          exportDirectory: dirName
        })
      }
    )
  },

  close: function() {
    this.props.closeCallback();
  },

  export: function() {
    this.props.exportCallback(
      this.state.exportDirectory[0],
      [
        this.state.exportAcceptSpectra,
        this.state.exportMaybeSpectra,
        this.state.exportRejectSpectra
      ],
      this.state.exportTables
    );
    this.close();
  },

  render: function() {
    return (
      <ReactBootstrap.Modal show={this.props.showModal} onHide={this.close}>
        <ReactBootstrap.Modal.Header>
          <ReactBootstrap.Modal.Title>
            <div>Export Spectra / Validation Tables</div>
          </ReactBootstrap.Modal.Title>
        </ReactBootstrap.Modal.Header>
        <ReactBootstrap.Modal.Body>
          <div>
            <button
              id="exportDir"
              onClick={this.updateDir}
              >
              Choose Directory
            </button>
            {this.state.exportDirectory}
            <ReactBootstrap.Checkbox
              checked={this.state.exportAcceptSpectra}
              onChange={
                () => {
                  this.setState({
                    exportAcceptSpectra: !this.state.exportAcceptSpectra
                  })
                }}
              >
              Export Accepted Spectra
            </ReactBootstrap.Checkbox>
            <ReactBootstrap.Checkbox
              checked={this.state.exportMaybeSpectra}
              onChange={
                () => {
                  this.setState({
                    exportMaybeSpectra: !this.state.exportMaybeSpectra
                  })
                }}
              >
              Export Maybed Spectra
            </ReactBootstrap.Checkbox>
            <ReactBootstrap.Checkbox
              checked={this.state.exportRejectSpectra}
              onChange={
                () => {
                  this.setState({
                    exportRejectSpectra: !this.state.exportRejectSpectra
                  })
                }}
              >
              Export Rejected Spectra
            </ReactBootstrap.Checkbox>
            <ReactBootstrap.Checkbox
              checked={this.state.exportTables}
              onChange={
                () => {
                  this.setState({
                    exportTables: !this.state.exportTables
                  })
                }}
              >
              Export Excel Table
            </ReactBootstrap.Checkbox>
          </div>
        </ReactBootstrap.Modal.Body>
        <ReactBootstrap.Modal.Footer>
          <ReactBootstrap.Button
            onClick={this.export}
            disabled={!this.state.dirChosen}
            >
            Export
          </ReactBootstrap.Button>
          <ReactBootstrap.Button
            onClick={this.close}
            >
            Cancel
          </ReactBootstrap.Button>
        </ReactBootstrap.Modal.Footer>
      </ReactBootstrap.Modal>
    )
  }
});

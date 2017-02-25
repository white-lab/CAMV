import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import { Modal, Checkbox, Button } from 'react-bootstrap';

var {dialog} = require('electron').remote;

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
          exportDirectory: dirName[0]
        })
      }
    )
  },

  close: function() {
    this.props.closeCallback();
  },

  export: function() {
    this.props.exportCallback(
      this.state.exportDirectory,
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
      <Modal show={this.props.showModal} onHide={this.close}>
        <Modal.Header>
          <Modal.Title>
            <div>Export Spectra / Validation Tables</div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <button
              id="exportDir"
              value={this.state.exportDirectory}
              onClick={this.updateDir}
              >
              Choose Directory
            </button>
            {this.state.exportDirectory}
            <Checkbox
              checked={this.state.exportAcceptSpectra}
              onChange={
                () => {
                  this.setState({
                    exportAcceptSpectra: !this.state.exportAcceptSpectra
                  })
                }}
              >
              Export Accepted Spectra
            </Checkbox>
            <Checkbox
              checked={this.state.exportMaybeSpectra}
              onChange={
                () => {
                  this.setState({
                    exportMaybeSpectra: !this.state.exportMaybeSpectra
                  })
                }}
              >
              Export Maybed Spectra
            </Checkbox>
            <Checkbox
              checked={this.state.exportRejectSpectra}
              onChange={
                () => {
                  this.setState({
                    exportRejectSpectra: !this.state.exportRejectSpectra
                  })
                }}
              >
              Export Rejected Spectra
            </Checkbox>
            <Checkbox
              checked={this.state.exportTables}
              onChange={
                () => {
                  this.setState({
                    exportTables: !this.state.exportTables
                  })
                }}
              >
              Export Excel Table
            </Checkbox>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={this.export}
            disabled={!this.state.dirChosen}
            >
            Export
          </Button>
          <Button
            onClick={this.close}
            >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
});

module.exports = ModalExportBox

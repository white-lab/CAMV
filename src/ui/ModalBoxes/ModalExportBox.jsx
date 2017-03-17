import React from 'react'
import { Modal, Checkbox, Button } from 'react-bootstrap'

const { dialog } = require('electron').remote

class ModalExportBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      exportDirectory: null,
      dirChosen: false,
      exportAcceptSpectra: true,
      exportMaybeSpectra: false,
      exportRejectSpectra: false,
      exportTables: true,
    }
  }

  updateDir() {
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
  }

  close() {
    this.props.closeCallback();
  }

  export() {
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
  }

  render() {
    return (
      <Modal
        onHide={this.close.bind(this)}
        show={this.props.showModal}
      >
        <Modal.Header>
          <Modal.Title>
            <div>
              Export Spectra / Validation Tables
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <button
              id="exportDir"
              onClick={this.updateDir.bind(this)}
              value={this.state.exportDirectory}
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
              Export CSV Table
            </Checkbox>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={!this.state.dirChosen}
            onClick={this.export.bind(this)}
          >
            Export
          </Button>
          <Button
            onClick={this.close.bind(this)}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

ModalExportBox.propTypes = {
  exportCallback: React.PropTypes.func.isRequired,
  closeCallback: React.PropTypes.func.isRequired,
  showModal: React.PropTypes.bool.isRequired,
}

module.exports = ModalExportBox

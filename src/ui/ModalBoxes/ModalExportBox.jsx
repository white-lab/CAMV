import fs from 'fs'
import path from 'path'

import React from 'react'
import PropTypes from 'prop-types'
import { Modal, Form, Button } from 'react-bootstrap'

import { remote } from 'electron'

import { exportCSV } from '../../io/csv.jsx'

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

      processing: false,
    }
  }

  updateDir() {
    var component = this;

    remote.dialog.showOpenDialog(
      {
        title: "Export Spectra",
        properties: ["createDirectory", "openDirectory"]
      },
      (dirName) => {
        if (dirName === undefined || dirName.length != 1)
          return;

        component.setState({
          dirChosen: true,
          exportDirectory: dirName[0],
        })
      }
    )
  }

  close() {
    this.props.closeCallback();
  }

  export() {
    this.setState(
      {
        processing: true,
      },
      () => {
        fs.mkdir(
          this.state.exportDirectory,
          async function() {
            if (this.state.exportTables) {
              await exportCSV(
                this.props.viewbox,
                path.join(
                  this.state.exportDirectory,
                  this.props.viewbox.state.basename + ".csv",
                )
              )
            }

            this.setState(
              {
                processing: false,
              },
              () => {
                this.props.exportCallback(
                  this.state.exportDirectory,
                  [
                    this.state.exportAcceptSpectra,
                    this.state.exportMaybeSpectra,
                    this.state.exportRejectSpectra
                  ],
                  this.state.exportTables,
                );

                this.close();
              }
            )
          }.bind(this)
        )
      }
    )
  }

  render() {
    return (
      <Modal
        onHide={this.close.bind(this)}
        show={this.props.showModal}
        centered={true}
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
            <Form.Check
              type="checkbox"
              label="Export Accepted Spectra"
              checked={this.state.exportAcceptSpectra}
              onChange={
                () => {
                  this.setState({
                    exportAcceptSpectra: !this.state.exportAcceptSpectra
                  })
                }}
            />
            <Form.Check
              type="checkbox"
              label="Export Maybed Spectra"
              checked={this.state.exportMaybeSpectra}
              onChange={
                () => {
                  this.setState({
                    exportMaybeSpectra: !this.state.exportMaybeSpectra
                  })
                }}
            />
            <Form.Check
              type="checkbox"
              label="Export Rejected Spectra"
              checked={this.state.exportRejectSpectra}
              onChange={
                () => {
                  this.setState({
                    exportRejectSpectra: !this.state.exportRejectSpectra
                  })
                }}
            />
            <Form.Check
              type="checkbox"
              checked={this.state.exportTables}
              onChange={
                () => {
                  this.setState({
                    exportTables: !this.state.exportTables
                  })
                }}
              label="Export CSV Table"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={!this.state.dirChosen || this.state.processing}
            onClick={this.export.bind(this)}
          >
            Export
          </Button>
          <Button
            onClick={this.close.bind(this)}
            disabled={this.state.processing}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

ModalExportBox.propTypes = {
  exportCallback: PropTypes.func.isRequired,
  closeCallback: PropTypes.func.isRequired,
  showModal: PropTypes.bool.isRequired,
  viewbox: PropTypes.object.isRequired,
}

module.exports = ModalExportBox

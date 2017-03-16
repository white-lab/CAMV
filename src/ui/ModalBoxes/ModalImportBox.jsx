import React from 'react'
import { Modal, Button } from 'react-bootstrap'

import JSONStream from 'JSONStream'

import fs from 'fs'
import zlib from 'zlib'

const { dialog } = require('electron').remote

import { loadCAMV } from '../../io/camv'

class ModalImportBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ready: false,
      imported: false,
      importing: false,
      camvFileName: null,
    }
  }

  updateCAMVFile() {
    dialog.showOpenDialog(
      {
        filters: [{
          name: 'JSON',
          extensions: ['camv', 'camv.gz']
        }]
      },
      function (fileNames) {
        if (fileNames === undefined) return;

        this.setState({
          ready: true,
          camvFileName: fileNames[0],
        })
      }.bind(this)
    )
  }

  closeCallback() {
    if (!this.state.importing && this.props.closeCallback != null) {
      this.props.closeCallback()
    }
  }

  runImport() {
    this.setState({
      importing: true,
    })

    loadCAMV(
      this.state.camvFileName,
      function(data) {
        this.props.setPycamverterVersion(data.pycamverterVersion)
        this.props.setScanData(data.scanData)
        this.props.setPeptideData(data.peptideData)
        this.props.importCallback(this.state.camvFileName)

        this.setState({
          imported: true,
          importing: false,
        })
      }.bind(this)
    )
  }

  render() {
    return (
      <Modal
        onHide={this.closeCallback.bind(this)}
        show={this.props.showModal}
      >
        <Modal.Header>
          <Modal.Title>
            <div>
              Load CAMV Data Set
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Button
            id="fileSelect"
            onClick={this.updateCAMVFile.bind(this)}
            disabled={this.state.importing}
          >
            Choose File
          </Button>
          {this.state.camvFileName}
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={!this.state.ready || this.state.importing}
            onClick={this.runImport.bind(this)}
          >
            {
              this.state.importing ?
              ("importing...") :
              ("Open")
            }
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

ModalImportBox.propTypes = {
  setScanData: React.PropTypes.func.isRequired,
  setPeptideData: React.PropTypes.func.isRequired,
  importCallback: React.PropTypes.func.isRequired,
  closeCallback: React.PropTypes.func,
  showModal: React.PropTypes.bool.isRequired,
}

ModalImportBox.defaultProps = {
  closeCallback: null,
}

module.exports = ModalImportBox

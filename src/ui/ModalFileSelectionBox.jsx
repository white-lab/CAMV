import React from 'react'
import { Modal, Button } from 'react-bootstrap'

import fs from 'fs'
import zlib from 'zlib'

const { dialog } = require('electron').remote

class ModalFileSelectionBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      fileChosen: false,
      data: [],
      peptideData: [],
      fileName: '',
    }
  }

  setStateFromText(data) {
    let inputData = JSON.parse(data);
    this.setState({
      data: inputData.scanData,
      peptideData: inputData.peptideData
    });
  }

  update() {
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
          function (err, data) {
            if (err) { console.log(err); }

            if (compressed) {
              zlib.gunzip(data, (err, out) => {
                if (err) { console.log(err); }
                this.setStateFromText(out);
              })
            } else {
              this.setStateFromText(data);
            }
          }.bind(this)
        );

        this.setState({
          fileChosen: true,
          fileName: fileName,
        })
      }.bind(this)
    )
  }

  submit() {
    this.props.setData(this.state.data)
    this.props.setPeptideData(this.state.peptideData)
    this.props.setSubmitted(true, this.state.fileName)
  }

  render() {
    return (
      <Modal
        onHide={this.submit.bind(this)}
        show={this.props.showModal}
      >
        <Modal.Header>
          <Modal.Title>
            <div>Load CAMV Data Set</div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <button
            id="fileSelect"
            onClick={this.update.bind(this)}
          >
            Choose File
          </button>
          {this.state.fileName}
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={!this.state.fileChosen}
            onClick={this.submit.bind(this)}
          >
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

ModalFileSelectionBox.propTypes = {
  setData: React.PropTypes.func.isRequired,
  setPeptideData: React.PropTypes.func.isRequired,
  setSubmitted: React.PropTypes.func.isRequired,
  showModal: React.PropTypes.bool.isRequired,
}

module.exports = ModalFileSelectionBox

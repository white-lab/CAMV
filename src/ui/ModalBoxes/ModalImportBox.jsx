import React from 'react'
import { Modal, Button } from 'react-bootstrap'

const { dialog } = require('electron').remote

import { loadSQL } from '../../io/sql'

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
          name: 'CAMV SQLite',
          extensions: ['db']
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

    loadSQL(
      this.state.camvFileName,
      function(data) {
        this.props.importCallback(data, this.state.camvFileName)

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
  importCallback: React.PropTypes.func,
  closeCallback: React.PropTypes.func,
  showModal: React.PropTypes.bool.isRequired,
}

ModalImportBox.defaultProps = {
  importCallback: null,
  closeCallback: null,
}

module.exports = ModalImportBox

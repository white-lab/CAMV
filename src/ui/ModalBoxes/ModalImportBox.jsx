import React from 'react'
import PropTypes from 'prop-types'
import { Modal, Button, FormGroup, FormControl, Radio, ControlLabel } from 'react-bootstrap'
import { execFile } from 'child_process'
import path from 'path'

const { dialog } = require('electron').remote

import { loadSQL } from '../../io/sql'

class ModalImportBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      processing: false,
      camvFileName: null,
      pycamverterPath: path.resolve(
        __filename.replace(/[\/\\][^\/\\]+$/, ""),
        "..\\..\\..\\PyCamverter.exe"
      ),
      raw_paths: [],
      mat_paths: [],
      search_path: null,
      radioChoice: 'open',
    }
  }

  radioChange(e) {
    this.setState({
      radioChoice: e.target.value,
    })
  }

  changeCAMVPath() {
    dialog.showOpenDialog(
      {
        filters: [{
          name: 'CAMV SQLite',
          extensions: ['db']
        }]
      },
      (fileNames) => {
        if (fileNames === undefined) return;

        this.setState({
          camvFileName: fileNames[0],
        })
      }
    )
  }

  changePycamverterPath() {
    dialog.showOpenDialog(
      {
        filters: [{
          name: 'PyCamverter Path',
          extensions: ['exe'],
        }]
      },
      (fileNames) => {
        if (fileNames === undefined) return;

        this.setState({
          pycamverterPath: fileNames[0],
        })
      }
    )
  }

  changeSearchPath() {
    dialog.showOpenDialog(
      {
        filters: [{
          name: 'Search Path',
          extensions: ['msf', 'xml'],
        }]
      },
      (fileNames) => {
        if (fileNames === undefined) return;

        this.setState({
          search_path: fileNames[0],
        })
      }
    )
  }

  changeRawPaths() {
    dialog.showOpenDialog(
      {
        properties: [
          'multiSelections',
        ],
        filters: [{
          name: 'Raw Data',
          extensions: ['raw', 'd', 'wiff', 'mgf'],
        }],
      },
      (fileNames) => {
        if (fileNames === undefined) return;

        this.setState({
          raw_paths: fileNames,
        })
      }
    )
  }

  changeMatPaths() {
    dialog.showOpenDialog(
      {
        properties: [
          'multiSelections',
        ],
        filters: [{
          name: 'CAMV-Matlab Data',
          extensions: ['mat'],
        }],
      },
      (fileNames) => {
        if (fileNames === undefined) return;

        this.setState({
          mat_paths: fileNames,
        })
      }
    )
  }

  closeCallback() {
    if (
      !this.state.processing &&
      this.props.closeCallback != null
    ) {
      this.props.closeCallback()
    }
  }

  runProcess() {
    this.setState({
      processing: true,
    })

    if (this.props.database != null) {
      this.props.database.close()
    }

    let args = [
      "--search-path", this.state.search_path,
    ]

    if (this.state.raw_paths.length > 0) {
      args = args.concat(["--raw-paths"]).concat(this.state.raw_paths)
    }

    if (this.state.mat_paths.length > 0) {
      args = args.concat(["--mat-sessions"]).concat(this.state.mat_paths)
    }

    let out_path = this.state.search_path.replace(/\.[^/.]+$/, ".camv.db")

    console.log(
      this.state.pycamverterPath, args,
    )

    execFile(
      this.state.pycamverterPath,
      args,
      (error, stdout, stderr) => {
        if (error) {
          console.error(error)
        }

        console.log(stdout)
        console.log(stderr)

        this.setState({
          processing: false,
          camvFileName: out_path,
        }, this.runImport.bind(this))
      }
    )
  }

  runImport() {
    this.setState({
      processing: true,
    })

    loadSQL(
      this.state.camvFileName,
      (data) => {
        this.props.importCallback(data, this.state.camvFileName)

        this.setState({
          processing: false,
        })
      }
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
          <FormGroup
            controlId="radioChoice"
          >
            <Radio
              value="open"
              checked={this.state.radioChoice == "open"}
              onChange={this.radioChange.bind(this)}
            >
              <FormGroup
                controlId="formControlsFile"
              >
                <Button
                  id="fileSelect"
                  onClick={this.changeCAMVPath.bind(this)}
                  disabled={this.state.radioChoice != "open" || this.state.processing}
                >
                  CAMV Database
                </Button>
                <div>
                  {
                    this.state.camvFileName != null ?
                    this.state.camvFileName :
                    ("No file selected.")
                  }
                </div>
              </FormGroup>
            </Radio>
            <Radio
              value="process"
              checked={this.state.radioChoice == "process"}
              onChange={this.radioChange.bind(this)}
            >
              <FormGroup
                controlId="formControlsFile"
              >
                <Button
                  id="fileSelect"
                  onClick={this.changePycamverterPath.bind(this)}
                  disabled={this.state.radioChoice != "process" || this.state.processing}
                >
                  PyCamverter Path
                </Button>
                <div>
                  {
                    this.state.pycamverterPath != null ?
                    this.state.pycamverterPath :
                    ("No file selected.")
                  }
                </div>
              </FormGroup>
              <FormGroup
                controlId="formControlsFile"
              >
                <Button
                  id="fileSelect"
                  onClick={this.changeSearchPath.bind(this)}
                  disabled={this.state.radioChoice != "process" || this.state.processing}
                >
                  Search Path
                </Button>
                <div>
                  {
                    this.state.search_path != null ?
                    this.state.search_path :
                    ("No file selected.")
                  }
                </div>
              </FormGroup>
              <FormGroup
                controlId="formControlsFile"
              >
                <Button
                  id="fileSelect"
                  onClick={this.changeRawPaths.bind(this)}
                  disabled={this.state.radioChoice != "process" || this.state.processing}
                >
                  Raw Paths
                </Button>
                <div>
                  {
                    this.state.raw_paths.length > 0 ?
                    this.state.raw_paths.join(', ') :
                    ("No file selected.")
                  }
                </div>
              </FormGroup>
              <FormGroup
                controlId="formControlsFile"
              >
                <Button
                  id="fileSelect"
                  onClick={this.changeMatPaths.bind(this)}
                  disabled={this.state.radioChoice != "process" || this.state.processing}
                >
                  CAMV-Matlab Sessions
                </Button>
                <div>
                  {
                    this.state.mat_paths.length > 0 ?
                    this.state.mat_paths.join(', ') :
                    ("No files selected.")
                  }
                </div>
              </FormGroup>
            </Radio>
          </FormGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={
              (
                this.state.radioChoice == "open" &&
                this.state.camvFileName == null
              ) || (
                this.state.radioChoice == "process" &&
                (
                  this.state.pycamverterPath == null ||
                  this.state.search_path == null
                )
              ) ||
              this.state.processing
            }
            onClick={
              this.state.radioChoice == "open" ?
              this.runImport.bind(this) :
              this.runProcess.bind(this)
            }
          >
            {
              this.state.processing ?
              (this.state.radioChoice == "open" ? ("importing...") : ("processing...")) :
              (this.state.radioChoice == "open" ? ("Open") : ("Process"))
            }
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

ModalImportBox.propTypes = {
  importCallback: PropTypes.func,
  closeCallback: PropTypes.func,
  showModal: PropTypes.bool.isRequired,
  database: PropTypes.object,
}

ModalImportBox.defaultProps = {
  importCallback: null,
  closeCallback: null,
  database: null,
}

module.exports = ModalImportBox

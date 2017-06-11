import React from 'react'
import PropTypes from 'prop-types'
import { Modal, Button, FormGroup, FormControl, Radio, ControlLabel } from 'react-bootstrap'
import { spawn } from 'child_process'
import path from 'path'
import os from 'os'
import terminate from 'terminate'

import { remote } from 'electron'
const { dialog } = remote

import { loadSQL } from '../../io/sql'

class ModalImportBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      child: null,
      camvFileName: null,
      pycamverterPath: path.resolve(
        __filename.replace(/[\/\\][^\/\\]+$/, ""),
        "..\\..\\..\\PyCamverter.exe"
      ),
      raw_paths: [],
      scan_lists: [],
      mat_paths: [],
      search_path: null,
      radioChoice: 'open',
      cpus: os.cpus().length,
      stdout: [],
      stderr: [],
      opening: false,
      running: false,
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

  changeScanLists() {
    dialog.showOpenDialog(
      {
        properties: [
          'multiSelections',
        ],
        filters: [{
          name: 'Scan Lists',
          extensions: ['csv', 'xlsx'],
        }],
      },
      (fileNames) => {
        if (fileNames === undefined) return;

        this.setState({
          scan_lists: fileNames,
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

  changeCPUCount(e) {
    this.setState({cpus: e.target.value})
  }

  closeCallback() {
    if (
      !this.state.running &&
      this.props.closeCallback != null
    ) {
      this.props.closeCallback()
    }
  }

  runProcess() {
    if (this.props.database != null) {
      this.props.database.close()
    }

    let args = [
      "-vv",
      "--search-path", this.state.search_path,
    ]

    if (this.state.raw_paths.length > 0) {
      args = args.concat(["--raw-paths"]).concat(this.state.raw_paths)
    }

    if (this.state.scan_lists.length > 0) {
      args = args.concat(["--scans-path"]).concat(this.state.scan_lists)
    }

    if (this.state.mat_paths.length > 0) {
      args = args.concat(["--mat-sessions"]).concat(this.state.mat_paths)
    }

    if (this.state.cpus != null) {
      args = args.concat(["--cpus", this.state.cpus])
    }

    let out_path = this.state.search_path.replace(/\.[^/.]+$/, ".camv.db")

    this.setState({
      stdout: [`${this.state.pycamverterPath} ${args.join(' ')}`],
      stderr: [],
    })

    let win = remote.getCurrentWindow()
    win.setProgressBar(-1)

    const child = spawn(
      this.state.pycamverterPath,
      args,
    )

    child.on(
      'error',
      (err) => {
        win.setProgressBar(-1)
        console.error(err)
        this.setState({
          child: null,
        })
      },
    )

    child.on(
      'close',
      (code) => {
        win.setProgressBar(-1)

        if (code != 0) {
          console.error(`child exited with code: ${code}`)

          this.setState({
            child: null,
          })
          return
        }

        this.setState({
          child: null,
          camvFileName: out_path,
          running: false,
        }, this.runImport.bind(this))
      }
    )

    child.stdout.on(
      'data',
      (data) => {
        data = data.toString()

        let progress = data.match(/\((\d+)\s*\/\s*(\d+)\)/)

        if (progress != null) {
          win.setProgressBar((progress[1] - 1) / progress[2])
        }

        if (data.match('DEBUG')) {
          return
        }

        this.setState((prevState) => ({
          stdout: prevState.stdout.concat(data.split("\n")),
        }))
      },
    )

    child.stderr.on(
      'data',
      (data) => {
        data = data.toString()

        this.setState((prevState) => ({
          stderr: prevState.stderr.concat(data.split("\n")),
        }))
      },
    )

    this.setState({
      child: child,
      running: true,
    })
  }

  cancelProcess() {
    if (this.state.child == null) {
      this.setState({
        running: false,
      })
      return
    }

    terminate(this.state.child.pid, (err) => {
      if (err) { console.error(err) }

      remote.getCurrentWindow().setProgressBar(-1)

      this.setState({
        child: null,
        running: false,
      })
    })
  }

  runImport() {
    this.setState({
      opening: true,
    })

    loadSQL(
      this.state.camvFileName,
      (data) => {
        this.props.importCallback(data, this.state.camvFileName)

        this.setState({
          opening: false,
        })
      }
    )
  }

  render() {
    return (
      <Modal
        onHide={this.closeCallback.bind(this)}
        show={this.props.showModal}
        dialogClassName="importModal"
      >
        <Modal.Header>
          <Modal.Title>
            <div>
              Load CAMV Data Set
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {
            !this.state.running &&
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
                    disabled={
                      this.state.radioChoice != "open" ||
                      this.state.opening
                    }
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
                {
                  process.env.NODE_ENV === 'development' &&
                  <FormGroup
                    controlId="formControlsFile"
                  >
                    <Button
                      id="fileSelect"
                      onClick={this.changePycamverterPath.bind(this)}
                      disabled={
                        this.state.radioChoice != "process" ||
                        this.state.opening
                      }
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
                }
                <FormGroup
                  controlId="formControlsFile"
                >
                  <Button
                    id="fileSelect"
                    onClick={this.changeSearchPath.bind(this)}
                    disabled={
                      this.state.radioChoice != "process" ||
                      this.state.opening
                    }
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
                    disabled={
                      this.state.radioChoice != "process" ||
                      this.state.opening
                    }
                  >
                    Raw Path(s)
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
                    onClick={this.changeScanLists.bind(this)}
                    disabled={
                      this.state.radioChoice != "process" ||
                      this.state.opening
                    }
                  >
                    Scan List(s)
                  </Button>
                  <div>
                    {
                      this.state.scan_lists.length > 0 ?
                      this.state.scan_lists.join(', ') :
                      ("No files selected.")
                    }
                  </div>
                </FormGroup>
                <FormGroup
                  controlId="formControlsFile"
                >
                  <Button
                    id="fileSelect"
                    onClick={this.changeMatPaths.bind(this)}
                    disabled={
                      this.state.radioChoice != "process" ||
                      this.state.opening
                    }
                  >
                    CAMV-Matlab Session(s)
                  </Button>
                  <div>
                    {
                      this.state.mat_paths.length > 0 ?
                      this.state.mat_paths.join(', ') :
                      ("No files selected.")
                    }
                  </div>
                </FormGroup>
                <FormGroup
                  controlId="formControlsSelect"
                >
                  <ControlLabel>
                    # of CPUs
                  </ControlLabel>
                  <FormControl
                    componentClass="select"
                    value={this.state.cpus}
                    onChange={this.changeCPUCount.bind(this)}
                    disabled={
                      this.state.radioChoice != "process" ||
                      this.state.opening
                    }
                  >
                    {
                      os.cpus().map(
                        (cpu, i) =>
                        <option value={i + 1} key={i + 1}>{i + 1}</option>
                      )
                    }
                  </FormControl>
                </FormGroup>

              </Radio>
            </FormGroup>
          }
          {
            this.state.running &&
            <div className="console">
              {
                this.state.stdout.map(
                  (line, index) => (
                    <p className="stdout" key={index}>
                      {line}
                    </p>
                  )
                )
              }
              {
                this.state.stderr.map(
                  (line, index) => (
                    <p className="stderr" key={index}>
                      {line}
                    </p>
                  )
                )
              }
            </div>
          }
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
              this.state.opening
            }
            onClick={
              this.state.radioChoice == "open" ?
              this.runImport.bind(this) :
              (
                this.state.running ?
                this.cancelProcess.bind(this) :
                this.runProcess.bind(this)
              )
            }
          >
            {
              this.state.opening ? ("importing...") : (
                this.state.running ? ("Cancel") : (
                  this.state.radioChoice == "open" ? ("Open") : ("Process")
                )
              )
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

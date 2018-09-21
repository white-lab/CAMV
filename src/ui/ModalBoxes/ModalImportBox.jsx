import React from 'react'
import PropTypes from 'prop-types'
import { Form, Modal, Button } from 'react-bootstrap'

import { spawn } from 'child_process'
import { remote } from 'electron'
import os from 'os'
import path from 'path'
import process from 'process'
import terminate from 'terminate'

import { loadSQL } from '../../io/sql'

class ModalImportBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      child: null,
      pycamverterPath: path.resolve(
        __filename.replace(/[\/\\][^\/\\]+$/, ""),
        "..\\..\\..\\PyCamverter.exe"
      ),
      raw_paths: [],
      scan_lists: [],
      mat_paths: [],
      search_path: null,
      cpus: os.cpus().length,
      stdout: [],
      stderr: [],
      opening: false,
      running: false,
    }
  }

  changeCAMVPath() {
    remote.dialog.showOpenDialog(
      {
        filters: [{
          name: 'CAMV SQLite',
          extensions: ['db']
        }]
      },
      (fileNames) => {
        if (fileNames === undefined) return;

        this.runImport(fileNames[0])
      }
    )
  }

  changePycamverterPath() {
    remote.dialog.showOpenDialog(
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
    remote.dialog.showOpenDialog(
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
    remote.dialog.showOpenDialog(
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
    remote.dialog.showOpenDialog(
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
    remote.dialog.showOpenDialog(
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

        remote.dialog.showErrorBox(
          "Processing Error",
          err.message,
        )
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

        data = data.split("\n").filter(i => i && !i.match("DEBUG"))

        let err = data.map(
          i => Boolean(
            i.match("pycamv.main - ERROR - PyCAMV Converter has crashed!")
          )
        ).lastIndexOf(true)
        data = data.slice(0, (err >= 0) ? (err + 1) : data.length)

        if (data.length < 1) { return }

        this.setState((prevState) => ({
          stdout: prevState.stdout.concat(data.join("\n")),
        }))
      },
    )

    child.stderr.on(
      'data',
      (data) => {
        data = data.toString()

        this.setState((prevState) => ({
          stderr: prevState.stderr.concat(data),
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
      if (err) {
        remote.dialog.showErrorBox(
          "Database Error",
          err.message,
        )
        console.error(err)
      }

      remote.getCurrentWindow().setProgressBar(-1)

      this.setState({
        child: null,
        running: false,
      })
    })
  }

  runImport(camvFileName) {
    this.setState({
      opening: true,
    })

    loadSQL(
      camvFileName,
      (data) => {
        this.props.importCallback(data, camvFileName)

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
            <Form.Group
              controlId="radioChoice"
            >
              <Form.Group
                controlId="formControlsFile"
              >
                <Button
                  id="fileSelect"
                  onClick={this.changeCAMVPath.bind(this)}
                  disabled={
                    this.state.opening
                  }
                >
                  Open CAMV Database (.camv.db)
                </Button>
              </Form.Group>
              <hr/>
              <Form.Group
                controlId="formControlsFile"
              >
                <Button
                  id="fileSelect"
                  onClick={this.changeSearchPath.bind(this)}
                  disabled={
                    this.state.opening
                  }
                >
                  Search Path (.msf)
                </Button>
                <div>
                  {
                    this.state.search_path != null ?
                    this.state.search_path :
                    ("No file selected.")
                  }
                </div>
              </Form.Group>
              <Form.Group
                controlId="formControlsFile"
              >
                <Button
                  id="fileSelect"
                  onClick={this.changeRawPaths.bind(this)}
                  disabled={
                    this.state.opening
                  }
                >
                  Raw Files (.raw, .d, .wiff, .mgf)
                </Button>
                <div>
                  {
                    this.state.raw_paths.length > 0 ?
                    this.state.raw_paths.join(', ') :
                    ("No file selected.")
                  }
                </div>
              </Form.Group>
              <Form.Group
                controlId="formControlsFile"
              >
                <Button
                  id="fileSelect"
                  onClick={this.changeScanLists.bind(this)}
                  disabled={
                    this.state.opening
                  }
                >
                  Scan Lists (.csv, .xlsx)
                </Button>
                <div>
                  {
                    this.state.scan_lists.length > 0 ?
                    this.state.scan_lists.join(', ') :
                    ("No files selected.")
                  }
                </div>
              </Form.Group>
              <Form.Group
                controlId="formControlsFile"
              >
                <Button
                  id="fileSelect"
                  onClick={this.changeMatPaths.bind(this)}
                  disabled={
                    this.state.opening
                  }
                >
                  CAMV-Matlab Session(s) (.mat)
                </Button>
                <div>
                  {
                    this.state.mat_paths.length > 0 ?
                    this.state.mat_paths.join(', ') :
                    ("No files selected.")
                  }
                </div>
              </Form.Group>
              {
                process.env.NODE_ENV === 'development' &&
                <Form.Group
                  controlId="formControlsFile"
                >
                  <Button
                    id="fileSelect"
                    onClick={this.changePycamverterPath.bind(this)}
                    disabled={
                      this.state.opening
                    }
                  >
                    PyCamverter Path (.exe)
                  </Button>
                  <div>
                    {
                      this.state.pycamverterPath != null ?
                      this.state.pycamverterPath :
                      ("No file selected.")
                    }
                  </div>
                </Form.Group>
              }
              <Form.Group
                controlId="formControlsSelect"
              >
                <Form.Label>
                  # of CPUs
                </Form.Label>
                <Form.Control
                  as="select"
                  value={this.state.cpus.toString()}
                  onChange={this.changeCPUCount.bind(this)}
                  disabled={
                    this.state.opening
                  }
                >
                  {
                    os.cpus().map(
                      (cpu, i) => (
                        <option
                          value={i + 1}
                          key={i + 1}
                        >
                          {i + 1}
                        </option>
                      )
                    )
                  }
                </Form.Control>
              </Form.Group>
            </Form.Group>
          }
          {
            this.state.running &&
            <div className="console">
              {
                this.state.stdout.map(
                  (line, index) => (
                    <pre
                      className="stdout"
                      key={index}
                    >
                      {line}
                    </pre>
                  )
                )
              }
              {
                this.state.stderr.map(
                  (line, index) => (
                    <pre
                      className="stderr"
                      key={index}
                    >
                      {line}
                    </pre>
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
                process.platform != "win32" ||
                this.state.pycamverterPath == null ||
                this.state.search_path == null
              ) ||
              this.state.opening
            }
            onClick={
              this.state.running ?
              this.cancelProcess.bind(this) :
              this.runProcess.bind(this)
            }
          >
            {
              this.state.opening ? ("importing...") : (
                this.state.running ? ("Cancel") : (
                  ("Process")
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
  showModal: PropTypes.bool.isRequired,
  database: PropTypes.object,

  importCallback: PropTypes.func,
  closeCallback: PropTypes.func,
}

ModalImportBox.defaultProps = {
  importCallback: null,
  closeCallback: null,
  database: null,
}

module.exports = ModalImportBox

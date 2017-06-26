import React from 'react'
import PropTypes from 'prop-types'
import { Modal, Button } from 'react-bootstrap'
import { execFile } from 'child_process'

 import fs from 'fs'
 import path from 'path'
 import process from 'process'

import { remote } from 'electron'

class modalProcessScanBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      processing: false,
      pycamverterPath: path.resolve(
        __filename.replace(/[\/\\][^\/\\]+$/, ""),
        "..\\..\\..\\PyCamverter.exe"
      ),
      search_path: null,
      raw_path: null,
    }
  }

  refreshPaths() {
    this.refreshSearchPath()
    this.refreshRawPath()
  }

  refreshSearchPath() {
    this.props.db.all(
      "SELECT * \
      FROM camv_meta \
      WHERE key=?",
      [
        "search_path",
      ],
      (err, rows) => {
        let search_path = null

        rows = rows.map(i => i.val)

        // Check the directory local to the db file as well
        rows.push(
          this.props.db.filename.replace(/[\.].+$/, "") + '.msf'
        )

        for (let row of rows) {
          if (fs.existsSync(row)) {
            search_path = row
            break
          }
        }

        this.setState({
          search_path: search_path,
        })
      }
    )
  }

  refreshRawPath() {
    this.props.db.all(
      "SELECT * \
      FROM camv_meta \
      WHERE key=?",
      [
        "raw_path",
      ],
      (err, rows) => {
        if (err != null || rows == null) {
          console.error(err)
          return
        }

        let raw_path = null
        rows = rows.map(i => i.val)

        if (this.props.scan != null) {
          let scanFile = this.props.scan.fileName.replace(/^.*[\\\/]/, '')
          rows = rows.filter(i => i.replace(/.*[\\\/]/, '') == scanFile)

          // Check the directory local to the db file as well
          rows.push(
            path.resolve(
              this.props.db.filename.replace(/[\/\\][^\/\\]+$/, ""),
              scanFile,
            )
          )
        } else {
          for (let extension of ['.raw', '.mgf', '.d', '.wiff']) {
            rows.push(
              this.props.db.filename.replace(/[\.].+$/, '') + extension
            )
          }
        }

        for (let row of rows) {
          if (fs.existsSync(row)) {
            raw_path = row
            break
          }
        }

        this.setState({
          raw_path: raw_path,
        })
      }
    )
  }

  updatePycamverterPath() {
    remote.dialog.showOpenDialog(
      {
        filters: [{
          name: 'PyCamverter',
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

  updateRawPath() {
    remote.dialog.showOpenDialog(
      {
        filters: [{
          name: 'RAW File',
          extensions: ['raw', "mgf", "d", "wiff"],
        }]
      },
      (fileNames) => {
        if (fileNames === undefined) return;

        this.setState({
          raw_path: fileNames[0],
        })
      }
    )
  }

  updateSearchPath() {
    remote.dialog.showOpenDialog(
      {
        filters: [{
          name: 'Search File',
          extensions: ['msf', "xml"],
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

  close() {
    if (!this.state.processing && this.props.closeCallback != null) {
      this.props.closeCallback(false)
    }
  }

  runProcess() {
    this.setState({
      processing: true,
    })

    let args = [
      "-vv",
      "--reprocess",
      "--scans", this.props.scan.scanNumber,
      "--search-path", this.state.search_path,
      "--raw-paths", this.state.raw_path,
    ]

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
        })

        this.props.db.run(
          "INSERT OR IGNORE INTO camv_meta \
          (key, val) \
          VALUES (?, ?)",
          [
            ("search_path", this.state.search_path),
            ("raw_path", this.state.raw_path),
          ],
        )

        if (this.props.closeCallback != null) {
          this.props.closeCallback(error == null)
        }
      }
    )
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
              Process Scan
              {
                this.props.scan != null && (
                  <span> {this.props.scan.scanNumber}</span>
                )
              }
            </div>
          </Modal.Title>
        </Modal.Header>
        {
          this.props.scan != null &&
          <Modal.Body>
            <div>
              <Button
                id="fileSelect"
                onClick={this.updateRawPath.bind(this)}
                disabled={this.state.processing}
              >
                Raw File
              </Button>
              <div>
                {this.state.raw_path}
              </div>
            </div>
            <div>
              <Button
                id="fileSelect"
                onClick={this.updateSearchPath.bind(this)}
                disabled={this.state.processing}
              >
                Search File
              </Button>
              <div>
                {this.state.search_path}
              </div>
            </div>
            <div>
              <Button
                id="fileSelect"
                onClick={this.updatePycamverterPath.bind(this)}
                disabled={this.state.processing}
              >
                Pycamverter Path
              </Button>
              <div>
                {this.state.pycamverterPath}
              </div>
            </div>
          </Modal.Body>
        }
        <Modal.Footer>
          <Button
            disabled={
              process.platform != "win32" ||
              this.state.processing ||
              this.props.scan == null ||
              this.state.pycamverterPath == null ||
              this.state.search_path == null ||
              this.state.raw_path == null
            }
            onClick={this.runProcess.bind(this)}
          >
            {
              this.state.processing ?
              ("processing...") :
              ("Process")
            }
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

modalProcessScanBox.propTypes = {
  closeCallback: PropTypes.func,

  showModal: PropTypes.bool.isRequired,

  scan: PropTypes.object,
  db: PropTypes.object,
}

modalProcessScanBox.defaultProps = {
  closeCallback: null,

  scan: null,
  db: null,
}

module.exports = modalProcessScanBox

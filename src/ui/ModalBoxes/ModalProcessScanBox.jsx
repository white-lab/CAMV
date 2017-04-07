import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { execFile } from 'child_process'

const { dialog } = require('electron').remote

class modalProcessScanBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      processing: false,
      pycamverterPath: null,
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      (prevProps.db == this.props.db) ||
      this.props.db == null
    ) { return }

    this.props.db.get(
      "SELECT * \
      FROM camv_meta \
      WHERE key=?",
      [
        "search_path",
      ],
      function(err, row) {
        this.setState({
          search_path: row.val,
        })
      }.bind(this)
    )
    this.props.db.get(
      "SELECT * \
      FROM camv_meta \
      WHERE key=?",
      [
        "raw_paths",
      ],
      function(err, row) {
        let raw_paths = row.val.split(";")
        let raw_path = null

        if (this.props.scan != null) {
          for (let path of raw_paths) {
            if (
              path.replace(/^.*[\\\/]/, '') ==
              this.props.scan.fileName.replace(/^.*[\\\/]/, '')
            ) {
              raw_path = path
            }
          }
        } else {
          raw_path = raw_paths[0]
        }

        this.setState({
          raw_path: raw_path,
        })
      }.bind(this)
    )
  }

  updatePycamverterPath() {
    dialog.showOpenDialog(
      {
        filters: [{
          name: 'PyCamverter',
          extensions: ['exe'],
        }]
      },
      function (fileNames) {
        if (fileNames === undefined) return;

        this.setState({
          pycamverterPath: fileNames[0],
        })
      }.bind(this)
    )
  }

  updateRawPath() {
    dialog.showOpenDialog(
      {
        filters: [{
          name: 'RAW File',
          extensions: ['raw', "mgf", "d", "wiff"],
        }]
      },
      function (fileNames) {
        if (fileNames === undefined) return;

        this.setState({
          raw_path: fileNames[0],
        })
      }.bind(this)
    )
  }

  updateSearchPath() {
    dialog.showOpenDialog(
      {
        filters: [{
          name: 'Search File',
          extensions: ['msf', "xml"],
        }]
      },
      function (fileNames) {
        if (fileNames === undefined) return;

        this.setState({
          search_path: fileNames[0],
        })
      }.bind(this)
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
      "--search_path", this.state.search_path,
      "--raw_paths", this.state.raw_path,
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
            </div>
          </Modal.Title>
        </Modal.Header>
        {
          this.props.scan != null &&
          <Modal.Body>
            <div>
              Scan {this.props.scan.scanNumber}
            </div>
            <div>
              <Button
                id="fileSelect"
                onClick={this.updateRawPath.bind(this)}
                disabled={this.state.processing}
              >
                Raw File
              </Button>
              {this.state.raw_path}
            </div>
            <div>
              <Button
                id="fileSelect"
                onClick={this.updateSearchPath.bind(this)}
                disabled={this.state.processing}
              >
                Search File
              </Button>
              {this.state.search_path}
            </div>
            <div>
              <Button
                id="fileSelect"
                onClick={this.updatePycamverterPath.bind(this)}
                disabled={this.state.processing}
              >
                Pycamverter Path
              </Button>
              {this.state.pycamverterPath}
            </div>
          </Modal.Body>
        }
        <Modal.Footer>
          <Button
            disabled={
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
  importCallback: React.PropTypes.func,
  closeCallback: React.PropTypes.func,

  showModal: React.PropTypes.bool.isRequired,

  scan: React.PropTypes.object,
  db: React.PropTypes.object,
}

modalProcessScanBox.defaultProps = {
  importCallback: null,
  closeCallback: null,

  scan: null,
  db: null,
}

module.exports = modalProcessScanBox

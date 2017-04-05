import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { execFile } from 'child_process'

const { dialog } = require('electron').remote

class modalProcessScanBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ready: false,
      processing: false,
      pycamverterPath: null,
    }
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
          ready: true,
          pycamverterPath: fileNames[0],
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

    this.props.db.all(
      "SELECT * \
      FROM camv_meta \
      WHERE key IN (?, ?)",
      [
        "search_path",
        "raw_paths",
      ],
      function (err, rows) {
        if (err != null || rows == null) {
          console.error(err)
          return
        }

        let search_path = null
        let raw_paths = null

        for (let row of rows) {
          if (row.key == "search_path") {
            search_path = row.val
          } else if (row.key == "raw_paths") {
            raw_paths = row.val
          } else {
            console.error("Unexpected row:", row)
            return
          }
        }

        let raw_path = null

        for (let path of raw_paths.split(";")) {
          if (
            path.replace(/^.*[\\\/]/, '') ==
            this.props.scan.fileName.replace(/^.*[\\\/]/, '')
          ) {
            raw_path = path
          }
        }

        if (raw_path == null) {
          console.error(
            "Unable to find raw path", raw_paths, this.props.scan.fileName
          )
          return
        }

        let args = [
          "-vv",
          "--reprocess",
          "--scans", this.props.scan.scanNumber,
          "--search_path", search_path,
          "--raw_paths", raw_path,
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
      }.bind(this)
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
              Filename: {this.props.scan.fileName}
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
              !this.state.ready ||
              this.state.processing ||
              this.props.scan == null
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

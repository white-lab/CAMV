import React from 'react'

class ScanDataBox extends React.Component {
  render() {
    return (
      <div
        id="scanData"
      >
        {
          this.props.protName != null &&
          <p>{this.props.protName}</p>
        }
        {
          this.props.chargeState != null &&
          <p>Charge State: +{this.props.chargeState}</p>
        }
        {
          this.props.scanNumber != null &&
          <p>Scan: {this.props.scanNumber}</p>
        }
        {
          this.props.fileName != null &&
          <p>File Name: {this.props.fileName}</p>
        }
      </div>
    )
  }
}

ScanDataBox.propTypes = {
  chargeState: React.PropTypes.number,
  protName: React.PropTypes.string,
  scanNumber: React.PropTypes.number,
  fileName: React.PropTypes.string,
}

ScanDataBox.defaultProps = {
  chargeState: null,
  protName: null,
  scanNumber: null,
  fileName: null,
}

module.exports = ScanDataBox

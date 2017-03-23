import React from 'react'

class ScanDataBox extends React.Component {
  render() {
    return (
      <div
        id="scanData"
      >
        {
          this.props.proteins != null && this.props.proteins.length > 0 &&
          <p>{this.props.proteins.map(i => i.proteinName).join(" / ")}</p>
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
          <p>File Name: {this.props.fileName.replace(/^.*[\\\/]/, '')}</p>
        }
      </div>
    )
  }
}

ScanDataBox.propTypes = {
  chargeState: React.PropTypes.number,
  proteins: React.PropTypes.array,
  scanNumber: React.PropTypes.number,
  fileName: React.PropTypes.string,
}

ScanDataBox.defaultProps = {
  chargeState: null,
  proteins: [],
  scanNumber: null,
  fileName: null,
}

module.exports = ScanDataBox

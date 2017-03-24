import React from 'react'

class ScanDataBox extends React.Component {
  render() {
    let filename = (
      this.props.scan != null ?
      this.props.scan.filenName.replace(/^.*[\\\/]/, '') : ''
    )
    let prot = (
      this.props.proteins != null ?
      this.props.proteinName : ''
    )

    if (filename.length > 100) {
      filename = filename.substring(0, 100) + "..."
    }
    if (prot.length > 100) {
      prot = prot.substring(0, 100) + "..."
    }

    return (
      <div
        id="scanData"
      >
        {
          prot.length > 0 &&
          <p>
            {prot}
          </p>
        }
        {
          this.props.scan != null && this.props.scan.chargeState != null &&
          <p>
            Charge State: +{this.props.scan.chargeState}
            {
              this.props.scan.c13Num > 0 &&
              ", " + this.props.scan.c13Num + " ¹³C"
            }
          </p>
        }
        {
          this.props.scan != null && this.props.scan.scanNumber != null &&
          <p>
            Scan: {this.props.scan.scanNumber}
            {
              this.props.scan.searchScore != null &&
              " - Score: " + this.props.scan.searchScore
            }
          </p>
        }
        {
          filename.length > 0 &&
          <p>
            File: {filename}
          </p>
        }
      </div>
    )
  }
}

ScanDataBox.propTypes = {
  scan: React.PropTypes.object,
  proteins: React.PropTypes.array,
}

ScanDataBox.defaultProps = {
  scan: null,
  proteins: [],
}

module.exports = ScanDataBox

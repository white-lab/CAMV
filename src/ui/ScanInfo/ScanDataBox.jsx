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
          this.props.scan != null && this.props.scan.fileName != null &&
          <p>
            File Name: {this.props.scan.fileName.replace(/^.*[\\\/]/, '')}
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

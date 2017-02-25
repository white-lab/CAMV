import React from 'react'

import PTMPlacementListItem from './PTMPlacementListItem'

class ScanNumberListItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      open: this.childSelected(),
    }
  }

  childSelected() {
    return (
      this.props.selectedProtein == this.props.proteinId &&
      this.props.selectedPeptide == this.props.peptideId &&
      this.props.selectedScan == this.props.scan.scanId &&
      this.props.selectedPTMPlacement != null
    );
  }

  toggle() {
    this.setState({
      open: !this.state.open,
    })
    this.props.update(
      this.props.proteinId,
      this.props.peptideId,
      this.props.scan.scanId,
      null
    )
  }

  render() {
    var selected = (
      this.props.selectedProtein == this.props.proteinId &&
      this.props.selectedPeptide == this.props.peptideId &&
      this.props.selectedScan == this.props.scan.scanId &&
      this.props.selectedPTMPlacement == null
    )

    if (this.state.open || this.childSelected()) {
      return (
        <div>
          <li
            className="scan"
            onClick={this.toggle.bind(this)}
          >
            <span
              className={selected ? 'selectedListItem' : 'unselectedListItem'}
            >
              Scan: {this.props.scan.scanNumber}
            </span>
          </li>
          <ul>
            {
              this.props.ptmPlacements.map(
                (ptmPlacement, i) => {
                  return (
                    <PTMPlacementListItem
                      choice={this.props.scan.choiceData[i].state}
                      key={ptmPlacement.id}
                      proteinId={this.props.proteinId}
                      peptideId={this.props.peptideId}
                      scanId={this.props.scan.scanId}
                      ptmPlacement={ptmPlacement}
                      selectedProtein={this.props.selectedProtein}
                      selectedPeptide={this.props.selectedPeptide}
                      selectedScan={this.props.selectedScan}
                      selectedPTMPlacement={this.props.selectedPTMPlacement}
                      update={this.props.update}
                    />
                  )
                }
              )
            }
          </ul>
        </div>
      )
    } else {
      return (
        <li
          className="scan"
          onClick={this.toggle.bind(this)}
        >
          <span
            className={selected ? 'selectedListItem' : 'unselectedListItem'}
          >
            Scan: {this.props.scan.scanNumber}
          </span>
        </li>
      )
    }
  }
}

ScanNumberListItem.propTypes = {
  scan: React.PropTypes.array.isRequired,
  update: React.PropTypes.func.isRequired,
  proteinId: React.PropTypes.number.isRequired,
  peptideId: React.PropTypes.number.isRequired,
  ptmPlacements: React.PropTypes.number.isRequired,
  selectedProtein: React.PropTypes.number.isRequired,
  selectedPeptide: React.PropTypes.number.isRequired,
  selectedScan: React.PropTypes.number.isRequired,
  selectedPTMPlacement: React.PropTypes.number.isRequired,
}

module.exports = ScanNumberListItem

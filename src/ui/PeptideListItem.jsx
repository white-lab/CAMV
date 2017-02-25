import React from 'react'

import ScanNumberListItem from './ScanNumberListItem'

class PeptideListItem extends React.Component {
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
      this.props.selectedScan != null
    )
  }

  toggle() {
    this.setState({
      open: !this.state.open,
    })
    this.props.update(
      this.props.proteinId,
      this.props.peptideId,
      null,
      null,
    )
  }

  render() {
    var selected = (
      this.props.selectedProtein == this.props.proteinId &&
      this.props.selectedPeptide == this.props.peptideId &&
      this.props.selectedScan == null &&
      this.props.selectedPTMPlacement == null
    )
    var peptideModificationState = this.props.peptideData.modificationStates[this.props.modificationStateId]
    var sequenceName = this.props.peptideData.peptideSequence + peptideModificationState.modDesc

    if (this.state.open || this.childSelected()) {
      return (
        <div>
          <li
            className="peptide"
            onClick={this.toggle.bind(this)}
          >
            <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>
              {sequenceName}
            </span>
          </li>
          <ul>
            {
              this.props.scans.map(
                (scan) => {
                  return (
                    <ScanNumberListItem
                      key={scan.scanId}
                      proteinId={this.props.proteinId}
                      peptideId={this.props.peptideId}
                      scan={scan}
                      ptmPlacements={peptideModificationState.mods}
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
          className="peptide"
          onClick={this.toggle.bind(this)}
        >
          <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>
            {sequenceName}
          </span>
        </li>
      )
    }
  }
}

PeptideListItem.propTypes = {
  scans: React.PropTypes.array.isRequired,
  update: React.PropTypes.func.isRequired,
  proteinId: React.PropTypes.number.isRequired,
  peptideId: React.PropTypes.number.isRequired,
  modificationStateId: React.PropTypes.number.isRequired,
  selectedProtein: React.PropTypes.number.isRequired,
  selectedPeptide: React.PropTypes.number.isRequired,
  selectedScan: React.PropTypes.number.isRequired,
  selectedPTMPlacement: React.PropTypes.number.isRequired,
  peptideData: React.PropTypes.array.isRequired,
}

module.exports = PeptideListItem

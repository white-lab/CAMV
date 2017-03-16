import React from 'react'

import PeptideListItem from './PeptideListItem'

class ProteinListItem extends React.Component {
  defaultProps() {
    return {
      protein: null,
      peptide: null,
      scan: null,
      selectedProtein: null,
      selectedPeptide: null,
      selectedScan: null,
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      open: this.childSelected(),
      selected: false,
    }
  }

  childSelected() {
    return (
      this.props.selectedProtein == this.props.protein.proteinId &&
      this.props.selectedPeptide != null
    )
  }

  toggle() {
    this.props.update(
      this.props.protein.proteinId,
      null,
      null,
      null,
    )
    this.setState({
      open: !this.state.open,
    })
  }

  render() {
    var selected = (
      this.props.selectedProtein == this.props.protein.proteinId &&
      this.props.selectedPeptide == null &&
      this.props.selectedScan == null
    )
    if (this.state.open || this.childSelected()) {
      return (
        <div>
          <li
            className="protein"
            onClick={this.toggle.bind(this)}
          >
            <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>
              {this.props.protein.proteinName}
            </span>
          </li>
          <ul>
            {
              this.props.protein.peptides.map(
                (peptide) => {
                  return (
                    <PeptideListItem
                      key={[peptide.peptideId, peptide.modificationStateId]}
                      proteinId={this.props.protein.proteinId}
                      peptideId={peptide.peptideId}
                      modificationStateId={peptide.modificationStateId}
                      peptideData={this.props.peptideData[peptide.peptideDataId]}
                      scans={peptide.scans}
                      update={this.props.update}
                      selectedProtein={this.props.selectedProtein}
                      selectedPeptide={this.props.selectedPeptide}
                      selectedPTMPlacement={this.props.selectedPTMPlacement}
                      selectedScan={this.props.selectedScan}
                    />
                  )
                }
              )
            }
          </ul>
        </div>
      );
    } else {
      return (
        <li
          className="protein"
          onClick={this.toggle.bind(this)}
        >
          <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>
            {this.props.protein.proteinName}
          </span>
        </li>
      );
    }
  }
}

ProteinListItem.propTypes = {
  protein: React.PropTypes.object.isRequired,
  update: React.PropTypes.func.isRequired,
  selectedProtein: React.PropTypes.number,
  selectedPeptide: React.PropTypes.number,
  selectedScan: React.PropTypes.number,
  selectedPTMPlacement: React.PropTypes.number,
  peptideData: React.PropTypes.array.isRequired,
}

ProteinListItem.defaultProps = {
  selectedProtein: null,
  selectedPeptide: null,
  selectedScan: null,
  selectedPTMPlacement: null,
}

module.exports = ProteinListItem

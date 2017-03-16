import React from 'react'

class PTMPlacementListItem extends React.Component {
  update() {
    this.props.update(
      this.props.proteinId,
      this.props.peptideId,
      this.props.scanId,
      this.props.ptmPlacement.exactModsId
    )
  }

  render() {
    var selected = (
      this.props.selectedProtein == this.props.proteinId &&
      this.props.selectedPeptide == this.props.peptideId &&
      this.props.selectedScan == this.props.scanId &&
      this.props.selectedPTMPlacement == this.props.ptmPlacement.exactModsId
    )
    let className = this.props.choice
    return (
      <li
        className={this.props.choice != null ? this.props.choice : 'undecided'}
        onClick={this.update.bind(this)}
      >
        <span
          className={selected ? 'selectedListItem' : 'unselectedListItem'}
        >
          {this.props.ptmPlacement.name}
        </span>
      </li>
    )
  }
}

PTMPlacementListItem.propTypes = {
  update: React.PropTypes.func.isRequired,
  proteinId: React.PropTypes.number.isRequired,
  peptideId: React.PropTypes.number.isRequired,
  scanId: React.PropTypes.number.isRequired,
  ptmPlacement: React.PropTypes.object.isRequired,
  choice: React.PropTypes.string,
  selectedProtein: React.PropTypes.number,
  selectedPeptide: React.PropTypes.number,
  selectedScan: React.PropTypes.number,
  selectedPTMPlacement: React.PropTypes.number,
}

PTMPlacementListItem.defaultProps = {
  choice: null,
  selectedProtein: null,
  selectedPeptide: null,
  selectedScan: null,
  selectedPTMPlacement: null,
}

module.exports = PTMPlacementListItem

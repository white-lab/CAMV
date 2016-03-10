var PTMPlacementListItem = React.createClass({
  update: function() {
    // console.log(this.props.proteinId, this.props.peptideId, this.props.scanId, this.props.ptmPlacement.id)
    this.props.update(this.props.proteinId,
                      this.props.peptideId,
                      this.props.scanId,
                      this.props.ptmPlacement.id)
  },
  render: function(){
    var selected = (this.props.selectedProtein == this.props.proteinId &&
                    this.props.selectedPeptide == this.props.peptideId &&
                    this.props.selectedScan == this.props.scanId &&
                    this.props.selectedPTMPlacement == this.props.ptmPlacement.id)
    return (
      <li onClick={this.update}><span className={selected ? 'selectedListItem' : 'unselectedListItem'}>{this.props.ptmPlacement.name}</span></li>
    )
  }
});

var ScanNumberListItem = React.createClass({
  getInitialState: function(){
    return {open: false}
  },
  toggle: function() {
    this.setState({open: !this.state.open})
    this.props.update(this.props.proteinId, this.props.peptideId, this.props.scan.scanId, null)
  },
  render: function() {
    var selected = (this.props.selectedProtein == this.props.proteinId &&
                    this.props.selectedPeptide == this.props.peptideId &&
                    this.props.selectedScan == this.props.scan.scanId &&
                    this.props.selectedPTMPlacement == null)
    if (this.state.open){
      return (
        <div>
          <li onClick={this.toggle}><span className={selected ? 'selectedListItem' : 'unselectedListItem'}>Scan: {this.props.scan.scanNumber}</span></li>
          <ul>
            {this.props.ptmPlacements.map(function(ptmPlacement){
              return ( <PTMPlacementListItem key={ptmPlacement.id}
                                             proteinId={this.props.proteinId}
                                             peptideId={this.props.peptideId}
                                             scanId={this.props.scan.scanId}
                                             ptmPlacement={ptmPlacement}
                                             update={this.props.update}
                                             selectedProtein={this.props.selectedProtein}
                                             selectedPeptide={this.props.selectedPeptide}
                                             selectedScan={this.props.selectedScan}
                                             selectedPTMPlacement={this.props.selectedPTMPlacement}/>


                     )
            }.bind(this))}
          </ul>
        </div>
      )
    } else { 
      return ( 
        <li onClick={this.toggle}><span className={selected ? 'selectedListItem' : 'unselectedListItem'}>Scan: {this.props.scan.scanNumber}</span></li>
      )
    }
  }
});

var PeptideListItem = React.createClass({
  getInitialState: function(){
    return {open: false}
  },  
  toggle: function(){
    this.setState({open: !this.state.open})
    this.props.update(this.props.proteinId, this.props.peptideId, null, null)
  },
  render: function() {
    var selected = (this.props.selectedProtein == this.props.proteinId &&
                    this.props.selectedPeptide == this.props.peptideId &&
                    this.props.selectedScan == null &&
                    this.props.selectedPTMPlacement == null)
    var peptideModificationState = this.props.peptideData.modificationStates[this.props.modificationStateId]

    var sequenceName = this.props.peptideData.peptideSequence + peptideModificationState.modDesc
    if (this.state.open){
      return (
        <div>
        <li onClick={this.toggle}><span className={selected ? 'selectedListItem' : 'unselectedListItem'}>{sequenceName}</span></li>
        <ul>
          {this.props.scans.map(function(scan){
            return ( <ScanNumberListItem key={scan.scanId}
                                         proteinId={this.props.proteinId} 
                                         peptideId={this.props.peptideId} 
                                         scan={scan} 
                                         ptmPlacements={peptideModificationState.mods}
                                         update={this.props.update}
                                         selectedProtein={this.props.selectedProtein}
                                         selectedPeptide={this.props.selectedPeptide}
                                         selectedScan={this.props.selectedScan}
                                         selectedPTMPlacement={this.props.selectedPTMPlacement}/>
                   )    
          }.bind(this))}
        </ul>
        </div>
      )
    } else {
      return (
        <li onClick={this.toggle}><span className={selected ? 'selectedListItem' : 'unselectedListItem'}>{sequenceName}</span></li>
      )
    }
  }
});

var ProteinListItem = React.createClass({
  getInitialState: function(){
    return {open: false,
            selected: false}
  },  
  defaultProps: function() {
    return { protein: null,
             peptide: null,
             scan: null,
             selectedProtein: null,
             selectedPeptide: null,
             selectedScan: null}
  },
  toggle: function(){
    this.props.update(this.props.protein.proteinId, null, null, null)
    this.setState({open: !this.state.open})
  },
  render: function() {
    var selected = (this.props.selectedProtein == this.props.protein.proteinId &&
                    this.props.selectedPeptide == null &&
                    this.props.selectedScan == null)
    if (this.state.open){
      return (
        <div>
        <li onClick={this.toggle}><span className={selected ? 'selectedListItem' : 'unselectedListItem'}>{this.props.protein.proteinName}</span></li>
        <ul>
          { this.props.protein.peptides.map(function(peptide){
            return ( <PeptideListItem key={[peptide.peptideId, peptide.modificationStateId]}
                                      proteinId={this.props.protein.proteinId}
                                      peptideId={peptide.peptideId}
                                      modificationStateId={peptide.modificationStateId}
                                      peptideData={this.props.peptideData[peptide.peptideDataId]}
                                      scans={peptide.scans}
                                      update={this.props.update}
                                      selectedProtein={this.props.selectedProtein}
                                      selectedPeptide={this.props.selectedPeptide}
                                      selectedPTMPlacement={this.props.selectedPTMPlacement}
                                      selectedScan={this.props.selectedScan}/>
            )
          }.bind(this))}
        </ul>
        </div>
      );
    } else {
      return (
        <li onClick={this.toggle}><span className={selected ? 'selectedListItem' : 'unselectedListItem'}>{this.props.protein.proteinName}</span></li>
      );
    }
  }
});

var ScanSelectionList = React.createClass({
  update: function(proteinId, peptideId, scanId, modsId){
    // console.log("proteinId: " + proteinId + " peptideId: " + peptideId + " scanId: " + scanId + " modsId: " + modsId)
    this.props.updateSelectedProteinCallback(proteinId)
    this.props.updateSelectedPeptideCallback(peptideId)
    this.props.updateSelectedScanCallback(scanId)
    this.props.updateSelectedPTMPlacementCallback(modsId)
  },
  render: function() {
    return ( <ul>
               {this.props.data.map(function(protein) {
                  return ( <ProteinListItem key={protein.proteinId}
                                           protein={protein}
                                           update={this.update}
                                           selectedProtein={this.props.selectedProtein}
                                           selectedPeptide={this.props.selectedPeptide}
                                           selectedScan={this.props.selectedScan}
                                           selectedPTMPlacement={this.props.selectedPTMPlacement}
                                           peptideData={this.props.peptideData}/>
                         )
               }.bind(this))}
             </ul>
           )
  }
});

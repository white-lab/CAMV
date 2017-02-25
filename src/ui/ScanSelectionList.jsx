import React from 'react';
import hotkey from 'react-hotkey';
hotkey.activate();

var PTMPlacementListItem = React.createClass({
  update: function() {
    this.props.update(
      this.props.proteinId,
      this.props.peptideId,
      this.props.scanId,
      this.props.ptmPlacement.id
    )
  },

  render: function() {
    var selected = (
      this.props.selectedProtein == this.props.proteinId &&
      this.props.selectedPeptide == this.props.peptideId &&
      this.props.selectedScan == this.props.scanId &&
      this.props.selectedPTMPlacement == this.props.ptmPlacement.id
    )

    if (this.props.choice == 'accept') {
      return <li className='accept' onClick={this.update}>
        <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>{this.props.ptmPlacement.name}</span>
      </li>
    } else if (this.props.choice == 'maybe') {
      return <li className='maybe' onClick={this.update}>
        <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>{this.props.ptmPlacement.name}</span>
      </li>
    } else if (this.props.choice == 'reject') {
      return <li className='reject' onClick={this.update}>
        <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>{this.props.ptmPlacement.name}</span>
      </li>
    } else {
      return <li className='undecided' onClick={this.update}>
        <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>{this.props.ptmPlacement.name}</span>
      </li>
    }
  }
});

var ScanNumberListItem = React.createClass({
  getInitialState: function() {
    return {
      open: this.childSelected()
    }
  },

  childSelected: function() {
    return (
      this.props.selectedProtein == this.props.proteinId &&
      this.props.selectedPeptide == this.props.peptideId &&
      this.props.selectedScan == this.props.scan.scanId &&
      this.props.selectedPTMPlacement != null
    );
  },

  toggle: function() {
    this.setState({open: !this.state.open})
    this.props.update(
      this.props.proteinId,
      this.props.peptideId,
      this.props.scan.scanId,
      null
    )
  },

  render: function() {
    var selected = (
      this.props.selectedProtein == this.props.proteinId &&
      this.props.selectedPeptide == this.props.peptideId &&
      this.props.selectedScan == this.props.scan.scanId &&
      this.props.selectedPTMPlacement == null
    )

    if (this.state.open || this.childSelected()) {
      return (
        <div>
          <li className="scan" onClick={this.toggle}>
            <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>Scan: {this.props.scan.scanNumber}</span>
          </li>
          <ul>
            {
              this.props.ptmPlacements.map(
                (ptmPlacement, i) => {
                  return (
                    <PTMPlacementListItem
                      key={ptmPlacement.id}
                      choice={this.props.scan.choiceData[i].state}
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
                }
              )
            }
          </ul>
        </div>
      )
    } else {
      return (
        <li className="scan" onClick={this.toggle}>
          <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>Scan: {this.props.scan.scanNumber}</span>
        </li>
      )
    }
  }
});

var PeptideListItem = React.createClass({
  getInitialState: function() {
    return {
      open: this.childSelected()
    }
  },

  childSelected: function() {
    return (
      this.props.selectedProtein == this.props.proteinId &&
      this.props.selectedPeptide == this.props.peptideId &&
      this.props.selectedScan != null
    )
  },

  toggle: function() {
    this.setState({open: !this.state.open})
    this.props.update(this.props.proteinId, this.props.peptideId, null, null)
  },

  render: function() {
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
          <li className="peptide" onClick={this.toggle}>
            <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>{sequenceName}</span>
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
                      update={this.props.update}
                      selectedProtein={this.props.selectedProtein}
                      selectedPeptide={this.props.selectedPeptide}
                      selectedScan={this.props.selectedScan}
                      selectedPTMPlacement={this.props.selectedPTMPlacement}/>
                  )
                }
              )
            }
          </ul>
        </div>
      )
    } else {
      return (
        <li className="peptide" onClick={this.toggle}>
          <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>{sequenceName}</span>
        </li>
      )
    }
  }
});

var ProteinListItem = React.createClass({
  getInitialState: function() {
    return {
      open: this.childSelected(),
      selected: false
    }
  },

  childSelected: function() {
    return (
      this.props.selectedProtein == this.props.protein.proteinId &&
      this.props.selectedPeptide != null
    )
  },

  defaultProps: function() {
    return {
      protein: null,
      peptide: null,
      scan: null,
      selectedProtein: null,
      selectedPeptide: null,
      selectedScan: null
    }
  },

  toggle: function() {
    this.props.update(this.props.protein.proteinId, null, null, null)
    this.setState({open: !this.state.open})
  },

  render: function() {
    var selected = (this.props.selectedProtein == this.props.protein.proteinId &&
                    this.props.selectedPeptide == null &&
                    this.props.selectedScan == null)
    if (this.state.open || this.childSelected()) {
      return (
        <div>
          <li className="protein" onClick={this.toggle}>
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
                      selectedScan={this.props.selectedScan}/>
                  )
                }
              )
            }
          </ul>
        </div>
      );
    } else {
      return (
        <li className="protein" onClick={this.toggle}>
          <span className={selected ? 'selectedListItem' : 'unselectedListItem'}>
            {this.props.protein.proteinName}
          </span>
        </li>
      );
    }
  }
});

var ScanSelectionList = React.createClass({
  update: function(proteinId, peptideId, scanId, modsId) {
    // console.log("proteinId: " + proteinId + " peptideId: " + peptideId + " scanId: " + scanId + " modsId: " + modsId)
    this.props.updateAllCallback(proteinId, peptideId, scanId, modsId);
  },

  mixins: [hotkey.Mixin('handleHotkey')],

  selectLeft: function(node) {
    if (node.length <= 1) {
      return node;
    }

    node.pop();
    return node;
  },

  selectRight: function(node) {
    if (node.length >= 4) {
      return node;
    }

    node.push(0);
    return node;
  },

  getMaxLength: function(node) {
    switch (node.length) {
      case 1:
        var proteins = this.props.data;
        return proteins.length;

      case 2:
        var proteins = this.props.data;
        var peptides = proteins[node[0]].peptides;
        return peptides.length;

      case 3:
        var proteins = this.props.data;
        var peptides = proteins[node[0]].peptides;
        var scans = peptides[node[1]].scans;
        return scans.length;

      case 4:
        var proteins = this.props.data;
        var peptides = proteins[node[0]].peptides;
        var peptide = peptides[node[1]];
        var ptms = this.props.peptideData[peptide.peptideDataId].modificationStates[peptide.modificationStateId].mods;
        return ptms.length;

      default:
        console.log("Unexpected node length: " + node.length)
        return 0;
    }
  },

  selectUp: function(node) {
    if (node[node.length - 1] == 0) {
      if (node.length > 1) {
        node.pop();
      }

      return node;
    }

    node[node.length - 1] -= 1;

    while(node.length < 4) {
      node.push(0);
      node[node.length - 1] = this.getMaxLength(node) - 1;
    }

    return node;
  },

  selectDown: function(node) {
    var init = node.slice(0);

    if (node.length >= 4) {
      node[node.length - 1] += 1;
    } else {
      node.push(0);
    }

    while (node[node.length - 1] >= this.getMaxLength(node)) {
      if (node.length <= 1) {
        return init;
      }

      node.pop();
      node[node.length - 1] += 1;
    }

    return node;
  },

  handleHotkey: function(e) {
    var node = [
      this.props.selectedProtein,
      this.props.selectedPeptide,
      this.props.selectedScan,
      this.props.selectedPTMPlacement
    ];
    node = node.filter((i) => { return i != null; })

    if (node.length < 1) {
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        node = this.selectLeft(node);
        break;
      case 'ArrowRight':
        node = this.selectRight(node);
        break;
      case 'ArrowUp':
        node = this.selectUp(node);
        break;
      case 'ArrowDown':
        node = this.selectDown(node);
        break;
      default:
        return;
    }

    while (node.length < 4) { node.push(null); }
    this.update(node[0], node[1], node[2], node[3]);

    // TODO: Expand the tree as needed
  },

  render: function() {
    return (
      <ul className="tree">
        {
          this.props.data.map(
            (protein) => {
              return (
                <ProteinListItem
                  key={protein.proteinId}
                  protein={protein}
                  update={this.update}
                  selectedProtein={this.props.selectedProtein}
                  selectedPeptide={this.props.selectedPeptide}
                  selectedScan={this.props.selectedScan}
                  selectedPTMPlacement={this.props.selectedPTMPlacement}
                  peptideData={this.props.peptideData}/>
              )
            }
          )
        }
      </ul>
    )
  }
});

module.exports = ScanSelectionList

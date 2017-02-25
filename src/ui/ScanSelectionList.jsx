import React from 'react'
import hotkey from 'react-hotkey'

hotkey.activate();

import ProteinListItem from './ProteinListItem'

class ScanSelectionList extends React.Component {
  constructor(props) {
    super(props)
    this.handleHotkey = this.handleHotkey.bind(this)
  }

  componentDidMount() {
    hotkey.addHandler(this.handleHotkey)
  }

  componentWillUnmount() {
    hotkey.removeHandler(this.handleHotkey)
  }

  update(proteinId, peptideId, scanId, modsId) {
    this.props.updateAllCallback(
      proteinId,
      peptideId,
      scanId,
      modsId,
    );
  }

  selectLeft(node) {
    if (node.length <= 1) {
      return node;
    }

    node.pop();
    return node;
  }

  selectRight(node) {
    if (node.length >= 4) {
      return node;
    }

    node.push(0);
    return node;
  }

  getMaxLength(node) {
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
        var ptms = this.props.peptideData[peptide.peptideDataId]
          .modificationStates[peptide.modificationStateId]
          .mods;
        return ptms.length;

      default:
        console.log("Unexpected node length: " + node.length)
        return 0;
    }
  }

  selectUp(node) {
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
  }

  selectDown(node) {
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
  }

  handleHotkey(e) {
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
  }

  render() {
    return (
      <ul className="tree">
        {
          this.props.data.map(
            (protein) => {
              return (
                <ProteinListItem
                  key={protein.proteinId}
                  protein={protein}
                  update={this.update.bind(this)}
                  selectedProtein={this.props.selectedProtein}
                  selectedPeptide={this.props.selectedPeptide}
                  selectedScan={this.props.selectedScan}
                  selectedPTMPlacement={this.props.selectedPTMPlacement}
                  peptideData={this.props.peptideData}
                />
              )
            }
          )
        }
      </ul>
    )
  }
}

ScanSelectionList.propTypes = {
  data: React.PropTypes.array,
  peptideData: React.PropTypes.array,
  selectedProtein: React.PropTypes.number,
  selectedPeptide: React.PropTypes.number,
  selectedScan: React.PropTypes.number,
  selectedPTMPlacement: React.PropTypes.number,
  updateAllCallback: React.PropTypes.func.isRequired,
}

ScanSelectionList.defaultProps = {
  data: null,
  peptideData: null,
  selectedProtein: null,
  selectedPeptide: null,
  selectedScan: null,
  selectedPTMPlacement: null,
}

module.exports = ScanSelectionList

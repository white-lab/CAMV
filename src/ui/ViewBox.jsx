import React from 'react'

import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

import domtoimage from 'dom-to-image'
import update from 'react-addons-update'
const remote = require('electron').remote
const { dialog } = require('electron').remote

import ModalExportBox from './ModalExportBox'
import ModalFileSelectionBox from './ModalFileSelectionBox'
import ModalFragmentBox from './ModalFragmentBox'
import PrecursorSpectrumBox from './PrecursorSpectrumBox'
import QuantSpectrumBox from './QuantSpectrumBox'
import ScanSelectionList from './ScanSelectionList'
import SequenceBox from './SequenceBox'
import SpectrumBox from './SpectrumBox'


var ViewBox = React.createClass({
  decodeBase64Image: function (dataString) {
    let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    let response = {}

    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
  },

  getInitialState: function() {
    return {
      selectedRun: null,
      selectedSearch:null,
      submitted: false,
      selectedProtein: null,
      selectedPeptide: null,
      selectedScan: null,
      selectedPTMPlacement: null,
      selectedMz: null,
      currentLabel: null,
      fragmentSelectionModalIsOpen: false,
      modalExportIsOpen: false,
      fragmentMatches: [],
      maxPPM: 100,
      minMZ: 0,
      maxMZ: null,
      //data: allData.fullTestData,
      data: [],
      //peptideData: allData.peptideData
      peptideData: [],
      exporting: false
    }
  },

  updateSelectedProtein: function(proteinId) {
    this.setState({selectedProtein: proteinId})
  },
  updateSelectedPeptide: function(peptideId) {
    this.setState({selectedPeptide: peptideId})
  },
  updateSelectedScan: function(scanId) {
    this.setState({selectedScan: scanId, minMZ: 0, maxMZ: null})
  },
  updateSelectedPTMPlacement: function(modsId) {
    this.setState({selectedPTMPlacement: modsId})
  },
  updateAll: function(proteinId, peptideId, scanId, modsId) {
    this.setState({
      selectedProtein: proteinId,
      selectedPeptide: peptideId,
      selectedScan: scanId,
      minMZ: 0,
      maxMZ: null,
      selectedPTMPlacement: modsId
    })
  },
  updateMinMZ: function(newMinMZ) {
    if (newMinMZ > 0) {
      this.setState({minMZ: newMinMZ})
    } else {
      this.setState({minMZ: 0})
    }
  },
  updateMaxMZ: function(newMaxMZ) {
    if (newMaxMZ > this.state.minMZ) {
      this.setState({maxMZ: newMaxMZ})
    }
  },

  updateSelectedMz: function(mz) {
    let data = this.state.data[this.state.selectedProtein]
      .peptides[this.state.selectedPeptide]
      .scans[this.state.selectedScan]
      .scanData
    let peptide = this.state.data[this.state.selectedProtein]
      .peptides[this.state.selectedPeptide]
    let peptideDataId = peptide.peptideDataId
    let modificationStateId = peptide.modificationStateId
    let scan = peptide.scans[this.state.selectedScan]

    if (
      peptideDataId == null ||
      modificationStateId == null ||
      this.state.selectedPTMPlacement == null
    ) {
      return;
    }

    let matchData = this.state.peptideData[peptideDataId]
      .modificationStates[modificationStateId]
      .mods[this.state.selectedPTMPlacement]
      .matchData

    let currentLabel = ''

    let matchId = data.find(
      (peak) => { return (peak.mz === mz) }
    ).matchInfo[this.state.selectedPTMPlacement].matchId

    if (matchId !== null) { currentLabel = matchData[matchId].name }

    let matches = matchData.filter(
      (item) => {
        let ppm = (item.mz - mz) / mz * 1000000
        item.ppm = ppm
        return Math.abs(ppm) < this.state.maxPPM
      }
    )

    this.setState({
      selectedMz: mz,
      fragmentSelectionModalIsOpen: true,
      fragmentMatches: matches,
      currentLabel: currentLabel
    })
  },


  closeFragmentSelectionModal: function() {
    this.setState({
      fragmentSelectionModalIsOpen: false,
      fragmentMatches: [],
      selectedMz: null,
      currentLabel: ''
    })
  },
  updateSelectedFragment: function(matchId) {
    if (
      this.state.selectedProtein == null ||
      this.state.selectedPeptide == null ||
      this.state.selectedScan == null ||
      this.state.selectedMz == null
    ) {
        return
    }

    let peak_targets = {}

    let peptide = this.state.data[this.state.selectedProtein]
      .peptides[this.state.selectedPeptide]

    let matchData = this.state.peptideData[peptide.peptideDataId]
      .modificationStates[peptide.modificationStateId]
      .mods[this.state.selectedPTMPlacement]
      .matchData

    let scanData = this.state.data[this.state.selectedProtein]
      .peptides[this.state.selectedPeptide]
      .scans[this.state.selectedScan]
      .scanData

    scanData.forEach(
      function(peak, index) {
        if (peak.mz === this.state.selectedMz) {
          let match_id_target = {matchId: {$set: matchId}}
          let ptm_target = {}
          ptm_target[this.state.selectedPTMPlacement] = match_id_target
          let match_info_target = {matchInfo: ptm_target}
          peak_targets[index] = match_info_target
          peak.matchInfo[this.state.selectedPTMPlacement].matchId = matchId

          this.setState({
            currentLabel: matchData[matchId].name
          })
        }
      }.bind(this)
    )

    let scan_data_target = {scanData: peak_targets}
    let scan_target = {}
    scan_target[this.state.selectedScan] = scan_data_target;
    let scans_target = {scans: scan_target};
    let peptide_target = {}
    peptide_target[this.state.selectedPeptide] = scans_target;
    let peptides_target = {peptides: peptide_target};
    let protein_target = {}
    protein_target[this.state.selectedProtein] = peptides_target;

    this.setState({
      data: update(this.state.data, protein_target)
    })
  },

  closeExportModal: function() {
    this.setState({modalExportIsOpen: false})
  },

  export_tables: function() {
    // Export spectra as xls file
  },

  iterate_spectra: function*(export_spectras) {
    while (export_spectras.length < 4) {
      export_spectras.push(false);
    }

    for (let protein of this.state.data) {
      for (let peptide of protein.peptides) {
        for (let scan of peptide.scans) {
          for (let match of scan.choiceData) {
            let state = match.state

            if (
              (state == "accept" && !export_spectras[0]) ||
              (state == "maybe" && !export_spectras[1]) ||
              (state == "reject" && !export_spectras[2]) ||
              (state == null && !export_spectras[3])
            ) {
              continue;
            }

            let nodes = [
              protein.proteinId,
              peptide.peptideId,
              scan.scanId,
              match.modsId
            ];
            yield [
              nodes,
              protein.proteinName,
              this.state.peptideData[peptide.peptideDataId]
                .modificationStates[peptide.modificationStateId]
                .mods[match.modsId].name,
              scan.scanNumber
            ];
          }
        }
      }
    }
  },

  spectraToImage: async function (dirName, export_spectras) {
    this.setState({exporting: true});
    var win = remote.getCurrentWindow();
    var sizes = win.getBounds();
    win.setSize(800, 650);
    this.forceUpdate();

    let scan_list = this.refs["scanSelectionList"];

    let current_node = [
      scan_list.props.selectedProtein,
      scan_list.props.selectedPeptide,
      scan_list.props.selectedScan,
      scan_list.props.selectedPTMPlacement
    ];

    let promises = [];

    for (let vals of this.iterate_spectra(export_spectras)) {
      let [nodes, prot, pep, scan] = vals;
      let out_name = prot + " - " + pep + " - " + scan;

      this.refs["scanSelectionList"].update(...nodes);

      this.refs["fragmentSpectrum"].drawChart();
      this.refs["precursorSpectrum"].drawChart();
      this.refs["quantSpectrum"].drawChart();

      // promises.push(
      //
      // domtoimage.toSvg(
      let dataUrl = await domtoimage.toPng(
        document.getElementById('viewBox'),
        {
          width: 1147,
          height: 522,
          bgcolor: 'red',
          filter: node =>
            !~[
              "scanSelectionList", "exportSave", "setMinMZ", "setMaxMZ",
              "rejectButton", "maybeButton", "acceptButton"
            ].indexOf(node.id)
        },
        function () {}
      )
      promises.push(
        fs.writeFile(
          // path.join(dirName, out_name + ".svg"),
          // '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
          // dataUrl.slice("data:image/svg+xml;charset=utf-8,".length)
          path.join(dirName, out_name + ".png"),
          this.decodeBase64Image(dataUrl).data,
          function () {}
        )
      )
    }

    Promise.all(promises).then(
      function() {
        this.setState({exporting: false});
        win.setSize(sizes.width, sizes.height);
        this.refs["scanSelectionList"].update(...current_node);
      }.bind(this)
    )
  },

  exportCallback: function(dirName, export_spectras, export_tables) {
    this.setState({modalExportIsOpen: false});

    console.log(dirName)

    if (export_tables || export_spectras.some(i => i)) {
      fs.mkdir(
        dirName,
        function() {
          if (export_tables) {
            this.export_tables();
          }

          if (!export_spectras.some(i => i)) {
            return;
          }

          this.spectraToImage(dirName, export_spectras)
        }.bind(this)
      )
    }
  },

  updateChoice: function(choice) {
    /* Messy solution because javascript doesn't allow variables as dict keys */
    let state_target = {state: {$set: choice}};
    let ptm_target = {};
    ptm_target[this.state.selectedPTMPlacement] = state_target;
    let choice_target = {choiceData: ptm_target};
    let scan_target = {}
    scan_target[this.state.selectedScan] = choice_target;
    let scans_target = {scans: scan_target};
    let peptide_target = {}
    peptide_target[this.state.selectedPeptide] = scans_target;
    let peptides_target = {peptides: peptide_target};
    let protein_target = {}
    protein_target[this.state.selectedProtein] = peptides_target;

    /* However, doing it this way keeps from cloning data, saving a lot of time
       on large files.
     */
    this.setState({
      data: update(this.state.data, protein_target)
    })
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (prevState.selectedRun != this.state.selectedRun) {
      // console.log('New run: ' + this.state.selectedRun)
    }
    if (prevState.selectedSearch != this.state.selectedSearch) {
      // console.log('New search: ' + this.state.selectedSearch)
    }
  },

  goButtonClicked: function() {
    this.setState({submitted: true})
  },

  setData: function(data) {
    this.setState({data: data})
  },

  setPeptideData: function(peptideData) {
    this.setState({peptideData: peptideData})
  },

  setSubmitted: function(submitted, fileName) {
    this.setState({submitted: submitted})
    this.refs["modalExportBox"].setState({
      exportDirectory: fileName.match(/(.*)[\/\\]/)[1] || '',
      dirChosen: true
    })
  },

  openExport: function() {
    this.setState({modalExportIsOpen: true})
  },

  save: function() {
    dialog.showSaveDialog(
      {
        filters: [
          {
            name: 'compressed JSON',
            extensions: ['camv.gz']
          },
          {
            name: "JSON",
            extensions: ["camv"]
          }
        ]
      },
      function(fileName) {
        if (fileName === undefined)
          return;

        var compressed = fileName.endsWith(".gz");

        var dataToSave = JSON.stringify(
          {scanData: this.state.data, peptideData: this.state.peptideData},
          null, 2
        );

        var ws = fs.createWriteStream(fileName);

        ws.on('error', function(err) {
          dialog.showErrorBox("File Save Error", err.message);
        });

        ws.on('finish', function() {
            dialog.showMessageBox(
              {
                message: "The file has been saved!",
                buttons: ["OK"]
              }
            );
        });

        if (compressed) {
          zlib.gzip(
            dataToSave, (err, out) => {
              if (err) { console.log(err); }
              ws.write(out);
              ws.end();
            }
          )
        } else {
          ws.write(dataToSave);
          ws.end();
        }
      }.bind(this)
    );
  },

  render: function() {
    let spectrumData = []
    let precursorSpectrumData = []
    let precursorMz = null
    let isolationWindow = null
    let quantSpectrumData = []
    let quantMz = null
    let chargeState = null
    let matchData = []
    let bFound = []
    let yFound = []
    let peptideSequence = null
    let inputDisabled = true

    if (this.state.selectedProtein != null) {
      let protein = this.state.data[this.state.selectedProtein]

      if (this.state.selectedPeptide != null) {
        let peptide = protein.peptides[this.state.selectedPeptide]

        if (this.state.selectedScan != null) {
          let scan = peptide.scans[this.state.selectedScan]

          spectrumData = scan.scanData
          precursorSpectrumData = scan.precursorScanData
          precursorMz = scan.precursorMz
          isolationWindow = scan.precursorIsolationWindow
          chargeState = scan.chargeState
          quantSpectrumData = scan.quantScanData
          quantMz = scan.quantMz

          if (this.state.selectedPTMPlacement != null) {
            inputDisabled = false
            let mod = this.state.peptideData[peptide.peptideDataId]
              .modificationStates[peptide.modificationStateId]
              .mods[this.state.selectedPTMPlacement]
            matchData = mod.matchData
            peptideSequence = mod.name

            spectrumData.forEach(function(peak) {
              var matchId = peak.matchInfo[this.state.selectedPTMPlacement]
                .matchId

              if (matchId) {
                if (matchData[matchId].ionType == 'b') {
                  bFound.push(matchData[matchId].ionPosition)
                } else if (matchData[matchId].ionType == 'y') {
                  yFound.push(matchData[matchId].ionPosition)
                }
              }
            }.bind(this))
          }
        }
      }
    }

    return (
      <div className="panel panel-default" id="viewBox">
        <ModalFragmentBox
          showModal={this.state.fragmentSelectionModalIsOpen}
          closeCallback={this.closeFragmentSelectionModal}
          updateCallback={this.updateSelectedFragment}
          mz={this.state.selectedMz}
          fragmentMatches={this.state.fragmentMatches}
          currentLabel={this.state.currentLabel}
        />
        <ModalFileSelectionBox
          showModal={!this.state.submitted}
          setPeptideData={this.setPeptideData}
          setData={this.setData}
          setSubmitted={this.setSubmitted}
        />
        <ModalExportBox
          ref="modalExportBox"
          showModal={this.state.modalExportIsOpen}
          closeCallback={this.closeExportModal}
          exportCallback={this.exportCallback}
        />
        <div className="panel panel-default" id="scanSelectionList">
          <ScanSelectionList
            ref="scanSelectionList"
            data={this.state.data}
            peptideData={this.state.peptideData}
            updateSelectedProteinCallback={this.updateSelectedProtein}
            updateSelectedPeptideCallback={this.updateSelectedPeptide}
            updateSelectedScanCallback={this.updateSelectedScan}
            updateSelectedPTMPlacementCallback={this.updateSelectedPTMPlacement}
            updateAllCallback={this.updateAll}
            selectedProtein={this.state.selectedProtein}
            selectedPeptide={this.state.selectedPeptide}
            selectedScan={this.state.selectedScan}
            selectedPTMPlacement={this.state.selectedPTMPlacement}
          />
        </div>
        <div
          id="sequenceSpectraContainer"
          style={{width: this.state.exporting ? "100%" : "80%"}}>
          <div className="panel panel-default" id="sequenceBox">
            <SequenceBox
              bFound={bFound}
              sequence={peptideSequence}
              yFound={yFound}
            />
          </div>
          <div className="panel panel-default" id="spectra">
            <div id="precursorQuantContainer">
              <div
                id="precursorSpectrumBox"
                style={{
                  height: this.state.exporting ? "50%" : "46.25%",
                  width: this.state.exporting ? "95%" : "100%"
                }}>
                <PrecursorSpectrumBox
                  ref="precursorSpectrum"
                  spectrumData={precursorSpectrumData}
                  precursorMz={precursorMz}
                  isolationWindow={isolationWindow}
                  chargeState={chargeState}
                  ppm={50}
                />
              </div>
              <div
                id="quantSpectrumBox"
                style={{
                  height: this.state.exporting ? "50%" : "46.25%",
                  width: this.state.exporting ? "95%" : "100%"
                }}>
                <QuantSpectrumBox
                  ref="quantSpectrum"
                  spectrumData={quantSpectrumData}
                  quantMz={quantMz}
                  ppm={50}
                />
              </div>
              <div id="exportSave">
                <button id="save" onClick={this.save}>
                  Save
                </button>
                <button id="openExport" onClick={this.openExport}>
                  Export
                </button>
              </div>
            </div>
            <div id="fragmentSpectrumBox">
              <SpectrumBox
                ref="fragmentSpectrum"
                spectrumData={spectrumData}
                minMZ={this.state.minMZ}
                maxMZ = {this.state.maxMZ}
                updateMinMZ={this.updateMinMZ}
                updateMaxMZ={this.updateMaxMZ}
                inputDisabled={inputDisabled}
                matchData={matchData}
                selectedPTMPlacement={this.state.selectedPTMPlacement}
                updateChoice={this.updateChoice}
                pointChosenCallback={this.updateSelectedMz}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
});

module.exports = ViewBox

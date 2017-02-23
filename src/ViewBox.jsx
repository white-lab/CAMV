const fs = require('fs');
const http = require('http');
const path = require('path');
const util = require('util');
const zlib = require('zlib');

var domtoimage = require('dom-to-image');
var update = require('react-addons-update');
var remote = require('electron').remote

var ViewBox = React.createClass({
  decodeBase64Image: function (dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};

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
    data = this.state.data[this.state.selectedProtein].peptides[this.state.selectedPeptide].scans[this.state.selectedScan].scanData
    peptide = this.state.data[this.state.selectedProtein].peptides[this.state.selectedPeptide]
    peptideDataId = peptide.peptideDataId
    modificationStateId = peptide.modificationStateId
    scan = peptide.scans[this.state.selectedScan]

    matchData = this.state.peptideData[peptideDataId]
      .modificationStates[modificationStateId]
      .mods[this.state.selectedPTMPlacement]
      .matchData

    currentLabel = ''

    matchId = data.find(
      (peak) => { return (peak.mz === mz) }
    ).matchInfo[this.state.selectedPTMPlacement].matchId

    if (matchId !== null) { currentLabel = matchData[matchId].name }

    matches = matchData.filter(
      (item) => {
        ppm = (item.mz - mz) / mz * 1000000
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
    if (this.state.selectedProtein != null &&
        this.state.selectedPeptide != null &&
        this.state.selectedScan != null &&
        this.state.selectedMz != null) {

      peak_targets = {}

      matchData = this.state.peptideData[peptide.peptideDataId]
        .modificationStates[peptide.modificationStateId]
        .mods[this.state.selectedPTMPlacement]
        .matchData

      scanData = this.state.data[this.state.selectedProtein]
        .peptides[this.state.selectedPeptide]
        .scans[this.state.selectedScan]
        .scanData

      scanData.forEach(
        function(peak, index) {
          if (peak.mz === this.state.selectedMz) {
            match_id_target = {matchId: {$set: matchId}}
            ptm_target = {}
            ptm_target[this.state.selectedPTMPlacement] = match_id_target
            match_info_target = {matchInfo: ptm_target}
            peak_targets[index] = match_info_target
            peak.matchInfo[this.state.selectedPTMPlacement].matchId = matchId

            this.setState({
              currentLabel: matchData[matchId].name
            })
          }
        }.bind(this)
      )

      scan_data_target = {scanData: peak_targets}
      scan_target = {}
      scan_target[this.state.selectedScan] = scan_data_target;
      scans_target = {scans: scan_target};
      peptide_target = {}
      peptide_target[this.state.selectedPeptide] = scans_target;
      peptides_target = {peptides: peptide_target};
      protein_target = {}
      protein_target[this.state.selectedProtein] = peptides_target;

      this.setState({
        data: update(this.state.data, protein_target)
      })
    }
  },

  closeExportModal: function() {
    this.setState({modalExportIsOpen: false})
  },

  export_tables: function() {
    // Export spectra as xls file
  },

  exportCallback: function(dirName, export_spectras, export_tables) {
    this.setState({modalExportIsOpen: false});

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

          if (export_spectras[0]) {
            // Export accepted
          }

          if (export_spectras[1]) {
            // Export maybed
          }

          if (export_spectras[2]) {
            // Export rejected
          }

          this.setState({exporting: true});
          var win = remote.getCurrentWindow();
          var sizes = win.getBounds();
          win.setSize(800, 650);
          this.forceUpdate();

          this.refs["fragmentSpectrum"].drawChart();
          this.refs["precursorSpectrum"].drawChart();
          this.refs["quantSpectrum"].drawChart();

          domtoimage.toSvg(
          //domtoimage.toPng(
            document.getElementById('viewBox'),
            {
              width: 1147,
              height: 522,
              bgcolor: 'red',
              filter: function(node) {
                return !~[
                  "scanSelectionList", "save", "export", "setMinMZ", "setMaxMZ",
                  "rejectButton", "maybeButton", "acceptButton"
                ].indexOf(node.id)
              }
            }
          ).then(
            function (dataUrl) {
              fs.writeFile(
                path.join(dirName, "my-node.svg"),
                '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
                dataUrl.slice("data:image/svg+xml;charset=utf-8,".length)
                // path.join(dirName, "my-node.png"),
                // this.decodeBase64Image(dataUrl).data
              );

              this.setState({exporting: false});
              win.setSize(sizes.width, sizes.height);
            }.bind(this)
          )
        }.bind(this)
      );
    }
  },

  updateChoice: function(choice) {
    /* Messy solution because javascript doesn't allow variables as dict keys */
    state_target = {state: {$set: choice}};
    ptm_target = {};
    ptm_target[this.state.selectedPTMPlacement] = state_target;
    choice_target = {choiceData: ptm_target};
    scan_target = {}
    scan_target[this.state.selectedScan] = choice_target;
    scans_target = {scans: scan_target};
    peptide_target = {}
    peptide_target[this.state.selectedPeptide] = scans_target;
    peptides_target = {peptides: peptide_target};
    protein_target = {}
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
  setSubmitted: function(submitted) {
    this.setState({submitted: submitted})
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
    var spectrumData = []
    var precursorSpectrumData = []
    var precursorMz = null
    var isolationWindow = null
    var quantSpectrumData = []
    var quantMz = null
    var chargeState = null
    var matchData = []
    var bFound = []
    var yFound = []
    var protein = null
    var peptide = null
    var scan = null
    var choice = null
    var peptideSequence = null
    var inputDisabled = true
    if (this.state.selectedProtein != null) {
      protein = this.state.data[this.state.selectedProtein]
      if (this.state.selectedPeptide != null) {
        peptide = protein.peptides[this.state.selectedPeptide]
        if (this.state.selectedScan != null) {
          scan = peptide.scans[this.state.selectedScan]
          spectrumData = scan.scanData
          precursorSpectrumData = scan.precursorScanData
          precursorMz = scan.precursorMz
          isolationWindow = scan.precursorIsolationWindow
          chargeState = scan.chargeState
          quantSpectrumData = scan.quantScanData
          quantMz = scan.quantMz
          if (this.state.selectedPTMPlacement != null) {
            inputDisabled = false
            mod = this.state.peptideData[peptide.peptideDataId]
                    .modificationStates[peptide.modificationStateId]
                    .mods[this.state.selectedPTMPlacement]
            matchData = mod.matchData
            peptideSequence = mod.name

            spectrumData.forEach(function(peak) {
              var matchId = peak.matchInfo[this.state.selectedPTMPlacement].matchId
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

//    console.log("selectedProtein:", this.state.selectedProtein, "selectedPeptide:", this.state.selectedPeptide, "selectedScan:", this.state.selectedScan, "selecedPTMPlacement:", this.state.selectedPTMPlacement)


    return (
      <div className="panel panel-default" id="viewBox">
        <ModalFragmentBox
          showModal={this.state.fragmentSelectionModalIsOpen}
          closeCallback={this.closeFragmentSelectionModal}
          updateCallback={this.updateSelectedFragment}
          mz={this.state.selectedMz}
          fragmentMatches={this.state.fragmentMatches}
          currentLabel={this.state.currentLabel}/>
          <ModalFileSelectionBox
            showModal={!this.state.submitted}
            setPeptideData={this.setPeptideData}
            setData={this.setData}
            setSubmitted={this.setSubmitted}/>
          <ModalExportBox
            showModal={this.state.modalExportIsOpen}
            closeCallback={this.closeExportModal}
            exportCallback={this.exportCallback}/>
        <div className="panel panel-default" id="scanSelectionList">
          <ScanSelectionList
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
            selectedPTMPlacement={this.state.selectedPTMPlacement}/>
        </div>

        <div id="sequenceSpectraContainer" style={{width: this.state.exporting ? "100%" : "80%"}}>
          <div className="panel panel-default" id="sequenceBox">
            <SequenceBox
              sequence={peptideSequence}
              bFound={bFound}
              yFound={yFound}/>
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
                  ppm={50}/>
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
                  ppm={50}/>
              </div>
              <div id="exportSave">
                <button id="save" onClick={this.save}>Save</button>
                <button id="openExport" onClick={this.openExport}>Export</button>
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
                pointChosenCallback={this.updateSelectedMz}/>
            </div>
          </div>
        </div>
      </div>
    )
  }
});

ReactDOM.render(
  <ViewBox />,
  document.getElementById('content')
);

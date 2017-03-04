import React from 'react'
import { Button } from 'react-bootstrap'

import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

import domtoimage from 'dom-to-image'
import JSONStream from 'JSONStream'
import update from 'react-addons-update'
const remote = require('electron').remote
const { dialog } = require('electron').remote

import ModalExportBox from './ModalExportBox'
import ModalFileSelectionBox from './ModalFileSelectionBox'
import ModalFragmentBox from './ModalFragmentBox'
import PrecursorSpectrumBox from './PrecursorSpectrumBox'
import QuantSpectrumBox from './QuantSpectrumBox'
import ScanDataBox from './ScanDataBox'
import ScanSelectionList from './ScanSelectionList'
import SequenceBox from './SequenceBox'
import SpectrumBox from './SpectrumBox'


class ViewBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedRun: null,
      selectedSearch: null,
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
      data: [],
      peptideData: [],
      exporting: false,
      basename: null,
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedRun != this.state.selectedRun) {
      // console.log('New run: ' + this.state.selectedRun)
    }
    if (prevState.selectedSearch != this.state.selectedSearch) {
      // console.log('New search: ' + this.state.selectedSearch)
    }
  }

  updateSelectedProtein(proteinId) {
    this.setState({
      selectedProtein: proteinId,
    })
  }

  updateSelectedPeptide(peptideId) {
    this.setState({
      selectedPeptide: peptideId,
    })
  }

  updateSelectedScan(scanId) {
    this.setState({
      selectedScan: scanId,
      minMZ: 0,
      maxMZ: null,
    })
  }

  updateSelectedPTMPlacement(modsId) {
    this.setState({
      selectedPTMPlacement: modsId,
    })
  }

  updateAll(proteinId, peptideId, scanId, modsId) {
    this.setState({
      selectedProtein: proteinId,
      selectedPeptide: peptideId,
      selectedScan: scanId,
      selectedPTMPlacement: modsId,
      minMZ: 0,
      maxMZ: null,
    })

    if ((modsId != null) || [proteinId, peptideId, scanId, modsId].every(i => i != null)) {
      this.redrawCharts()
    }
  }

  redrawCharts() {
    this.refs["fragmentSpectrum"].drawChart();
    this.refs["precursorSpectrum"].drawChart();
    this.refs["quantSpectrum"].drawChart();
  }

  getScanData() {
    if (this.state.selectedProtein != null) {
      let protein = this.state.data[this.state.selectedProtein]

      if (this.state.selectedPeptide != null) {
        let peptide = protein.peptides[this.state.selectedPeptide]

        if (this.state.selectedScan != null) {
          let scan = peptide.scans[this.state.selectedScan]

          return scan.scanData
        }
      }
    }
    return null
  }

  updateMinMZ(newMinMZ) {
    this.setState({
      minMZ: newMinMZ > 0 ? newMinMZ : 0,
    })
  }

  updateMaxMZ(newMaxMZ) {
    let scanData = this.getScanData()
    let max_mz = Math.ceil(
      (scanData != null) ? scanData[scanData.length - 1].mz + 1 : 100
    )
    this.setState({
      maxMZ: newMaxMZ < max_mz ? newMaxMZ : max_mz,
    })
  }

  updateSelectedMz(mz) {
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
  }

  closeFragmentSelectionModal() {
    this.setState({
      fragmentSelectionModalIsOpen: false,
      fragmentMatches: [],
      selectedMz: null,
      currentLabel: ''
    })
  }

  updateSelectedFragment(matchId) {
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
  }

  closeExportModal() {
    this.setState({
      modalExportIsOpen: false,
    })
  }

  export_tables(dirName) {
    // Export spectra as csv file
    let dataOut = []
    dataOut.push([
      "Scan",
      "Protein",
      // "Accession",
      "Sequence",
      // "Score",
      "Status",
    ])

    for (let vals of this.iterate_spectra([true, true, true, true])) {
      let [nodes, prot, pep, scan, state] = vals;

      dataOut.push([
        scan,
        prot,
        pep,
        state,
      ])
    }

    let rows = []
    for (let row of dataOut) {
      rows.push(row.join(", "))
    }

    fs.writeFile(
      path.join(dirName, this.state.basename + ".csv"),
      rows.join("\n"),
      function () {}
    )
  }

  *iterate_spectra(export_spectras) {
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
              match.modsId,
            ];
            yield [
              nodes,
              protein.proteinName,
              this.state.peptideData[peptide.peptideDataId]
                .modificationStates[peptide.modificationStateId]
                .mods[match.modsId].name,
              scan.scanNumber,
              state,
            ];
          }
        }
      }
    }
  }

  async spectraToImage(dirName, export_spectras) {
    this.setState({exporting: true});
    var win = remote.getCurrentWindow();
    var sizes = win.getBounds();

    win.setSize(800, 650);
    win.setResizable(false);

    let scan_list = this.refs["scanSelectionList"];
    let spectrum = this.refs["fragmentSpectrum"];
    spectrum.setState({exporting: true})

    let current_node = [
      scan_list.props.selectedProtein,
      scan_list.props.selectedPeptide,
      scan_list.props.selectedScan,
      scan_list.props.selectedPTMPlacement
    ];

    /* Dummy call to force interface to redraw */
    this.refs["scanSelectionList"].update(...[null, null, null, null])

    await domtoimage.toPng(
      document.getElementById('viewBox'),
      function () {}
    )

    let promises = [];

    for (let vals of this.iterate_spectra(export_spectras)) {
      let [nodes, prot, pep, scan, score, state] = vals;
      let out_name = prot + " - " + pep + " - " + scan;

      this.refs["scanSelectionList"].update(...nodes);

      // let dataUrl = await domtoimage.toSvg(
      let dataUrl = await domtoimage.toPng(
        document.getElementById('viewBox'),
        {
          width: 770,
          height: 595,
          bgcolor: 'red',
          dpi: 600,
        },
        function () {}
      )
      promises.push(
        fs.writeFile(
          // path.join(dirName, out_name + ".svg"),
          // '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
          // dataUrl.slice("data:image/svg+xml;charset=utf-8,".length),
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
        win.setResizable(true);
        this.refs["scanSelectionList"].update(...current_node);
        spectrum.setState({exporting: false})
      }.bind(this)
    )
  }

  exportCallback(dirName, export_spectras, export_tables) {
    this.setState({
      modalExportIsOpen: false,
    })

    if (export_tables || export_spectras.some(i => i)) {
      fs.mkdir(
        dirName,
        function() {
          if (export_tables) {
            this.export_tables(dirName);
          }

          if (!export_spectras.some(i => i)) {
            return;
          }

          this.spectraToImage(dirName, export_spectras)
        }.bind(this)
      )
    }
  }

  updateChoice(choice) {
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
  }

  decodeBase64Image(dataString) {
    let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    let response = {}

    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
  }

  goButtonClicked() {
    this.setState({
      submitted: true,
    })
  }

  setData(data) {
    this.setState({
      data: data,
    })
  }

  setPeptideData(peptideData) {
    this.setState({
      peptideData: peptideData,
    })
  }

  setSubmitted(submitted, fileName) {
    this.setState({
      submitted: submitted,
    })

    if (fileName != null && fileName.length > 0) {
      this.setState({
        basename: fileName.split(/(\\|\/)/g).pop().split('.')[0],
      })
      this.refs["modalExportBox"].setState({
        exportDirectory: fileName.match(/(.*)[\/\\]/)[1] || '',
        dirChosen: true,
      })
    }
  }

  openExport() {
    this.setState({
      modalExportIsOpen: true,
    })
  }

  save() {
    dialog.showSaveDialog(
      {
        filters: [
          {
            name: 'JSON',
            extensions: ['camv', 'camv.gz']
          },
        ]
      },
      function(fileName) {
        if (fileName === undefined)
          return;

        var compressed = fileName.endsWith(".gz");

        var ws = fs.createWriteStream(
          fileName,
          (compressed ? null : 'utf-8'),
        )

        if (compressed) {
          let gzip = zlib.createGzip()
          ws = gzip.pipe(ws)
        }

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
        })

        let writer = JSONStream.stringify('', '', '')
        writer.pipe(ws)
        ws.write('{\n  "scanData": ')
        writer.write(this.state.data)
        ws.write(',\n  "peptideData": ')
        writer.write(this.state.peptideData)
        ws.write(',\n}\n')
        writer.end()
      }.bind(this)
    );
  }

  render() {
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
    let protName = null
    let scanNumber = null
    let fileName = null

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
          protName = protein.proteinName
          scanNumber = scan.scanNumber
          fileName = scan.fileName

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
      <div
        className="panel panel-default"
        id="viewBox"
        style={{margin: this.state.exporting ? '0px' : '10px'}}
      >
        <ModalFragmentBox
          showModal={this.state.fragmentSelectionModalIsOpen}
          closeCallback={this.closeFragmentSelectionModal.bind(this)}
          updateCallback={this.updateSelectedFragment.bind(this)}
          mz={this.state.selectedMz}
          fragmentMatches={this.state.fragmentMatches}
          currentLabel={this.state.currentLabel}
        />
        <ModalFileSelectionBox
          showModal={!this.state.submitted}
          setPeptideData={this.setPeptideData.bind(this)}
          setData={this.setData.bind(this)}
          setSubmitted={this.setSubmitted.bind(this)}
        />
        <ModalExportBox
          ref="modalExportBox"
          showModal={this.state.modalExportIsOpen}
          closeCallback={this.closeExportModal.bind(this)}
          exportCallback={this.exportCallback.bind(this)}
        />
        <div
          className="panel panel-default"
          id="scanSelectionList"
          style={{display: this.state.exporting ? 'none' : null}}
        >
          <ScanSelectionList
            ref="scanSelectionList"
            data={this.state.data}
            peptideData={this.state.peptideData}
            updateSelectedProteinCallback={this.updateSelectedProtein.bind(this)}
            updateSelectedPeptideCallback={this.updateSelectedPeptide.bind(this)}
            updateSelectedScanCallback={this.updateSelectedScan.bind(this)}
            updateSelectedPTMPlacementCallback={this.updateSelectedPTMPlacement.bind(this)}
            updateAllCallback={this.updateAll.bind(this)}
            selectedProtein={this.state.selectedProtein}
            selectedPeptide={this.state.selectedPeptide}
            selectedScan={this.state.selectedScan}
            selectedPTMPlacement={this.state.selectedPTMPlacement}
          />
        </div>
        <div
          id="sequenceSpectraContainer"
          style={{width: this.state.exporting ? "100%" : "80%"}}
        >
          <div
            className="panel panel-default"
            id="sequenceBox"
          >
            <div
              id="scanDataContainer"
            >
              <ScanDataBox
                protName={protName}
                chargeState={chargeState}
                scanNumber={scanNumber}
                fileName={fileName}
              />
            </div>
            <div
              id="sequenceContainer"
            >
              <SequenceBox
                bFound={bFound}
                sequence={peptideSequence}
                yFound={yFound}
              />
            </div>
          </div>
          <div
            className="panel panel-default"
            id="spectra"
          >
            <div
              id="precursorQuantContainer"
            >
              <div
                id="precursorSpectrumBox"
                style={{
                  height: this.state.exporting ? "50%" : "46.25%",
                  width: this.state.exporting ? "95%" : "100%"
                }}
              >
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
                }}
              >
                <QuantSpectrumBox
                  ref="quantSpectrum"
                  spectrumData={quantSpectrumData}
                  quantMz={quantMz}
                  ppm={50}
                />
              </div>
              <div id="exportSave">
                <Button
                  id="save"
                  onClick={this.save.bind(this)}
                  style={{display: this.state.exporting ? 'none' : null}}
                  disabled={this.state.data.length < 1}
                >
                  Save
                </Button>
                <Button
                  id="openExport"
                  onClick={this.openExport.bind(this)}
                  style={{display: this.state.exporting ? 'none' : null}}
                  disabled={this.state.data.length < 1}
                >
                  Export
                </Button>
              </div>
            </div>
            <div
              id="fragmentSpectrumBox"
            >
              <SpectrumBox
                ref="fragmentSpectrum"
                spectrumData={spectrumData}
                minMZ={this.state.minMZ}
                maxMZ={this.state.maxMZ}
                updateMinMZ={this.updateMinMZ.bind(this)}
                updateMaxMZ={this.updateMaxMZ.bind(this)}
                inputDisabled={inputDisabled}
                matchData={matchData}
                selectedPTMPlacement={this.state.selectedPTMPlacement}
                updateChoice={this.updateChoice.bind(this)}
                pointChosenCallback={this.updateSelectedMz.bind(this)}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = ViewBox

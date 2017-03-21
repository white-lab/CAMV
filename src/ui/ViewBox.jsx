import React from 'react'
import hotkey from 'react-hotkey'
import { Button } from 'react-bootstrap'

import fs from 'fs'
import path from 'path'

import update from 'react-addons-update'
const remote = require('electron').remote
const { dialog } = require('electron').remote

import ModalExportBox from './ModalBoxes/ModalExportBox'
import ModalImportBox from './ModalBoxes/ModalImportBox'
import ModalSearchBox from './ModalBoxes/ModalSearchBox'
import ModalFragmentBox from './ModalBoxes/ModalFragmentBox'
import ModalBYBox from './ModalBoxes/ModalBYBox'

import SpectrumBox from './SpectrumBoxes/SpectrumBox'
import PrecursorSpectrumBox from './SpectrumBoxes/PrecursorSpectrumBox'
import QuantSpectrumBox from './SpectrumBoxes/QuantSpectrumBox'

import ScanSelectionList from './ScanList/ScanSelectionList'

import ScanDataBox from './ScanInfo/ScanDataBox'
import SequenceBox from './ScanInfo/SequenceBox'

import { saveCAMV } from '../io/camv.jsx'
import { exportCSV } from '../io/csv.jsx'
import { spectraToImage } from '../io/spectra.jsx'


hotkey.activate()


class ViewBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      /* Selected PTM / Scan / Peptide / Protein */
      selectedProtein: null,
      selectedPeptide: null,
      selectedScan: null,
      selectedPTMPlacement: null,

      /* Peak labeling states */
      selectedMz: null,
      currentLabel: null,
      fragmentMatches: [],
      maxPPM: 100,  /* Max window for fragments that can be candidates */
      bIons: [],
      yIons: [],

      /* Modal Windows */
      modalExportOpen: false,
      modalSearchOpen: false,
      modalImportOpen: true,
      modalFragmentSelectionOpen: false,
      modalBYOpen: false,

      loaded: false,
      exporting: false,
      nodeTree: null,

      /* Validation data */
      pycamverterVersion: null,
      scanData: [],
      peptideData: [],
      basename: null,
    }
  }

  componentDidMount() {
    hotkey.addHandler(this.handleHotkey.bind(this))
  }

  componentWillUnmount() {
    hotkey.removeHandler(this.handleHotkey.bind(this))
  }

  handleHotkey(e) {
    if (this.state.loaded != null && !this.anyModalOpen()) {
      if (e.getModifierState("Control")) {
        switch (e.key) {
          case 'f':
            this.setState({modalSearchOpen: !this.state.modalSearchOpen})
            break
        }
      } else {
        switch(e.key) {
          case 'a':
            this.setChoice('accept')
            break
          case 's':
            this.setChoice('maybe')
            break
          case 'd':
            this.setChoice('reject')
            break
          default:
            let scanList = this.refs["scanSelectionList"]
            scanList.handleHotkey(e)
            break
        }
      }
    }
  }

  anyModalOpen() {
    return [
      this.state.modalImportOpen,
      this.state.modalExportOpen,
      this.state.modalSearchOpen,
      this.state.modalFragmentSelectionOpen,
      this.state.modalBYOpen,
    ].some(i => i != false)
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
    })
  }

  updateSelectedPTMPlacement(modsId) {
    this.setState({
      selectedPTMPlacement: modsId,
    })
  }

  updateAll(nodes) {
    while (nodes.length < 4) { nodes.push(null) }

    this.setState({
      selectedProtein: nodes[0],
      selectedPeptide: nodes[1],
      selectedScan: nodes[2],
      selectedPTMPlacement: nodes[3],
    })


    if ((nodes[2] != null) || nodes.every(i => i != null)) {
      this.redrawCharts()
    }
  }

  redrawCharts() {
    this.refs["fragmentSpectrum"].drawChart()
    this.refs["precursorSpectrum"].drawChart()
    this.refs["quantSpectrum"].drawChart()
  }

  getScanData() {
    return (
      this.state.selectedProtein != null &&
      this.state.selectedPeptide != null &&
      this.state.selectedScan != null
    ) ? (
      this.state.scanData[this.state.selectedProtein]
        .peptides[this.state.selectedPeptide]
        .scans[this.state.selectedScan]
        .scanData
    ) : null
  }

  updateSelectedMz(mz) {
    if (this.state.selectedPTMPlacement == null) {
      return
    }

    let data = this.getScanData()

    // TODO More specific SQL query?
    let matchId = data.find(
      peak => peak.mz === mz
    ).matchInfo[this.state.selectedPTMPlacement].matchId

    this.updateSelectedMatchId(matchId, mz)
  }

  updateSelectedMatchId(matchId, mz) {
    if (this.state.selectedPTMPlacement == null) {
      return
    }

    let [ptm] = this.getNodeData().slice(3)

    let currentLabel = (
      matchId !== null ?
      ptm.matchData[matchId].name : ''
    )

    if (mz == null) {
      mz = ptm.matchData[matchId].mz
    }

    let matches = ptm.matchData.filter(
      (item) => {
        item.ppm = 1e6 * Math.abs(item.mz - mz) / mz
        return item.ppm < this.state.maxPPM
      }
    )

    this.setState({
      selectedMz: mz,
      modalFragmentSelectionOpen: true,
      fragmentMatches: matches,
      currentLabel: currentLabel,
    })
  }

  closeFragmentSelectionModal() {
    this.setState({
      modalFragmentSelectionOpen: false,
      fragmentMatches: [],
      selectedMz: null,
      currentLabel: '',
    })
  }

  handleBYClick(bIons, yIons) {
    this.setState({
      modalBYOpen: true,
      bIons: bIons,
      yIons: yIons,
    })
  }

  clickBYModal(matchId) {
    this.setState({
      modalBYOpen: false,
    })
    this.updateSelectedMatchId(matchId, null)
  }

  closeBYModal() {
    this.setState({
      modalBYOpen: false,
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

    let [scan, ptm] = this.getNodeData().slice(2)
    let scanData = scan.scanData

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
            currentLabel: ptm.matchData[matchId].name,
          })
        }
      }.bind(this)
    )

    let scan_data_target = {scanData: peak_targets}
    let scan_target = {}
    scan_target[this.state.selectedScan] = scan_data_target

    let scans_target = {scans: scan_target}
    let peptide_target = {}
    peptide_target[this.state.selectedPeptide] = scans_target

    let peptides_target = {peptides: peptide_target}
    let protein_target = {}
    protein_target[this.state.selectedProtein] = peptides_target

    this.setState({
      scanData: update(this.state.scanData, protein_target),
    })
  }

  closeImportModal() {
    this.setState({
      modalImportOpen: false,
    })
  }

  closeExportModal() {
    this.setState({
      modalExportOpen: false,
    })
  }

  closeSearchModal() {
    this.setState({
      modalSearchOpen: false,
    })
  }

  *iterate_spectra(export_spectras) {
    while (export_spectras.length < 4) {
      export_spectras.push(false)
    }

    for (let protein of this.state.scanData) {
      for (let peptide of protein.peptides) {
        for (let scan of peptide.scans) {
          for (let ptm of scan.choiceData) {
            let state = ptm.state

            if (
              (state == "accept" && !export_spectras[0]) ||
              (state == "maybe" && !export_spectras[1]) ||
              (state == "reject" && !export_spectras[2]) ||
              (state == null && !export_spectras[3])
            ) {
              continue
            }

            let nodes = [
              protein.proteinId,
              peptide.peptideId,
              scan.scanId,
              match.modsId,
            ]

            let mod = this.state.peptideData[peptide.peptideDataId]
              .modificationStates[peptide.modificationStateId]
              .mods[ptm.modsId]

            yield [
              nodes,
              protein.proteinName,
              mod != null ? mod.name : '',
              scan.scanNumber,
              state,
            ]
          }
        }
      }
    }
  }

  runExport(dirName, export_spectras, exportTables) {
    this.setState({
      modalExportOpen: false,
    })

    if (exportTables || export_spectras.some(i => i)) {
      fs.mkdir(
        dirName,
        function() {
          if (exportTables) {
            exportCSV(
              this,
              path.join(dirName, this.state.basename + ".csv")
            )
          }

          if (!export_spectras.some(i => i)) {
            return
          }

          spectraToImage(this, dirName, export_spectras)
        }.bind(this)
      )
    }
  }

  runSearch(proteinMatch, peptideMatch, scanMatch) {
    this.setState({
      modalSearchOpen: false,
    })

    let prot_range = this.state.scanData

    // TODO Search lookup
    for (let [i, protein] of prot_range.entries()) {
      if (
        proteinMatch != '' &&
        protein.proteinName.toLowerCase().includes(proteinMatch.toLowerCase())
      ) {
        this.updateAll([i, 0, 0, 0])
        return
      }

      let pep_range = protein.peptides

      for (let [j, peptide] of pep_range.entries()) {
        let pepData = this.state.peptideData[peptide.peptideDataId]

        if (
          peptideMatch != '' &&
          pepData.peptideSequence.includes(peptideMatch.toUpperCase())
        ) {
          this.updateAll([i, j, 0, 0])
          return
        }

        let scan_range = peptide.scans

        for (let [k, scan] of scan_range.entries()) {
          if (
            scanMatch != '' &&
            String(scan.scanNumber) == scanMatch
          ) {
            this.updateAll([i, j, k, 0])
            return
          }

          let ptm_range = scan.choiceData

          for (let [l, ptm] of ptm_range.entries()) {
            let ptmData = this.state.peptideData[peptide.peptideDataId]
              .modificationStates[peptide.modificationStateId]
              .mods[ptm.modsId]

            if (
              peptideMatch != '' &&
              ptmData.name.includes(peptideMatch)
            ) {
              this.updateAll([i, j, k, l])
              return
            }
          }
        }
      }
    }
  }

  setChoice(choice) {
    if (
      this.state.selectedProtein != null &&
      this.state.selectedPeptide != null &&
      this.state.selectedScan != null &&
      this.state.selectedPTMPlacement != null
    ) {
      /* Messy solution because javascript doesn't allow variables as dict keys */
      let state_target = {state: {$set: choice}}
      let ptm_target = {}
      ptm_target[this.state.selectedPTMPlacement] = state_target

      let choice_target = {choiceData: ptm_target}
      let scan_target = {}
      scan_target[this.state.selectedScan] = choice_target

      let scans_target = {scans: scan_target}
      let peptide_target = {}
      peptide_target[this.state.selectedPeptide] = scans_target

      let peptides_target = {peptides: peptide_target}
      let protein_target = {}
      protein_target[this.state.selectedProtein] = peptides_target

      /* However, doing it this way keeps from cloning data, saving a lot of time
         on large files.
       */
      this.setState({
        scanData: update(this.state.scanData, protein_target)
      })
    }
  }

  openImport() {
    this.setState({
      modalImportOpen: true,
    })
  }

  runImport(data, fileName) {
    // TODO Connection
    this.setState({
      pycamverterVersion: data.pycamverterVersion,
      scanData: data.scanData,
      peptideData: data.peptideData,
      loaded: true,
      modalImportOpen: false,
      nodeTree: this.buildNodeTree(data.scanData, data.peptideData),
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
      modalExportOpen: true,
    })
  }

  // TODO Remove
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
          return

        saveCAMV(
          fileName,
          this.state.pycamverterVersion,
          this.state.scanData,
          this.state.peptideData,
        )
      }.bind(this)
    )
  }

  buildNodeTree(scanData, peptideData) {
    let proteins = []

    for (let prot of scanData) {
      let peptides = []

      for (let peptide of prot.peptides) {
        let scans = []
        let modDesc = peptideData[peptide.peptideDataId]
          .modificationStates[peptide.modificationStateId]
          .modDesc
        let pepSeq = peptideData[peptide.peptideDataId]
          .peptideSequence

        for (let scan of peptide.scans) {
          let ptmList = []
          let ptmPlacements = peptideData[peptide.peptideDataId]
            .modificationStates[peptide.modificationStateId]
            .mods

          for (let [index, ptm] of ptmPlacements.entries()) {
            ptmList.push({
              name: ptm.name,
              nodeId: ptm.exactModsId || ptm.id,
              choice: scan.choiceData[index].state,
            })
          }

          scans.push({
            name: "Scan: " + scan.scanNumber,
            nodeId: scan.scanId,
            children: ptmList,
          })
        }

        peptides.push({
          name: pepSeq + modDesc,
          nodeId: peptide.peptideId,
          overrideKey: [peptide.peptideId, peptide.modificationStateId],
          children: scans,
        })
      }

      proteins.push({
        name: prot.proteinName,
        nodeId: prot.proteinId,
        children: peptides,
      })
    }

    return proteins
  }

  getNodeTree() {
    if (!this.state.loaded || this.state.nodeTree == null) {
      return []
    }

    return this.state.nodeTree
  }

  getSelectedNode() {
    return [
      this.state.selectedProtein,
      this.state.selectedPeptide,
      this.state.selectedScan,
      this.state.selectedPTMPlacement,
    ]
  }

  getNodeData() {
    let protein = (
      this.state.selectedProtein != null ?
      this.state.scanData[this.state.selectedProtein] : null
    )
    let peptide = (
      (protein != null && this.state.selectedPeptide != null) ?
      protein.peptides[this.state.selectedPeptide] : null
    )
    let scan = (
      (peptide != null && this.state.selectedScan != null) ?
      peptide.scans[this.state.selectedScan] : null
    )
    let ptm = (
      (peptide != null && this.state.selectedPTMPlacement != null) ?
      this.state.peptideData[peptide.peptideDataId]
        .modificationStates[peptide.modificationStateId]
        .mods[this.state.selectedPTMPlacement] : null
    )

    return [protein, peptide, scan, ptm]
  }

  render() {
    let [protein, peptide, scan, ptm] = this.getNodeData()

    return (
      <div
        className="panel panel-default"
        id="viewBox"
        style={{margin: this.state.exporting ? '0px' : '10px'}}
      >
        <ModalImportBox
          ref="modalImportBox"
          showModal={this.state.modalImportOpen}
          importCallback={this.runImport.bind(this)}
          closeCallback={this.closeImportModal.bind(this)}
        />
        <ModalExportBox
          ref="modalExportBox"
          showModal={this.state.modalExportOpen}
          closeCallback={this.closeExportModal.bind(this)}
          exportCallback={this.runExport.bind(this)}
        />
        <ModalSearchBox
          ref="modalSearchBox"
          showModal={this.state.modalSearchOpen}
          closeCallback={this.closeSearchModal.bind(this)}
          searchCallback={this.runSearch.bind(this)}
        />
        <ModalFragmentBox
          ref="modalFragmentBox"
          showModal={this.state.modalFragmentSelectionOpen}
          mz={this.state.selectedMz}
          fragmentMatches={this.state.fragmentMatches}
          currentLabel={this.state.currentLabel}
          updateCallback={this.updateSelectedFragment.bind(this)}
          closeCallback={this.closeFragmentSelectionModal.bind(this)}
        />
        <ModalBYBox
          ref="modalBYBox"
          showModal={this.state.modalBYOpen}
          clickCallback={this.clickBYModal.bind(this)}
          closeCallback={this.closeBYModal.bind(this)}
          bIons={this.state.bIons}
          yIons={this.state.yIons}
        />
        <div
          className="panel panel-default"
          id="scanSelectionList"
          style={{display: this.state.exporting ? 'none' : null}}
        >
          <ScanSelectionList
            ref="scanSelectionList"
            tree={this.getNodeTree()}

            updateAllCallback={this.updateAll.bind(this)}

            selectedNode={this.getSelectedNode()}
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
            {
              (scan != null && protein != null) &&
              <div
                id="scanDataContainer"
              >
                <ScanDataBox
                  protName={protein.proteinName}
                  chargeState={scan.chargeState}
                  scanNumber={scan.scanNumber}
                  fileName={scan.fileName}
                />
              </div>
            }
            {
              (scan != null && ptm != null) &&
              <div
                id="sequenceContainer"
              >
                <SequenceBox
                  ptm={ptm}
                  spectrumData={scan.spectrumData}
                  matchData={ptm.matchData}
                  clickCallback={this.handleBYClick.bind(this)}
                />
              </div>
            }
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
                  spectrumData={scan != null ? scan.precursorScanData : []}
                  precursorMz={scan != null ? scan.precursorMz : null}
                  isolationWindow={scan != null ? scan.precursorIsolationWindow : null}
                  c13Num={scan != null ? scan.c13Num : 0}
                  chargeState={scan != null ? scan.chargeState : null}
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
                  spectrumData={scan != null ? scan.quantScanData : []}
                  quantMz={scan != null ? scan.quantMz : null}
                  ppm={50}
                />
              </div>
              <div id="exportSave">
                <Button
                  id="openImport"
                  onClick={this.openImport.bind(this)}
                  style={{display: this.state.exporting ? 'none' : null}}
                  disabled={this.state.loaded}
                >
                  Open
                </Button>
                <Button
                  id="openSave"
                  onClick={this.save.bind(this)}
                  style={{display: this.state.exporting ? 'none' : null}}
                  disabled={!this.state.loaded}
                >
                  Save
                </Button>
                <Button
                  id="openExport"
                  onClick={this.openExport.bind(this)}
                  style={{display: this.state.exporting ? 'none' : null}}
                  disabled={!this.state.loaded}
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
                spectrumData={scan != null ? scan.scanData : []}
                matchData={ptm != null ? ptm.matchData : []}
                collisionType={scan != null ? scan.collisionType : null}
                inputDisabled={ptm == null}

                selectedScan={this.state.selectedScan}
                selectedPTMPlacement={this.state.selectedPTMPlacement}

                updateChoice={this.setChoice.bind(this)}
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

import React from 'react'
import hotkey from 'react-hotkey'
import { Button } from 'react-bootstrap'

import fs from 'fs'
import path from 'path'

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
      selectedPTM: null,

      proteins: [],
      peptide: null,
      scan: null,
      ptm: null,
      scanData: [],
      precursorData: [],
      quantData: [],
      quantMz: [],

      /* Peak labeling states */
      selectedPeak: null,
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
      nodeTree: [],

      /* Validation data */
      db: null,
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

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.selectedProtein != this.state.selectedProtein &&
      this.state.selectedProtein
    ) {
      this.updateProtein()
    }

    if (
      prevState.selectedPeptide != this.state.selectedPeptide &&
      this.state.selectedPeptide
    ) {
      this.updatePeptide()
    }

    if (
      prevState.selectedScan != this.state.selectedScan &&
      this.state.selectedScan
    ) {
      this.updateScan()
    }

    if (
      prevState.selectedPTM != this.state.selectedPTM &&
      this.state.selectedPTM
    ) {
      this.updatePTM()
    }

    if (
      (
        prevState.selectedScan != this.state.selectedScan &&
        this.state.selectedScan != null
      ) || (
        prevState.selectedPTM != this.state.selectedPTM &&
        this.state.selectedPTM != null
      )
    ) {
      this.updateScanData()
      this.redrawCharts()
    }

    if (
      prevState.db != this.state.db &&
      this.state.db != null
    ) {
      this.buildNodeTree()
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

  blob_to_peaks(blob) {
    return new TextDecoder("utf-8").decode(blob).split(";").map(
      function(i) {
        let [mz, intensity] = i.split(',')
        mz = parseFloat(mz)
        intensity = parseFloat(intensity)
        return {mz: mz, into: intensity}
      }
    )
  }

  updateScanData() {
    if (this.state.selectedScan == null) { return }

    this.state.db.get(
      "SELECT (data_blob) \
      FROM scan_data \
      WHERE scan_data.scan_id=? AND scan_data.data_type=?"
      ,
      [
        this.state.selectedScan,
        "ms2",
      ],
      function(err, row) {
        if (err != null) { console.error(err) }

        let data = this.blob_to_peaks(row.data_blob)

        if (this.state.selectedPTM == null) {
          this.setState({
            scanData: data,
          })
          return
        }

        let matches = this.state.db.all(
          "SELECT fragments.fragment_id, fragments.peak_id, \
          fragments.display_name, fragments.mz, \
          fragments.ion_type, fragments.ion_pos \
          FROM fragments inner JOIN scan_ptms \
          ON fragments.scan_ptm_id=scan_ptms.scan_ptm_id \
          WHERE scan_ptms.scan_id=? AND scan_ptms.ptm_id=? AND fragments.best=1",
          [
            this.state.selectedScan,
            this.state.selectedPTM,
          ],
          function(err, rows) {
            if (err != null) { console.error(err) }

            rows.forEach(function (row) {
              let peak = data[row.peak_id]
              peak.fragId = row.fragment_id
              peak.name = row.display_name
              peak.exp_mz = row.mz
              peak.ionType = row.ion_type
              peak.ionPos = row.ion_pos
            })

            this.setState({
              scanData: data,
            })
          }.bind(this),
        )

      }.bind(this)
    )
  }

  updateAll(nodes) {
    while (nodes.length < 4) { nodes.push(null) }

    this.setState({
      selectedProtein: nodes[0],
      selectedPeptide: nodes[1],
      selectedScan: nodes[2],
      selectedPTM: nodes[3],
    })
  }

  redrawCharts() {
    this.refs["fragmentSpectrum"].drawChart()
    this.refs["precursorSpectrum"].drawChart()
    this.refs["quantSpectrum"].drawChart()
  }

  updateselectedPeakMz(mz) {
    if (
      this.state.selectedPTM == null ||
      this.state.scanData == null
    ) {
      return
    }

    let peak = this.state.scanData.find(
      peak => peak.mz === mz
    )

    this.updateSelectedPeak(peak)
  }

  updateSelectedPeak(peak) {
    if (this.state.selectedPTM == null) {
      return
    }

    this.setState({
      selectedPeak: peak,
      modalFragmentSelectionOpen: true,
      fragmentMatches: matches,
    })

    this.state.db.all(
      "SELECT (mz, name) \
      FROM fragments INNER JOIN scan_ptms \
      ON fragments.scan_ptm_id=scan_ptms.scan_ptm_id \
      WHERE scan_ptms.scan_id=? AND scan_ptms.ptm_id=? AND peak_id=?",
      [
        this.state.selectedScan,
        this.state.selectedPTM,
        peak.peak_id,
      ],
      function (err, rows) {
        let matches = rows.filter(
          (item) => {
            item.ppm = 1e6 * Math.abs(item.mz - peak.mz) / peak.mz
            return item.ppm < this.state.maxPPM
          }
        )

        this.setState({
          fragmentMatches: matches,
        })
      }.bind(this),
    )
  }

  closeFragmentSelectionModal() {
    this.setState({
      modalFragmentSelectionOpen: false,
      fragmentMatches: [],
      selectedPeak: null,
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

  updateSelectedFragment(peak, fragId) {
    if (
      this.state.selectedProtein == null ||
      this.state.selectedPeptide == null ||
      this.state.selectedScan == null
    ) {
        return
    }

    this.state.db.serialize(function() {
      this.state.db.run(
        "UPDATE fragments \
        SET fragments.best=0 \
        WHERE fragments.peak_id=? AND scan_ptm_id IN ( \
          SELECT scan_ptms.scan_ptm_id \
          FROM scan_ptms \
          WHERE scan_ptms.scan_id=? AND scan_ptms.ptm_id=? \
        )",
        [
          peak.peak_id,
          this.state.selectedScan,
          this.state.selectedPTM,
        ],
      )
      this.state.db.run(
        "UPDATE fragments \
        SET best=1 \
        WHERE frag_id=?",
        [
          fragId,
        ],
        function(err) {
          if (err != null) { console.error(err) }
          this.updateScanData()
        }.bind(this)
      )
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

    for (let proteins of this.state.nodeTree) {
      for (let peptide of protein.children) {
        for (let scan of peptide.children) {
          for (let ptm of scan.children) {
            let state = ptm.choice

            if (
              (state == "accept" && !export_spectras[0]) ||
              (state == "maybe" && !export_spectras[1]) ||
              (state == "reject" && !export_spectras[2]) ||
              (state == null && !export_spectras[3])
            ) {
              continue
            }

            let nodes = [
              protein.nodeId,
              peptide.nodeId,
              scan.nodeId,
              match.nodeId,
            ]

            yield [
              nodes,
              protein.name,
              ptm.name,
              scan.name.split(" ")[1],
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

    // TODO Search lookup
    for (let protein of this.state.nodeTree) {
      if (
        proteinMatch != '' &&
        protein.name.toLowerCase().includes(proteinMatch.toLowerCase())
      ) {
        this.updateAll([protein.nodeId, 0, 0, 0])
        return
      }

      for (let peptide of protein.children) {
        if (
          peptideMatch != '' &&
          peptide.name.includes(peptideMatch.toUpperCase())
        ) {
          this.updateAll([protein.nodeId, peptide.nodeId, 0, 0])
          return
        }

        for (let scan of peptide.children) {
          if (
            scanMatch != '' &&
            String(scan.name.split(" ")[1]) == scanMatch
          ) {
            this.updateAll([protein.nodeId, peptide.nodeId, scan.nodeId, 0])
            return
          }

          for (let ptm of scan.children) {
            if (
              peptideMatch != '' &&
              ptm.name.includes(peptideMatch)
            ) {
              this.updateAll([
                protein.nodeId,
                peptide.nodeId,
                scan.nodeId,
                ptm.nodeId,
              ])
              return
            }
          }
        }
      }
    }
  }

  setChoice(choice) {
    if (
      this.state.selectedScan != null &&
      this.state.selectedPTM != null
    ) {
      console.log(this.state.selectedPTM, this.state.selectedScan, choice)
      this.state.db.run(
        "UPDATE scan_ptms \
        SET choice=? \
        WHERE scan_id=? AND ptm_id=?",
        [
          choice,
          this.state.selectedScan,
          this.state.selectedPTM
        ],
        function (err) {
          console.log('done!')
          if (err != null) { console.error(err) }
          this.buildNodeTree()
        }.bind(this),
      )
    }
  }

  openImport() {
    this.setState({
      modalImportOpen: true,
    })
  }

  runImport(data, fileName) {
    this.setState({
      db: data,
      loaded: true,
      modalImportOpen: false,
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

  buildNodeTree() {
    this.state.db.all(
      "SELECT \
      proteins.protein_id, proteins.protein_name, \
      peptides.peptide_id, peptides.peptide_seq, \
      mod_states.mod_state_id, mod_states.mod_desc, \
      scans.scan_id, scans.scan_num, \
      ptms.ptm_id, ptms.name, \
      scan_ptms.choice \
      \
      FROM \
      proteins inner join protein_peptide \
      ON proteins.protein_id=protein_peptide.protein_id \
      join peptides \
      ON protein_peptide.peptide_id=peptides.peptide_id \
      join mod_states \
      ON mod_states.peptide_id=peptides.peptide_id \
      join ptms \
      on ptms.mod_state_id=mod_states.mod_state_id \
      join scan_ptms \
      on scan_ptms.ptm_id=ptms.ptm_id \
      inner join scans \
      on scan_ptms.scan_id=scans.scan_id \
      ORDER BY proteins.protein_name, peptides.peptide_seq, mod_states.mod_desc, scans.scan_num, ptms.name",
      // TODO Fix ordering
      function (err, rows) {
        if (err != null) { console.error(err) }
        let proteins = []
        let peptides = []
        let scans = []
        let ptms = []
        let last_row = null

        for (let row of rows) {
          last_row = row
          break
        }

        for (let row of rows) {
          if (row.protein_id != last_row.protein_id) {
            proteins.push({
              name: last_row.protein_name,
              nodeId: last_row.protein_id,
              children: peptides,
            })
            peptides = []
          }

          if (
            row.peptide_id != last_row.peptide_id &&
            row.mod_state_id != last_row.mod_state_id
          ) {
            peptides.push({
              name: last_row.peptide_seq + " " + last_row.mod_desc,
              nodeId: last_row.peptide_id,
              overrideKey: [last_row.peptide_id, last_row.mod_state_id],
              children: scans,
            })
            scans = []
          }

          if (row.scan_num != last_row.scan_num) {
            scans.push({
              name: "Scan " + last_row.scan_num,
              nodeId: last_row.scan_id,
              children: ptms,
            })
            ptms = []
          }

          if (row.ptm_id != last_row.ptm_id) {
            ptms.push({
              name: last_row.name,
              nodeId: last_row.ptm_id,
              choice: last_row.choice,
            })
          }

          last_row = row
        }

        proteins.push({
          name: last_row.protein_name,
          nodeId: last_row.protein_id,
          children: peptides,
        })

        this.setState({
          nodeTree: proteins,
        })
      }.bind(this)
    )
  }

  getSelectedNode() {
    return [
      this.state.selectedProtein,
      this.state.selectedPeptide,
      this.state.selectedScan,
      this.state.selectedPTM,
    ]
  }

  updateProtein() {
    this.state.db.all(
      "SELECT \
      proteins.protein_id, proteins.protein_name \
      \
      FROM proteins \
      WHERE proteins.protein_id=? \
      ORDER BY proteins.protein_name",
      [
        this.state.selectedProtein,
      ],
      function(err, rows) {
        if (err != null) { console.error(err) }
        this.setState({
          proteins: rows,
        })
      }.bind(this),
    )
  }

  updatePeptide() {
    this.state.db.get(
      "SELECT peptides.peptide_id, peptides.peptide_seq \
      FROM peptides \
      WHERE peptides.peptide_id=?",
      [
        this.state.selectedPeptide,
      ],
      function(err, row) {
        if (err != null) { console.error(err) }
        this.setState({
          peptide: row,
        })
      }.bind(this),
    )
  }

  updateScan() {
    this.state.db.get(
      "SELECT \
      scans.scan_num AS scanNumber, \
      scans.charge AS chargeState, \
      scans.collision_type AS collisionType, \
      scans.precursor_mz AS precursorMz, \
      scans.isolation_window_lower, \
      scans.isolation_window_upper, \
      scans.quant_mz_id, \
      scans.c13_num as c13Num, \
      files.filename AS fileName \
      FROM scans INNER JOIN files \
      ON scans.file_id=files.file_id \
      WHERE scans.scan_id=?",
      [
        this.state.selectedScan,
      ],
      function(err, row) {
        if (err != null) { console.error(err) }
        row.precursorIsolationWindow = [
          row.isolation_window_lower,
          row.isolation_window_upper,
        ]
        this.setState({
          scan: row,
        })

        this.state.db.all(
          "SELECT \
          quant_mz_peaks.mz, \
          quant_mz_peaks.peak_name AS name \
          FROM quant_mz_peaks \
          WHERE quant_mz_id=? \
          ORDER BY quant_mz_peaks.mz",
          [
            row.quant_mz_id,
          ],
          function(err, rows) {
            if (err != null) { console.error(err) }

            this.setState({
              quantMz: rows,
            })
          }.bind(this)
        )
      }.bind(this),
    )
    this.state.db.get(
      "SELECT data_blob \
      FROM scan_data \
      WHERE scan_data.data_type=? AND scan_data.scan_id=?",
      [
        "precursor",
        this.state.selectedScan,
      ],
      function(err, row) {
        if (err != null) { console.error(err) }
        this.setState({
          precursorData: this.blob_to_peaks(row.data_blob),
        })
      }.bind(this),
    )
    this.state.db.get(
      "SELECT data_blob \
      FROM scan_data \
      WHERE scan_data.data_type=? AND scan_data.scan_id=?",
      [
        "quant",
        this.state.selectedScan,
      ],
      function(err, row) {
        if (err != null) { console.error(err) }
        this.setState({
          quantData: this.blob_to_peaks(row.data_blob),
        })
      }.bind(this),
    )
  }

  updatePTM() {
    this.state.db.get(
      "SELECT * \
      FROM ptms \
      WHERE ptms.ptm_id=?",
      [
        this.state.selectedPTM,
      ],
      function(err, row) {
        if (err != null) { console.error(err) }
        this.setState({
          ptm: row,
        })
      }.bind(this),
    )
  }

  render() {
    let [proteins, peptide, scan, ptm] = [
      this.state.proteins,
      this.state.peptide,
      this.state.scan,
      this.state.ptm,
    ]

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
          peak={this.state.selectedPeak}
          fragmentMatches={this.state.fragmentMatches}
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
            tree={this.state.nodeTree}

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
              (scan != null && proteins != null) &&
              <div
                id="scanDataContainer"
              >
                <ScanDataBox
                  protName={proteins}
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
                  spectrumData={this.state.scanData}
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
                  spectrumData={this.state.precursorData}
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
                  spectrumData={this.state.quantData}
                  quantMz={this.state.quantMz}
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
                spectrumData={this.state.scanData}
                collisionType={scan != null ? scan.collisionType : null}
                inputDisabled={ptm == null}

                selectedScan={this.state.selectedScan}
                selectedPTM={this.state.selectedPTM}

                updateChoice={this.setChoice.bind(this)}
                pointChosenCallback={this.updateselectedPeakMz.bind(this)}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = ViewBox

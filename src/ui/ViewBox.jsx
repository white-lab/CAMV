import React from 'react'
import { findDOMNode } from 'react-dom'
import { HotKeys } from 'react-hotkeys'
import { Button } from 'react-bootstrap'

import fs from 'fs'
import path from 'path'
import sqlite3 from 'sqlite3'

import { remote, dialog } from 'electron'

import ModalExportBox from './ModalBoxes/ModalExportBox'
import ModalImportBox from './ModalBoxes/ModalImportBox'
import ModalSearchBox from './ModalBoxes/ModalSearchBox'
import ModalFragmentBox from './ModalBoxes/ModalFragmentBox'
import ModalBYBox from './ModalBoxes/ModalBYBox'
import ModalProcessScanBox from './ModalBoxes/ModalProcessScanBox'

import SpectrumBox from './SpectrumBoxes/SpectrumBox'
import ChoiceBox from './SpectrumBoxes/ChoiceBox'
import PrecursorSpectrumBox from './SpectrumBoxes/PrecursorSpectrumBox'
import QuantSpectrumBox from './SpectrumBoxes/QuantSpectrumBox'

import ScanSelectionList from './ScanList/ScanSelectionList'

import ScanDataBox from './ScanInfo/ScanDataBox'
import SequenceBox from './ScanInfo/SequenceBox'

import { exportCSV } from '../io/csv.jsx'
import { spectraToImage } from '../io/spectra.jsx'


const autofocus = el => el && findDOMNode(el).focus();

const map = {
  'Open': 'ctrl+o',
  'Find': 'ctrl+f',
  'DevTools': 'ctrl+i',
  'Export': 'ctrl+e',
  "Accept": "a",
  "Maybe": "s",
  "Reject": "d",
  "runSearch": "enter",
  "selectLeft": 'left',
  "selectRight": 'right',
  "selectUp": ['up', 'k'],
  "selectDown": ['down', 'j'],
  "selectNext": ['n'],
  "selectPrevious": ['m', 'p'],
}



class ViewBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      /* Selected PTM / Scan / Peptide / Protein */
      selectedProteins: null,
      selectedPeptide: null,
      selectedModState: null,
      selectedScan: null,
      selectedPTM: null,

      proteins: null,
      peptide: null,
      scan: null,
      ptm: null,
      scanData: [],
      precursorData: [],
      quantData: [],
      ptmSet: false,

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
      modalProcessScan: false,

      loaded: false,
      exporting: false,

      /* Validation data */
      db: null,
      basename: null,
    }

    this.handlers = {
      "Find": this.toggleFinder.bind(this),
      "Open": this.toggleOpener.bind(this),
      "DevTools": this.toggleDevTools.bind(this),
      "Export": this.toggleExport.bind(this),
      "Accept": this.runAccept.bind(this),
      "Maybe": this.runMaybe.bind(this),
      "Reject": this.runReject.bind(this),
      "selectLeft": this.selectLeft.bind(this),
      "selectRight": this.selectRight.bind(this),
      "selectUp": this.selectUp.bind(this),
      "selectDown": this.selectDown.bind(this),
      "selectNext": this.selectNext.bind(this),
      "selectPrevious": this.selectPrevious.bind(this),
    }
  }

  toggleFinder() {
    if (this.state.loaded) {
      this.setState({modalSearchOpen: !this.state.modalSearchOpen})
    }
  }

  toggleOpener() {
    this.setState({modalImportOpen: !this.state.modalImportOpen})
  }

  toggleDevTools() {
    remote.getCurrentWindow().webContents.toggleDevTools()
  }

  toggleExport() {
    if (this.state.loaded) {
      this.setState({modalExportOpen: !this.state.modalExportOpen})
    }
  }

  runAccept() {
    if (this.state.loaded && !this.anyModalOpen()) {
      this.setChoice('accept')
    }
  }

  runMaybe() {
    if (this.state.loaded && !this.anyModalOpen()) {
      this.setChoice('maybe')
    }
  }

  runReject() {
    if (this.state.loaded && !this.anyModalOpen()) {
      this.setChoice('reject')
    }
  }

  selectLeft() {
    this.refs["scanSelectionList"].handleSelect('left')
  }

  selectRight() {
    this.refs["scanSelectionList"].handleSelect('right')
  }

  selectUp() {
    this.refs["scanSelectionList"].handleSelect('up')
  }

  selectDown() {
    this.refs["scanSelectionList"].handleSelect('down')
  }

  selectNext() {
    this.refs["scanSelectionList"].handleSelect('next')
  }

  selectPrevious() {
    this.refs["scanSelectionList"].handleSelect('previous')
  }

  anyModalOpen() {
    return [
      this.state.modalImportOpen,
      this.state.modalExportOpen,
      this.state.modalSearchOpen,
      this.state.modalFragmentSelectionOpen,
      this.state.modalBYOpen,
      this.state.modalProcessScan,
    ].some(i => i != false)
  }

  blob_to_peaks(blob) {
    let txt = new TextDecoder("utf-8").decode(blob)

    if (txt.length < 1) { return [] }

    return txt.split(";").map(
      (i, index) => {
        let [mz, intensity] = i.split(',')
        mz = parseFloat(mz)
        intensity = parseFloat(intensity)
        return {mz: mz, into: intensity, peak_id: index}
      }
    )
  }

  updateScanData() {
    if (this.state.selectedScan == null) { return }

    return this.wrapSQLGet(
      `SELECT scan_data.data_blob, scan_data.scan_id
      FROM scan_data
      WHERE scan_data.scan_id=? AND scan_data.data_type=?`,
      [
        this.state.selectedScan,
        "ms2",
      ],
      (resolve, reject, row) => {
        if (row.scan_id != this.state.selectedScan) {
          reject({errno: sqlite3.INTERRUPT})
          return
        }

        let data = this.blob_to_peaks(row.data_blob)

        this.setState({
          scanData: data,
          ptmSet: false,
        }, resolve)
      }
    )
  }

  updatePTMData() {
    if (this.state.selectedPTM == null) { return }

    /* Update peak assignments for the new PTM */
    return this.wrapSQLAll(
      `SELECT
      fragments.fragment_id,
      fragments.peak_id,
      fragments.display_name,
      fragments.mz,
      fragments.ion_type,
      fragments.ion_pos,
      scan_ptms.scan_id,
      scan_ptms.ptm_id

      FROM fragments inner JOIN scan_ptms
      ON fragments.scan_ptm_id=scan_ptms.scan_ptm_id

      WHERE scan_ptms.scan_id=? AND scan_ptms.ptm_id=? AND fragments.best=1`,
      [
        this.state.selectedScan,
        this.state.selectedPTM,
      ],
      (resolve, reject, rows) => {
        let data = this.state.scanData.map(
          (peak) => {
            return {
              mz: peak.mz,
              into: peak.into,
              peak_id: peak.peak_id,
            }
          }
        )

        rows.forEach((row) => {
          if (
            row.scan_id != this.state.selectedScan ||
            row.ptm_id != this.state.selectedPTM
          ) {
            reject({errno: sqlite3.INTERRUPT})
            return
          }

          let peak = data[row.peak_id]
          if (peak == null) { return }

          peak.fragId = row.fragment_id
          peak.name = row.display_name
          peak.exp_mz = row.mz
          peak.ionType = row.ion_type
          peak.ionPos = row.ion_pos
          peak.ppm = 1e6 * Math.abs(peak.mz - row.mz) / row.mz
        })

        this.setState({
          scanData: data,
          ptmSet: true,
        }, resolve)
      },
    )
  }

  updateAll(nodes) {
    nodes = nodes.slice()

    this.state.db.interrupt()
    let prev_nodes = this.getSelectedNode()

    while (nodes.length < 4) { nodes.push([null, null]) }
    while (prev_nodes.length < 4) { prev_nodes.push([null, null]) }

    return new Promise((resolve) => {
      this.setState(
        {
          selectedProteins: nodes[0][0],
          selectedPeptide: nodes[1][0],
          selectedModState: nodes[1][1],
          selectedScan: nodes[2][0],
          selectedPTM: nodes[3][0],
        },
        resolve,
      )
    }).then(() => {
      let promises = []

      if (
        nodes[0][0] != null &&
        nodes[0] != prev_nodes[0]
      ) {
        promises.push(this.updateProtein())
      }
      if (
        nodes[1][0] != null &&
        nodes[1][1] != null &&
        nodes[1] != prev_nodes[1]
      ) {
        promises.push(this.updatePeptide())
      }
      if (
        nodes[2][0] != null &&
        nodes[2][0] != prev_nodes[2][0]
      ) {
        promises.push(this.updateScan())
      }

      if ((
        nodes[2][0] != null &&
        nodes[2][0] != prev_nodes[2][0]
      ) || (
        nodes[3][0] == null &&
        prev_nodes[3][0] != null
      )) {
        promises.push(this.updateScanData())
      }
      if (
        nodes[3][0] != null &&
        (
          nodes[2][0] != prev_nodes[2][0] ||
          nodes[3][0] != prev_nodes[3][0]
        )
      ) {
        promises.push(this.updatePTM())
      }

      return Promise.all(promises)
    }).catch((err) => {
      if (err != null && err.errno != sqlite3.INTERRUPT) {
        console.error(err)
      }
    }).then(() => {
      let promises = []

      if (
        nodes[3][0] != null &&
        (
          nodes[2][0] != prev_nodes[2][0] ||
          nodes[3][0] != prev_nodes[3][0]
        )
      ) {
        promises.push(this.updatePTMData())
      }

      return Promise.all(promises)
    }).catch((err) => {
      if (err != null && err.errno != sqlite3.INTERRUPT) {
        console.error(err)
      }
    })
  }

  selectedPrecursorMz(peak) {
    if (
      this.state.selectedPTM == null ||
      this.state.scanData == null
    ) {
      return
    }

    this.setState({
      selectedPeak: peak,
      modalFragmentSelectionOpen: true,
    })
  }

  selectedQuantMz(peak) {
    if (
      this.state.selectedPTM == null ||
      this.state.scanData == null
    ) {
      return
    }

    this.setState({
      selectedPeak: peak,
      modalFragmentSelectionOpen: true,
    })
  }

  handleSQLError(error) {
    if (error == null) {
      return
    } else if (error.errno == sqlite3.INTERRUPT) {
      console.log("interrupted")
      // this.state.db.interrupt()
    } else {
      console.error(error)
    }
  }

  updatePeak(peak) {
    if (
      this.state.selectedPTM == null ||
      this.state.scanData == null
    ) {
      return
    }

    this.setState({
      selectedPeak: peak,
      modalFragmentSelectionOpen: true,
    })

    return this.wrapSQLAll(
      `SELECT
      fragments.fragment_id,
      fragments.mz,
      fragments.display_name AS name

      FROM scan_ptms
      INNER JOIN fragments
      ON fragments.scan_ptm_id=scan_ptms.scan_ptm_id

      WHERE scan_ptms.scan_id=? AND
      scan_ptms.ptm_id=? AND
      fragments.peak_id=?`,
      [
        this.state.selectedScan,
        this.state.selectedPTM,
        peak.peak_id,
      ],
      (resolve, reject, rows) => {
        let matches = rows.filter(
          (item) => {
            item.ppm = 1e6 * Math.abs(item.mz - peak.mz) / peak.mz
            return item.ppm < this.state.maxPPM
          }
        )

        this.setState({
          fragmentMatches: matches,
        }, resolve)
      },
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

  openBYModal(peak) {
    this.setState({
      modalBYOpen: false,
    })
    this.updatePeak(peak)
  }

  closeBYModal() {
    this.setState({
      modalBYOpen: false,
    })
  }

  openProcessScan() {
    this.refs["modalProcessScanBox"].refreshPaths()

    this.setState({
      modalProcessScan: true,
    })
  }

  closeProcessScan(reprocessed) {
    this.setState({
      modalProcessScan: false,
    })


    if (reprocessed) {
      this.refs["scanSelectionList"].refresh(this.getSelectedNode(), 2)
      this.updateScan()
    }
  }

  updateSelectedFragment(peak, fragId) {
    if (
      this.state.selectedProteins == null ||
      this.state.selectedPeptide == null ||
      this.state.selectedScan == null ||
      this.state.selectedPTM == null
    ) {
        return
    }

    return this.unsetFragmentLabel(peak, false).then(() => {
      return this.wrapSQLRun(
        `UPDATE fragments
        SET best=1
        WHERE fragments.fragment_id=?`,
        [
          fragId,
        ],
      )
    }).then(() => {
      return this.updatePTMData()
    })
  }

  newFragmentLabel(peak, label) {
    if (
      this.state.selectedProteins == null ||
      this.state.selectedPeptide == null ||
      this.state.selectedScan == null ||
      this.state.selectedPTM == null
    ) {
        return
    }

    return this.unsetFragmentLabel(peak, false).then(() => {
      return this.wrapSQLGet(
        `SELECT scan_ptms.scan_ptm_id
        FROM scan_ptms
        WHERE scan_ptms.scan_id=? AND scan_ptms.ptm_id=?`,
        [
          this.state.selectedScan,
          this.state.selectedPTM,
        ],
        (resolve_a, reject_a, row) => {
          this.wrapSQLRun(
            `INSERT INTO fragments (
              scan_ptm_id,
              peak_id,
              name,
              display_name,
              mz,
              intensity,
              best
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              row.scan_ptm_id,
              peak.peak_id,
              label,
              label,
              peak.mz,
              peak.into,
              1,
            ],
            (resolve_b, reject_b) => {
              resolve_a()
              resolve_b()
            },
          )
        },
      )
    }).then(() => {
      return this.updatePTMData()
    })
  }

  unsetFragmentLabel(peak, refresh) {
    if (
      this.state.selectedProteins == null ||
      this.state.selectedPeptide == null ||
      this.state.selectedScan == null ||
      this.state.selectedPTM == null
    ) {
        return
    }

    return this.wrapSQLRun(
      `UPDATE fragments
      SET best=0
      WHERE fragments.peak_id=? AND scan_ptm_id IN (
        SELECT scan_ptms.scan_ptm_id
        FROM scan_ptms
        WHERE scan_ptms.scan_id=? AND scan_ptms.ptm_id=?
      )`,
      [
        peak.peak_id,
        this.state.selectedScan,
        this.state.selectedPTM,
      ],
    ).then(() => {
      if (refresh == null || refresh) {
        return this.updatePTMData()
      }
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

  async iterate_spectra(export_spectras, cb) {
    while (export_spectras.length < 4) {
      export_spectras.push(false)
    }

    if (export_spectras.every(i => !i)) {
      cb_done()
      return
    }

    let promises = []
    let params = []

    if (export_spectras[0]) { params.push("accept") }
    if (export_spectras[1]) { params.push("maybe") }
    if (export_spectras[2]) { params.push("reject") }

    return new Promise(
      (final_resolve, final_reject) => {
        this.state.db.all(
          `SELECT
          protein_sets.protein_set_id, protein_sets.protein_set_name,
          protein_sets.protein_set_accession, protein_sets.protein_set_uniprot,
          peptides.peptide_id, peptides.peptide_seq,
          peptides.protein_set_offsets,
          mod_states.mod_state_id, mod_states.mod_desc,
          scans.scan_id, scans.scan_num,
          scan_ptms.ptm_id, scan_ptms.choice, scan_ptms.mascot_score,
          ptms.name

          FROM scan_ptms

          INNER JOIN scans
          ON scan_ptms.scan_id=scans.scan_id

          JOIN ptms
          ON scan_ptms.ptm_id=ptms.ptm_id

          JOIN mod_states
          ON ptms.mod_state_id=mod_states.mod_state_id

          JOIN peptides
          ON mod_states.peptide_id=peptides.peptide_id

          INNER JOIN protein_sets
          ON protein_sets.protein_set_id=peptides.protein_set_id

          WHERE
          scan_ptms.choice IN (${params.map(i => '?').join(', ')})
          ${export_spectras[3] ? 'OR scan_ptms.choice IS NULL': ''}

          ORDER BY
          protein_sets.protein_set_name, peptides.peptide_seq,
          mod_states.mod_desc, ptms.name`,
          params,
          async function(err, rows) {
            if (err != null || rows == null) {
              console.error(err)
              final_reject()
              return
            }

            for (let row of rows) {
              let nodes = [
                [row.protein_set_id],
                [row.peptide_id, row.mod_state_id],
                [row.scan_id],
                [row.ptm_id],
              ]

              row.protein_set_offsets = row.protein_set_offsets.split(";")
                .map(i => parseInt(i))

              await new Promise(resolve => cb(nodes, row, resolve))
            }

            final_resolve()
          },
        )
      },
    )
  }

  runExport(dirName, export_spectras, exportTables) {
    this.setState({
      modalExportOpen: false,
    })

    if (!export_spectras.some(i => i)) {
      return
    }

    spectraToImage(
      this, 
      dirName, 
      export_spectras, 
      this.refs['modalExportBox'].state.exportWidth,
      this.refs['modalExportBox'].state.exportHeight,
    )
  }

  async getBase(node) {
    let sl = this.refs["scanSelectionList"]
    let indices = await sl.getIndices(node)
    while (indices.length < 4) { indices.push(0) }
    return await sl.getNode(indices)
  }

  runSearch(proteinMatch, peptideMatch, scanMatch) {
    this.setState({
      modalSearchOpen: false,
    })

    let promises = []
    let hits = []

    if (proteinMatch.length > 0) {
      promises.push(
        this.wrapSQLAll(
          `SELECT protein_sets.protein_set_id

          FROM protein_sets
          WHERE protein_sets.protein_set_name LIKE ? COLLATE NOCASE OR
          protein_sets.protein_set_accession LIKE ? COLLATE NOCASE`,
          [
            `%${proteinMatch}%`,
            `%${proteinMatch}%`,
          ],
          (resolve, reject, rows) => {
            hits = hits.concat(
              rows.map(
                i =>
                `${i.protein_set_id}`
              )
            )
            resolve()
          }
        )
      )
    }

    if (peptideMatch.length > 0) {
      promises.push(
        this.wrapSQLAll(
          //
          `SELECT protein_sets.protein_set_id,
          peptides.peptide_id,
          mod_states.mod_state_id

          FROM mod_states

          JOIN peptides
          ON mod_states.peptide_id=peptides.peptide_id

          INNER JOIN protein_sets
          ON protein_sets.protein_set_id=peptides.protein_set_id

          WHERE peptides.peptide_seq LIKE ? COLLATE NOCASE`,
          [
            `%${peptideMatch}%`,
          ],
          (resolve, reject, rows) => {
            hits = hits.concat(
              rows.map(
                i =>
                `${i.protein_set_id}-${i.peptide_id},${i.mod_state_id}`
              )
            )
            resolve()
          }
        )
      )
    }

    if (scanMatch.length > 0) {
      promises.push(
        this.wrapSQLAll(
          `SELECT protein_sets.protein_set_id,
          peptides.peptide_id,
          mod_states.mod_state_id,
          scans.scan_id

          FROM scan_ptms

          INNER JOIN scans
          ON scan_ptms.scan_id=scans.scan_id

          JOIN ptms
          ON scan_ptms.ptm_id=ptms.ptm_id

          JOIN mod_states
          ON ptms.mod_state_id=mod_states.mod_state_id

          JOIN peptides
          ON mod_states.peptide_id=peptides.peptide_id

          INNER JOIN protein_sets
          ON protein_sets.protein_set_id=peptides.protein_set_id

          WHERE scans.scan_num LIKE ? COLLATE NOCASE`,
          [
            `%${scanMatch}%`,
          ],
          (resolve, reject, rows) => {
            hits = hits.concat(
              rows.map(
                i =>
                `${i.protein_set_id}-${i.peptide_id},${i.mod_state_id}-${i.scan_id}`
              )
            )
            resolve()
          }
        )
      )
    }

    Promise.all(promises).then(async function() {
      // XXX: Show modal of all hits?
      if (hits.length > 0) {
        let node = hits[0].split("-").map(j => j.split(","))
        this.updateAll(await this.getBase(node))
      }
    }.bind(this))
  }

  setChoice(choice) {
    if (
      this.state.selectedScan == null ||
      this.state.selectedPTM == null
    ) { return }

    return this.wrapSQLRun(
      `UPDATE scan_ptms
      SET choice=?
      WHERE scan_id=? AND ptm_id=?`,
      [
        choice,
        this.state.selectedScan,
        this.state.selectedPTM
      ],
    ).then(() => {
      this.refs["scanSelectionList"].refresh(this.getSelectedNode(), 1)
    })
  }

  openImport() {
    this.setState({
      modalImportOpen: true,
    })
  }

  runImport(data, fileName) {
    console.log(data)
    this.setState({
      db: data,
      loaded: true,
      modalImportOpen: false,

      selectedProteins: null,
      selectedPeptide: null,
      selectedModState: null,
      selectedScan: null,
      selectedPTM: null,

      proteins: null,
      peptide: null,
      scan: null,
      ptm: null,
      scanData: [],
      precursorData: [],
      quantData: [],

      selectedPeak: null,
      fragmentMatches: [],
      maxPPM: 100,  /* Max window for fragments that can be candidates */
      bIons: [],
      yIons: [],
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

  getSelectedNode() {
    return [
      [this.state.selectedProteins],
      [this.state.selectedPeptide, this.state.selectedModState],
      [this.state.selectedScan],
      [this.state.selectedPTM],
    ].filter(i => i != null && i.filter(i => i != null).length > 0)
  }

  updateProtein() {
    return this.wrapSQLGet(
      `SELECT
      protein_sets.protein_set_id,
      protein_sets.protein_set_name AS proteinName,
      protein_sets.protein_set_accession AS accessions

      FROM protein_sets
      WHERE protein_sets.protein_set_id=?`,
      [
        this.state.selectedProteins,
      ],
      (resolve, reject, row) => {
        if (row.protein_set_id != this.state.selectedProteins) {
          reject({errno: sqlite3.INTERRUPT})
          return
        }
        this.setState({
          proteins: row,
        }, resolve)
      },
    )
  }

  updatePeptide() {
    return this.wrapSQLGet(
      `SELECT peptides.peptide_id, peptides.peptide_seq
      FROM peptides
      WHERE peptides.peptide_id=?`,
      [
        this.state.selectedPeptide,
      ],
      (resolve, reject, row) => {
        if (row.peptide_id != this.state.selectedPeptide) {
          reject({errno: sqlite3.INTERRUPT})
          return
        }
        this.setState({
          peptide: row,
        }, resolve)
      },
    )
  }

  wrapSQLGet(query, params, cb) {
    return new Promise((resolve, reject) => {
      this.state.db.get(
        query,
        params,
        (err, ret) => {
          if (err != null || ret == null) {
            this.handleSQLError(err)
            this.state.db.interrupt()
            reject()
            return
          }

          if (cb != null) {
            cb(resolve, reject, ret)
          } else {
            resolve()
          }
        }
      )
    })
  }

  wrapSQLRun(query, params, cb) {
    return new Promise((resolve, reject) => {
      this.state.db.run(
        query,
        params,
        (err) => {
          if (err != null) {
            this.handleSQLError(err)
            this.state.db.interrupt()
            reject()
            return
          }

          if (cb != null) {
            cb(resolve, reject)
          } else {
            resolve()
          }
        }
      )
    })
  }

  wrapSQLAll(query, params, cb) {
    return new Promise((resolve, reject) => {
      this.state.db.all(
        query,
        params,
        (err, ret) => {
          if (err != null || ret == null) {
            this.handleSQLError(err)
            this.state.db.interrupt()
            reject()
            return
          }

          if (cb != null) {
            cb(resolve, reject, ret)
          } else {
            resolve()
          }
        }
      )
    })
  }

  updateScan() {
    let promises = []

    promises.push(
      this.wrapSQLGet(
        `SELECT
        scans.scan_id,
        scans.scan_num AS scanNumber,
        scans.charge AS chargeState,
        scans.collision_type AS collisionType,
        scans.precursor_mz AS precursorMz,
        scans.isolation_window_lower,
        scans.isolation_window_upper,
        scans.quant_mz_id,
        scans.c13_num AS c13Num,
        scans.truncated,
        scan_ptms.mascot_score AS searchScore,
        files.filename AS fileName

        FROM scans INNER JOIN files
        ON scans.file_id=files.file_id

        INNER JOIN scan_ptms
        ON scan_ptms.scan_id=scans.scan_id

        WHERE scans.scan_id=?`,
        [
          this.state.selectedScan,
        ],
        (resolve, reject, row) => {
          if (row.scan_id != this.state.selectedScan) {
            reject({errno: sqlite3.INTERRUPT})
            return
          }
          row.precursorIsolationWindow = [
            row.isolation_window_lower,
            row.isolation_window_upper,
          ]
          this.setState({
            scan: row,
          }, resolve)
        },
      ).then(() => {
        return this.wrapSQLGet(
          `SELECT scan_data.data_blob, scan_data.scan_id
          FROM scan_data
          WHERE scan_data.data_type=? AND scan_data.scan_id=?`,
          [
            "precursor",
            this.state.selectedScan,
          ],
          (resolve, reject, row) => {
            if (row.scan_id != this.state.selectedScan) {
              reject({errno: sqlite3.INTERRUPT})
              return
            }

            let peaks = this.blob_to_peaks(row.data_blob)

            let ionSeries = []

            for (let i = -this.state.scan.c13Num; i <= 5; i++) {
              ionSeries.push(i)
            }

            let scan = this.state.scan

            ionSeries.forEach(
              (val) => {
                let exp_mz = (scan.precursorMz + 1.003355 * val / scan.chargeState)
                let errs = peaks.map(
                  peak => 1e6 * Math.abs(peak.mz - exp_mz) / peak.mz
                )

                if (errs.every(val => val > this.state.maxPPM || isNaN(val)))
                  return

                let ppm = Math.min.apply(Math, errs)
                let peak = peaks[errs.indexOf(ppm)]
                peak.ppm = ppm
                peak.exp_mz = exp_mz
                peak.name = (
                  "MH^{+" +
                  (scan.chargeState > 1 ? scan.chargeState : "") +
                  "}" +
                  (val > -scan.c13Num ? " + " + (val + scan.c13Num) + " ¹³C" : "")
                )
              }
            )

            this.setState({
              precursorData: peaks,
            }, resolve)
          },
        )
      })
    )

    promises.push(
      this.wrapSQLGet(
        `SELECT scan_data.data_blob, scan_data.scan_id
        FROM scan_data
        WHERE scan_data.data_type=? AND scan_data.scan_id=?`,
        [
          "quant",
          this.state.selectedScan,
        ],
        (resolve, reject, row) => {
          if (row.scan_id != this.state.selectedScan) {
            reject({errno: sqlite3.INTERRUPT})
            return
          }
          this.setState({
            quantData: this.blob_to_peaks(row.data_blob),
          }, resolve)
        },
      ).then(() => {
        return this.wrapSQLAll(
          `SELECT
          quant_mz_peaks.mz,
          quant_mz_peaks.peak_name AS name,
          scans.scan_id

          FROM scans
          INNER JOIN quant_mz_peaks
          ON scans.quant_mz_id=quant_mz_peaks.quant_mz_id

          WHERE scans.scan_id=?

          ORDER BY quant_mz_peaks.mz`,
          [
            this.state.selectedScan,
          ],
          (resolve, reject, rows) => {
            let data = this.state.quantData.map(peak => Object.assign({}, peak))

            rows.forEach((row) => {
              if (row.scan_id != this.state.selectedScan) {
                reject({errno: sqlite3.INTERRUPT})
                return
              }

              let errs = data.map(
                (peak) => {
                  return 1e6 * Math.abs(peak.mz - row.mz) / row.mz
                }
              )

              if (errs.every(val => val > this.state.maxPPM))
                return

              let min_err = Math.min.apply(Math, errs)
              let peak = data[errs.indexOf(min_err)]

              if (peak == null) { return }

              peak = {mz: peak.mz, into: peak.into, peak_id: peak.peak_id}

              peak.name = row.name
              peak.exp_mz = row.mz
              peak.ppm = min_err
              data[peak.peak_id] = peak
            })

            this.setState({
              quantData: data,
            }, resolve)
          },
        )
      })
    )

    return Promise.all(promises)
  }

  updatePTM() {
    return this.wrapSQLGet(
      `SELECT *
      FROM ptms
      WHERE ptms.ptm_id=?`,
      [
        this.state.selectedPTM,
      ],
      (resolve, reject, row) => {
        if (row.ptm_id != this.state.selectedPTM) {
          reject({errno: sqlite3.INTERRUPT})
          return
        }
        this.setState({
          ptm: row,
        }, resolve)
      },
    )
  }

  render() {
    return (
      <HotKeys keyMap={map} handlers={this.handlers} ref={autofocus}>
        <div
          className="panel panel-default"
          id="viewBox"
          style={{
            margin: this.state.exporting ? '0px' : '10px',
            height: this.state.exporting ? "calc(100% - 4px)" : "calc(100% - 30px)",
            width: this.state.exporting ? "calc(100% - 4px)" : "calc(100% - 20px)",
          }}
        >
          <ModalImportBox
            ref="modalImportBox"
            showModal={this.state.modalImportOpen}
            importCallback={this.runImport.bind(this)}
            closeCallback={this.closeImportModal.bind(this)}
            database={this.state.db}
          />
          <ModalExportBox
            ref="modalExportBox"
            showModal={this.state.modalExportOpen}
            closeCallback={this.closeExportModal.bind(this)}
            exportCallback={this.runExport.bind(this)}
            viewbox={this}
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
            newLabelCallback={this.newFragmentLabel.bind(this)}
            noneCallback={this.unsetFragmentLabel.bind(this)}
            closeCallback={this.closeFragmentSelectionModal.bind(this)}
          />
          <ModalBYBox
            ref="modalBYBox"
            showModal={this.state.modalBYOpen}
            clickCallback={this.openBYModal.bind(this)}
            closeCallback={this.closeBYModal.bind(this)}
            bIons={this.state.bIons}
            yIons={this.state.yIons}
          />
          <ModalProcessScanBox
            ref="modalProcessScanBox"
            showModal={this.state.modalProcessScan}
            clickCallback={this.openProcessScan.bind(this)}
            closeCallback={this.closeProcessScan.bind(this)}
            scan={this.state.scan}
            db={this.state.db}
          />
          <div
            className="panel panel-default"
            id="scanSelectionList"
            style={{display: this.state.exporting ? 'none' : null}}
          >
            <ScanSelectionList
              ref="scanSelectionList"
              db={this.state.db}

              updateAllCallback={this.updateAll.bind(this)}

              selectedNode={this.getSelectedNode()}
            />
          </div>
          <div
            id="sequenceSpectraContainer"
          >
            <div
              className="panel panel-default"
              id="sequenceBox"
            >
              {
                (this.state.scan != null && this.state.proteins != null) &&
                <div
                  id="scanDataContainer"
                >
                  <ScanDataBox
                    proteins={this.state.proteins}
                    scan={this.state.scan}
                  />
                </div>
              }
              {
                (this.state.scan != null && this.state.ptm != null) &&
                <div
                  id="sequenceContainer"
                >
                  <SequenceBox
                    ptm={this.state.ptm}
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
                id="spectrumUpdateBox"
              >
                <div
                  id="fragmentSpectrumBox"
                  style={{height: this.state.exporting ? "100%" : "calc(100% - 40px)"}}
                >
                  <SpectrumBox
                    ref="fragmentSpectrum"
                    spectrumData={this.state.scanData}
                    collisionType={
                      this.state.scan != null ?
                      this.state.scan.collisionType : null
                    }
                    ptmSet={this.state.ptmSet}

                    pointChosenCallback={this.updatePeak.bind(this)}
                  />
                </div>
                <div
                  id="updateBox"
                  style={{display: this.state.exporting ? 'none' : null}}
                >
                  <ChoiceBox
                    inputDisabled={this.state.ptm == null}
                    updateChoice={this.setChoice.bind(this)}
                  />
                </div>
              </div>
              <div
                id="precursorQuantContainer"
              >
                <div
                  id="precursorSpectrumBox"
                  style={{
                    height: this.state.exporting ? "50%" : "calc(50% - 20px)",
                  }}
                >
                  <PrecursorSpectrumBox
                    ref="precursorSpectrum"
                    spectrumData={this.state.precursorData}
                    precursorMz={
                      this.state.scan != null ?
                      this.state.scan.precursorMz : null
                    }
                    isolationWindow={
                      this.state.scan != null ?
                      this.state.scan.precursorIsolationWindow : null
                    }
                    c13Num={
                      this.state.scan != null ?
                      this.state.scan.c13Num : 0
                    }
                    chargeState={
                      this.state.scan != null ?
                      this.state.scan.chargeState : null
                    }
                    ppm={50}

                    pointChosenCallback={this.selectedPrecursorMz.bind(this)}
                  />
                </div>
                <div
                  id="quantSpectrumBox"
                  style={{
                    height: this.state.exporting ? "50%" : "calc(50% - 20px)",
                  }}
                >
                  <QuantSpectrumBox
                    ref="quantSpectrum"
                    spectrumData={this.state.quantData}
                    ppm={50}

                    pointChosenCallback={this.selectedQuantMz.bind(this)}
                  />
                </div>
                <div
                  id="exportSave"
                  style={{display: this.state.exporting ? 'none' : null}}
                >
                  {
                    this.state.scan != null && this.state.scan.truncated != 0 &&
                    <Button
                      id="openProcessScan"
                      onClick={this.openProcessScan.bind(this)}
                    >
                      Process
                    </Button>
                  }
                  <Button
                    id="openImport"
                    onClick={this.openImport.bind(this)}
                  >
                    Open
                  </Button>
                  <Button
                    id="openExport"
                    onClick={this.openExport.bind(this)}
                    disabled={!this.state.loaded}
                  >
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HotKeys>
    )
  }
}

module.exports = ViewBox

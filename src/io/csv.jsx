
import fs from 'fs'

import { remote } from 'electron'

exports.exportCSV = async function(vb, path) {
  // Export spectra as csv file
  let stream = fs.createWriteStream(path)

  let headers = [
    "Scan",
    "Protein",
    "Accession",
    "Sequence",
    "Modifications",
    "Score",
    "Status",
  ]

  let quant_channels = []

  await vb.wrapSQLAll(
    "SELECT \
    quant_mz_peaks.peak_name \
    \
    FROM quant_mz_peaks \
    \
    ORDER BY quant_mz_peaks.mz",
    [],
    (resolve, reject, rows) => {
      for (let row of rows) {
        headers.push(row.peak_name)
        quant_channels.push(row.peak_name)
      }
      resolve()
    }
  )

  await new Promise((resolve, reject) => {
    stream.write(
      headers.join(",") + "\n",
      (err) => {
        if (err != null) {
          remote.dialog.showErrorBox(
            "CSV Export Error",
            err.message,
          )
          reject()
        }

        resolve()
      }
    )
  })

  await vb.iterate_spectra(
    [true, true, true, true],
    async function (nodes, row, resolve) {
      let quant_peaks = []

      await vb.wrapSQLAll(
        "SELECT \
        fragments.name, \
        fragments.intensity \
        \
        FROM fragments INNER JOIN scan_ptms \
        ON scan_ptms.scan_ptm_id=fragments.scan_ptm_id \
        \
        INNER JOIN scans \
        ON scans.scan_id=scan_ptms.scan_id \
        \
        WHERE scans.scan_num=? AND fragments.name IN ( \
        " + new Array(quant_channels.length).fill("?").join(", ") +
        " ) \
        ORDER BY fragments.mz \
        ",
        [row.scan_num].concat(quant_channels),
        (resolve, reject, rows) => {
          quant_peaks = rows
          resolve()
        }
      )

      let row_data = quant_channels.map(
        channel => {
          let peak = quant_peaks.find(
            peak => peak.name == channel
          )
          return peak ? peak.intensity : ""
        }
      )

      stream.write(
        [
          row.scan_num,
          `"${row.protein_set_name.replace("\"", "\"\"")}"`,
          row.protein_set_accession,
          row.name,
          row.mod_desc,
          row.mascot_score,
          row.choice,
        ].concat(row_data).join(",") + "\n",
        (err) => {
          if (err != null) {
            remote.dialog.showErrorBox(
              "Spectra Export Error",
              err.message,
            )
          }

          resolve()
        }
      )
    },
  )
}

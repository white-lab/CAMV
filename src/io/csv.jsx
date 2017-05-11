
import fs from 'fs'

exports.exportCSV = function(vb, path) {
  // Export spectra as csv file
  let stream = fs.createWriteStream(path)

  stream.write(
    [
      "Scan",
      "Protein",
      "Accession",
      "Sequence",
      "Modifications",
      "Score",
      "Status",
    ].join(",") + "\n",
    (err) => {
      if (err != null) { console.error(err) ; return }

      vb.iterate_spectra(
        [true, true, true, true],
        (nodes, row, resolve) => {
          stream.write(
            [
              row.scan_num,
              `"${row.protein_set_name.replace("\"", "\"\"")}"`,
              row.protein_set_accession,
              row.name,
              row.mod_desc,
              row.mascot_score,
              row.choice,
            ].join(",") + "\n",
            (err) => {
              if (err != null) { console.error(err) }
              resolve()
            }
          )
        },
      )
    }
  )
}

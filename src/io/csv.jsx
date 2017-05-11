
import fs from 'fs'

exports.exportCSV = function(vb, path) {
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

  for (let vals of vb.iterate_spectra([true, true, true, true])) {
    let [nodes, prot, pep, scan, ptm, state] = vals;

      fs.writeFile(
        path,
        rows.join("\n"),
      )
    },
  )
}

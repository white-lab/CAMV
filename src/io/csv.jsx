
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
    path,
    rows.join("\n"),
    function () {}
  )
}

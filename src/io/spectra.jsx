
import fs from 'fs'
import path from 'path'

import domtoimage from 'dom-to-image'

const remote = require('electron').remote


function decodeBase64Image(dataString) {
  let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  let response = {}

  if (matches.length !== 3) {
    return new Error('Invalid input string')
  }

  response.type = matches[1]
  response.data = new Buffer(matches[2], 'base64')

  return response
}


exports.spectraToImage = async function(vb, dirName, export_spectras) {
  vb.setState({exporting: true})
  var win = remote.getCurrentWindow()
  var sizes = win.getBounds()
  var maximized = win.isMaximized()

  // win.setSize(800, 650)
  win.setSize(1188, 840)
  win.setResizable(false)
  win.closeDevTools()

  let scan_list = vb.refs["scanSelectionList"]
  let spectrum = vb.refs["fragmentSpectrum"]
  spectrum.setState({exporting: true})

  let current_node = vb.getSelectedNode()

  let promises = []

  for (let vals of vb.iterate_spectra(export_spectras)) {
    let [nodes, prot, pep, scan, score, state] = vals
    let out_name = `${prot.replace('/', '_')} - ${pep} - ${scan}`

    await vb.updateAll(nodes)

    // let dataUrl = await domtoimage.toSvg(
    let dataUrl = await domtoimage.toPng(
      document.getElementById('viewBox'),
      {
        width: 1157,
        height: 783,
        bgcolor: 'white',
        dpi: 600,
      },
    )
    promises.push(
      fs.writeFile(
        // path.join(dirName, out_name + ".svg"),
        // '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
        // dataUrl.slice("data:image/svg+xml;charset=utf-8,".length),
        path.join(dirName, out_name + ".png"),
        decodeBase64Image(dataUrl).data,
      )
    )
  }

  Promise.all(promises).then(() => {
    vb.setState({exporting: false})
    win.setResizable(true)

    if (maximized) {
      win.maximize()
    } else {
      win.setSize(sizes.width, sizes.height)
    }

    vb.updateAll(current_node)
    spectrum.setState({exporting: false})
  })
}

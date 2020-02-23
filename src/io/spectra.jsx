
import fs from 'fs'
import path from 'path'

import domtoimage from 'dom-to-image'
import { remote } from 'electron'


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


exports.spectraToImage = async function(vb, dirName, export_spectras, width, height) {
  vb.setState({exporting: true})
  var win = remote.getCurrentWindow()
  var sizes = win.getBounds()
  var maximized = win.isMaximized()

  win.setSize(width, height)
  win.setResizable(false)
  win.closeDevTools()

  let scan_list = vb.refs["scanSelectionList"]

  let current_node = vb.getSelectedNode()

  await vb.iterate_spectra(
    export_spectras,
    async function(nodes, row, resolve) {
      let name = Array.from(
        new Set(row.protein_set_name.split(' / '))
      ).sort().join(' _ ').replace(/[\/:]/g, '_')
      let out_name = `${name.slice(0, 150)} - ${row.name} - ${row.scan_num}`

      await vb.updateAll(nodes)

      // let dataUrl = await domtoimage.toSvg(
      let dataUrl = await domtoimage.toPng(
        document.getElementById('viewBox'),
        {
          width: width - 30,
          height: height - 50,
          bgcolor: 'white',
          dpi: 600,
        },
      )
      fs.writeFile(
        // path.join(dirName, out_name + ".svg"),
        // '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
        // dataUrl.slice("data:image/svg+xml;charset=utf-8,".length),
        path.join(dirName, out_name + ".png"),
        decodeBase64Image(dataUrl).data,
        (err) => {
          if (err != null) { console.error(err) }
          resolve()
        }
      )
    },
  )

  vb.setState({exporting: false})
  win.setResizable(true)

  if (maximized) {
    win.maximize()
  } else {
    win.setSize(sizes.width, sizes.height)
  }

  vb.updateAll(current_node)
}

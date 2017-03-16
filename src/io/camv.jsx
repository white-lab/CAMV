
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

const { dialog } = require('electron').remote

import JSONStream from 'JSONStream'

var pjson = require('../../package.json');


exports.loadCAMV = function(fileName, cb) {
  var compressed = fileName.endsWith(".gz");

  let data = fs.createReadStream(
    fileName,
    (compressed ? null : 'utf-8'),
  )
  if (compressed) {
    let gunzip = zlib.createGunzip()
    data = data.pipe(gunzip)
  }

  let parser = JSONStream.parse()
  data.pipe(parser)
  parser.on(
    'data',
    function(data) { console.log(data); if (cb != null) cb(data) },
  )
}

exports.saveCAMV = function(fileName, pycamverterVersion, scanData, peptideData, cb) {
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
    if (cb != null) { cb(); }
  })

  let writer = JSONStream.stringify('', '', '')
  writer.pipe(ws)
  ws.write('{\n')

  ws.write('  "pycamverterVersion": ')
  writer.write(pycamverterVersion)
  ws.write(',\n')

  ws.write('  "CAMVVersion": ')
  writer.write(pjson.version)
  ws.write(',\n')

  ws.write('  "scanData": ')
  writer.write(scanData)
  ws.write(',\n')

  ws.write('  "peptideData": ')
  writer.write(peptideData)
  ws.write(',\n')

  ws.write('}\n')
  writer.end()
}

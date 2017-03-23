
import fs from 'fs'
import path from 'path'

const { dialog } = require('electron').remote
import sqlite3 from 'sqlite3'


exports.loadSQL = function(fileName, cb) {
  let db = new sqlite3.Database(
    fileName, sqlite3.OPEN_READWRITE,
    function(err) {
      if (err != null) {
        dialog.showErrorBox("File Save Error", err.message)
      }
    },
  )
  cb(db)
}

exports.saveSQL = function(fileName, pycamverterVersion, scanData, peptideData, cb) {
  connection.commit()
  connection.close()
}

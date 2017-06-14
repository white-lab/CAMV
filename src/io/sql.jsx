
import fs from 'fs'
import path from 'path'

import { remote } from 'electron'
import sqlite3 from 'sqlite3'


exports.loadSQL = function(fileName, cb) {
  let db = new sqlite3.cached.Database(
    fileName, sqlite3.OPEN_READWRITE,
    (err) => {
      if (err != null) {
        remote.dialog.showErrorBox(
          "Database Error",
          err.message,
        )
      }
    },
  )
  cb(db)
}

exports.saveSQL = function(fileName, pycamverterVersion, scanData, peptideData, cb) {
  connection.commit()
  connection.close()
}

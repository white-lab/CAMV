
import fs from 'fs'
import path from 'path'

import { remote } from 'electron'
import Database from 'better-sqlite3'


exports.loadSQL = function(fileName, cb) {
  try {
    let db = new Database(
      fileName,
      {
        'readonly': false,
        'fileMustExist': true,
        // 'verbose': console.log,
      },
    )
    cb(db)
  } catch (err) {
    remote.dialog.showErrorBox(
      "Database Error",
      err.message,
    )
  }
}

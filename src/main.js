'use strict';

const electron = require('electron');
const {app} = electron;
const {BrowserWindow} = electron;

var mainWindow = null;

app.on('window-all-closed', function() {
  if (process.plaform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 600
  });
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  // mainWindow.webContents.openDevTools();
  mainWindow.on('closed', function() {
    mainWindow = null;
  });

});

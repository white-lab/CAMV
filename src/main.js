const electron = require('electron');
const {app} = electron;
const {BrowserWindow} = electron;
import {enableLiveReload} from 'electron-compile';

enableLiveReload();

var mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    icon: __dirname + '../assets/CAMV.ico'
  });
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  // mainWindow.webContents.openDevTools();
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.on('window-all-closed', function() {
  if (process.plaform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  enableLiveReload({strategy: 'react-hmr'});
  createWindow();
});

app.on('activate', function() {
    if (mainWindow === null) {
        createWindow();
    }
})

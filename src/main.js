const electron = require('electron')
const {app} = electron
const {BrowserWindow} = electron

if (process.env.NODE_ENV === 'development') {
  var enableLiveReload = require('electron-compile').enableLiveReload
  enableLiveReload()
}

var mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    icon: __dirname + '../assets/CAMV.ico'
  })

  mainWindow.loadURL('file://' + __dirname + '/index.html')

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.setMenu(null)
  }

  mainWindow.on('closed', function() {
    mainWindow = null
  })
}

app.on('window-all-closed', function() {
  if (process.plaform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', function() {
  if (process.env.NODE_ENV === 'development') {
    enableLiveReload({strategy: 'react-hmr'})
  }

  createWindow()
})

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow()
  }
})

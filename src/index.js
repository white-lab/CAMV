
const { app, BrowserWindow } = require('electron')

if (require('electron-squirrel-startup')) {
  app.quit()
}

let mainWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: __dirname + '../assets/CAMV.ico'
  })

  mainWindow.loadURL('file://' + __dirname + '/index.html')

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.setMenu(null)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

const {app, BrowserWindow} = require('electron')

let win;

function createWindow () {

  win = new BrowserWindow({width: 800, height: 500,  
                          webPreferences: { 
                                            zoomFactor: 1.2, 
                                            webSecurity: false
                                          }, 
                          backgroundColor: '',
                          titleBarStyle: "hidden",
                          resizable: false,
                          frame: false,
                          maximizable: false});

  win.loadURL(`file://${__dirname}/index.html`);

  win.on('closed', () => {
    win = null
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
});


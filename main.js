const {app, BrowserWindow} = require('electron')

let win;

function createWindow () {

  win = new BrowserWindow({width: 450, height: 600,
                          icon: 'resources/testman-logo-512x512.png',
                          webPreferences: { 
                                            webSecurity: false
                                          }, 
                          backgroundColor: '',
                          resizable: true,
                          maximizable: false});

  win.loadURL(`file://${__dirname}/sandbox.html`);
  win.setMenu(null);

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


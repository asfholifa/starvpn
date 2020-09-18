import path from 'path';
import { app, BrowserWindow, Menu, Tray, ipcMain, shell } from 'electron';
import { closeOpenVpn } from './server';
import config from './config';
import { googleSignInPopup, facebookSignInPopup } from './oauth';
import { autoUpdater } from 'electron-updater';
import { getConnectionName, getPublicIp, getConnectionLogPath } from './utils';

const isDevelopment = process.env.NODE_ENV === 'development';

const ICON_CONNECTED = path.resolve(
  path.join(__dirname, '../renderer/styles/icons/starvpn-green.png'),
);
const ICON_DISCONNECTED = path.resolve(
  path.join(__dirname, '../renderer/styles/icons/starvpn-black.png'),
);
const TRAY_TITLE_CONNECTED = `${config.APP_NAME} - Connected`;
const TRAY_TITLE_DISCONNECTED = `${config.APP_NAME} - Disconnected`;
const APP_ROOT = isDevelopment
  ? path.join(__dirname, '..', '..')
  : path.join(__dirname, '..', '..', '..');
let mainWindow = null;
let tray = null;
let forceQuit = false;

export function sendToUi(eventName, data) {
  if (mainWindow) {
    mainWindow.webContents.send(eventName, data);
  }
}

const updateNetworkName = () => {
  getConnectionName().then((name) => {
    sendToUi('network-name', name);
  });
};

export async function updatePublicIp() {
  const ip = await getPublicIp();
  console.info('PUBLIC IP:', ip);
  sendToUi('public-ip:set', ip);
}

export function traySetConnected() {
  if (!tray.isDestroyed()) {
    tray.setImage(ICON_CONNECTED);
    tray.setToolTip(TRAY_TITLE_CONNECTED);
    contextMenu.getMenuItemById('disconnect').visible = true;
    contextMenu.getMenuItemById('connect').visible = false;
    tray.setContextMenu(contextMenu);
  }
}

export function traySetDisconnected() {
  if (!tray.isDestroyed()) {
    tray.setImage(ICON_DISCONNECTED);
    tray.setToolTip(TRAY_TITLE_DISCONNECTED);
    contextMenu.getMenuItemById('disconnect').visible = false;
    contextMenu.getMenuItemById('connect').visible = true;
    tray.setContextMenu(contextMenu);
  }
}

const contextMenu = Menu.buildFromTemplate([
  {
    click() {
      mainWindow.show();
    },
    id: 'maximize',
    label: 'Open StarVPN panel',
    type: 'normal',
    visible: true,
  },
  {
    click() {
      sendToUi('vpn:connect');
    },
    label: 'Connect to VPN',
    type: 'normal',
    id: 'connect',
    visible: true,
  },
  {
    click() {
      sendToUi('vpn:disconnect');
    },
    id: 'disconnect',
    label: 'Disconnect from VPN',
    type: 'normal',
    visible: false,
  },
  {
    id: 'separator',
    type: 'separator',
  },
  {
    click() {
      forceQuit = true;
      mainWindow.close();
    },
    id: 'exit',
    label: 'Exit',
    type: 'normal',
    visible: true,
  },
]);

const installExtensions = async () => {
  const {
    default: install,
    REACT_DEVELOPER_TOOLS,
    REDUX_DEVTOOLS,
  } = require('electron-devtools-installer');
  // const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  // for (const name of extensions) {
  try {
    // await installer.default(installer[name], forceDownload);
    await install([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS], forceDownload);
  } catch (e) {
    console.info(e);
    console.log(`Error installing extensions: ${e.message}`);
  }
  // }
};

// crashReporter.start({
//   productName: config.APP_NAME,
//   companyName: config.APP_NAME,
//   submitURL: 'https://your-domain.com/url-to-submit',
//   uploadToServer: false,
// });

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

if (!isDevelopment) {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: path.join(path.dirname(process.execPath), 'resources', 'start.vbs'),
  });
}

app.on('window-all-closed', async () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    console.log(`Closing OpenVPN due to app termination`);
    if (!tray.isDestroyed()) {
      console.log('Destroying tray');
      tray.destroy();
    }
    await closeOpenVpn()
      .then(() => {
        console.log(`OpenVPN process closed!`);
        return app.quit();
      })
      .catch((err) => {
        console.log(`Closing OpenVPN process ERROR!`);
        console.log(err);
      });
  }
});

app.on('ready', async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  try {
    tray = new Tray(ICON_DISCONNECTED);
    tray.setContextMenu(contextMenu);
    tray.setTitle(config.APP_NAME);
    tray.setToolTip(TRAY_TITLE_DISCONNECTED);
    tray.on('click', () => {
      mainWindow.show();
    });
  } catch (e) {
    console.error('error---', e);
  }

  //session.defaultSession.clearStorageData([], () => {});

  const appName = app.getName();
  const appDataPath = path.join(app.getPath('appData'), appName);
  console.log(`App data stored at ${appDataPath}`);

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 610,
    show: false,
    icon: path.join(APP_ROOT, 'build', 'renderer', 'styles', 'icons', 'installerIcon.ico'),
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
    },
    resizable: isDevelopment,
  });

  mainWindow.removeMenu();

  mainWindow.loadFile(path.resolve(path.join(__dirname, '../renderer/index.html')));

  // show window once on first load
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.show();
    updateNetworkName();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    // Handle window logic properly on macOS:
    // 1. App should not terminate if window has been closed
    // 2. Click on icon in dock should re-open the window
    // 3. ⌘+Q should close the window and quit the app
    if (process.platform === 'darwin') {
      mainWindow.on('close', function(e) {
        if (!forceQuit) {
          e.preventDefault();
          mainWindow.hide();
        }
      });

      app.on('activate', () => {
        mainWindow.show();
      });

      app.on('before-quit', () => {
        forceQuit = true;
      });
    } else {
      mainWindow.on('closed', () => {
        mainWindow = null;
      });
    }
  });

  mainWindow.webContents.on('did-frame-finish-load', () => {
    if (isDevelopment) {
      mainWindow.webContents.openDevTools();
      mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.focus();
      });
      mainWindow.webContents.on('context-menu', (e, props) => {
        Menu.buildFromTemplate([
          {
            label: 'Inspect element',
            click() {
              mainWindow.inspectElement(props.x, props.y);
            },
          },
        ]).popup(mainWindow);
      });
    }
  });
  mainWindow.on('close', (event) => {
    if (!forceQuit) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });
});

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

autoUpdater.on('checking-for-update', () => {
  console.log('Checking updates');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('google-auth', async () => {
  await googleSignInPopup(mainWindow);
});

ipcMain.on('facebook-auth', async () => {
  await facebookSignInPopup(mainWindow);
});

ipcMain.on('check-for-updates', async () => {
  return autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.on('public-ip:refresh', async () => {
  return updatePublicIp();
});

ipcMain.on('get-connection-log', async () => {
  shell.openItem(getConnectionLogPath());
});

setInterval(updateNetworkName, config.NETWORK_CHECK_INTERVAL);
updatePublicIp();

export function getUserDataPath() {
  return app.getPath('userData');
}

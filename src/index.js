const {app, BrowserWindow, nativeImage, dialog} = require('electron');
const electron = require('electron');

const path = require('path');
const os = require('os');
const {execFile} = require('child_process');
const fs = require('fs');
const compareVersions = require('compare-versions');
const del = require('del');

const OpenBlockLink = require('openblock-link');
const OpenblockResourceServer = require('openblock-resource');

const formatMessage = require('format-message');
const locales = require('openblock-l10n/locales/link-desktop-msgs');
const osLocale = require('os-locale');

const {productName, version} = require('../package.json');

const {JSONStorage} = require('node-localstorage');
const nodeStorage = new JSONStorage(app.getPath('userData'));

const Menu = electron.Menu;
const Tray = electron.Tray;
const LINK_PORT = 20111;
const RESOURCE_PORT = 20112;
const SERVER_HOST = '0.0.0.0';

let mainWindow;
let appTray;
let locale = osLocale.sync();
let resourceServer;
let resourcePath;
let dataPath;
let makeTrayMenu = () => {};

const showOperationFailedMessageBox = err => {
    dialog.showMessageBox({
        type: 'error',
        buttons: ['Ok'],
        message: formatMessage({
            id: 'index.messageBox.operationFailed',
            default: 'Operation failed',
            description: 'Prompt for operation failed'
        }),
        detail: err
    });
};

const reportServerError = (serverName, err) => {
    const detail = `${serverName}: ${err}`;
    console.error(detail);
    if (appTray) {
        appTray.displayBalloon({
            title: 'DoGoBlock Agent',
            content: detail
        });
    }
};

const handleClickLanguage = l => {
    locale = l;
    formatMessage.setup({
        locale: locale,
        translations: locales
    });

    appTray.setContextMenu(Menu.buildFromTemplate(makeTrayMenu(locale)));
};


makeTrayMenu = l => [
    {
        label: formatMessage({
            id: 'index.menu.setLanguage',
            default: 'set language',
            description: 'Lable in menu item to set language'
        }),
        submenu: [
            {
                label: 'English',
                type: 'radio',
                click: () => handleClickLanguage('en'),
                checked: l === 'en'
            },
            {
                label: '简体中文',
                type: 'radio',
                click: () => handleClickLanguage('zh-cn'),
                checked: l === 'zh-cn'
            }
        ]
    },
    {
        label: formatMessage({
            id: 'index.menu.learCacheAndRestart',
            default: 'clear cache and restart',
            description: 'Menu item to clear cache and restart'
        }),
        click: () => {
            del.sync(dataPath, {force: true});
            app.relaunch();
            app.exit();
        }
    },
    {
        type: 'separator'
    },
    {
        label: formatMessage({
            id: 'index.menu.installDiver',
            default: 'install driver',
            description: 'Menu item to install driver'
        }),
        click: () => {
            const driverPath = path.join(resourcePath, 'drivers');
            if ((os.platform() === 'win32') && (os.arch() === 'x64')) {
                execFile('install_x64.bat', [], {cwd: driverPath});
            } else if ((os.platform() === 'win32') && (os.arch() === 'ia32')) {
                execFile('install_x86.bat', [], {cwd: driverPath});
            }
        }
    },
    {
        type: 'separator'
    },
    {
        label: formatMessage({
            id: 'index.menu.exit',
            default: 'exit',
            description: 'Menu item to exit'
        }),
        click: () => {
            appTray.destroy();
            mainWindow.destroy();
        }
    }
];

const devToolKey = ((process.platform === 'darwin') ?
    { // macOS: command+option+i
        alt: true, // option
        control: false,
        meta: true, // command
        shift: false,
        code: 'KeyI'
    } : { // Windows: control+shift+i
        alt: false,
        control: true,
        meta: false, // Windows key
        shift: true,
        code: 'KeyI'
    }
);

const createWindow = () => {
    mainWindow = new BrowserWindow({
        icon: path.join(__dirname, './icon/OpenBlock-Link.ico'),
        width: 400,
        height: 400,
        center: true,
        resizable: false,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    mainWindow.loadFile('./src/index.html');
    mainWindow.setMenu(null);

    if (locale === 'zh-CN') {
        locale = 'zh-cn';
    } else if (locale === 'zh-TW') {
        locale = 'zh-tw';
    }
    formatMessage.setup({
        locale: locale,
        translations: locales
    });

    const webContents = mainWindow.webContents;
    webContents.on('before-input-event', (event, input) => {
        if (input.code === devToolKey.code &&
            input.alt === devToolKey.alt &&
            input.control === devToolKey.control &&
            input.meta === devToolKey.meta &&
            input.shift === devToolKey.shift &&
            input.type === 'keyDown' &&
            !input.isAutoRepeat &&
            !input.isComposing) {
            event.preventDefault();
            webContents.openDevTools({mode: 'detach', activate: true});
        }
    });

    // generate product information.
    webContents.once('dom-ready', () => {
        const electronVersion = process.versions['electron'.toLowerCase()];
        const chromeVersion = process.versions['chrome'.toLowerCase()];
        mainWindow.webContents.executeJavaScript(
            `document.getElementById("product-name").innerHTML = "${productName}";
            document.getElementById("product-version").innerHTML = "Version ${version}";
            document.getElementById("electron-version").innerHTML = "Electron ${electronVersion}";
            document.getElementById("chrome-version").innerHTML = "Chrome ${chromeVersion}";`
        );
    });

    const userDataPath = electron.app.getPath('userData');
    dataPath = path.join(userDataPath, 'Data');
    const appPath = app.getAppPath();
    const appVersion = app.getVersion();

    // if current version is newer then cache log, delet the data cache dir and write the
    // new version into the cache file.
    const oldVersion = nodeStorage.getItem('version');
    if (oldVersion) {
        if (compareVersions.compare(appVersion, oldVersion, '>')) {
            if (fs.existsSync(dataPath)) {
                del.sync([dataPath], {force: true});
            }
            nodeStorage.setItem('version', appVersion);
        }
    } else {
        nodeStorage.setItem('version', appVersion);
    }

    if (appPath.search(/app.asar/g) === -1) {
        resourcePath = path.join(appPath);
    } else {
        resourcePath = path.join(appPath, '../');
    }

    // start link server
    const link = new OpenBlockLink(dataPath, path.join(resourcePath, 'tools'));
    link.on('error', err => reportServerError('OpenBlock Link', err));
    link.listen(LINK_PORT, SERVER_HOST);

    // start resource server
    resourceServer = new OpenblockResourceServer(dataPath, path.join(resourcePath, 'external-resources'));
    resourceServer.on('error', err => reportServerError('OpenBlock Resource', err));
    resourceServer.listen(RESOURCE_PORT, SERVER_HOST);


    appTray = new Tray(nativeImage.createFromPath(path.join(__dirname, './icon/OpenBlock-Link.ico')));
    appTray.setToolTip('DoGoBlock Agent');
    appTray.setContextMenu(Menu.buildFromTemplate(makeTrayMenu(locale)));

    appTray.on('click', () => {
        mainWindow.show();
    });

    mainWindow.on('close', event => {
        mainWindow.hide();
        event.preventDefault();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

const gotTheLock = app.requestSingleInstanceLock();
if (gotTheLock) {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            mainWindow.show();
        }
    });
    app.on('ready', () => {
        createWindow();
    });
} else {
    app.quit();
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

const {app, BrowserWindow, nativeImage, dialog} = require('electron');
const electron = require('electron');

const path = require('path');
const os = require('os');
const {execFile} = require('child_process');
const fs = require('fs');

const OpenBlockLink = require('openblock-link');

const osLocale = require('os-locale');

const {productName, version} = require('../package.json');

const {JSONStorage} = require('node-localstorage');
const nodeStorage = new JSONStorage(app.getPath('userData'));

const Menu = electron.Menu;
const Tray = electron.Tray;
const LINK_PORT = 20111;
const SERVER_HOST = '0.0.0.0';

let mainWindow;
let appTray;
let locale = osLocale.sync();
let resourcePath;
let dataPath;
let makeTrayMenu = () => {};

const translations = {
    en: {
        'index.messageBox.operationFailed': 'Operation failed',
        'index.menu.setLanguage': 'set language',
        'index.menu.learCacheAndRestart': 'clear cache and restart',
        'index.menu.installDiver': 'install driver',
        'index.menu.exit': 'exit'
    },
    'pt-br': {
        'index.messageBox.operationFailed': 'Operacao falhou',
        'index.menu.setLanguage': 'definir idioma',
        'index.menu.learCacheAndRestart': 'limpar cache e reiniciar',
        'index.menu.installDiver': 'instalar driver',
        'index.menu.exit': 'sair'
    },
    'zh-cn': {
        'index.messageBox.operationFailed': '操作失败',
        'index.menu.setLanguage': '设置语言',
        'index.menu.learCacheAndRestart': '清除缓存并重启',
        'index.menu.installDiver': '安装驱动',
        'index.menu.exit': '退出'
    }
};

const normalizeLocale = l => {
    const normalized = String(l || 'en').toLowerCase();
    if (normalized === 'zh-cn' || normalized === 'zh-hans') return 'zh-cn';
    if (normalized === 'pt-br' || normalized === 'pt') return 'pt-br';
    return 'en';
};

const t = (id, fallback) => {
    const messages = translations[normalizeLocale(locale)] || translations.en;
    return messages[id] || translations.en[id] || fallback;
};

const compareVersionParts = (a, b) => {
    const aParts = String(a || '0').split('.').map(part => parseInt(part, 10) || 0);
    const bParts = String(b || '0').split('.').map(part => parseInt(part, 10) || 0);
    const length = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < length; i++) {
        const diff = (aParts[i] || 0) - (bParts[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
};

const removePath = targetPath => {
    fs.rmSync(targetPath, {
        force: true,
        recursive: true
    });
};

const showOperationFailedMessageBox = err => {
    dialog.showMessageBox({
        type: 'error',
        buttons: ['Ok'],
        message: t('index.messageBox.operationFailed', 'Operation failed'),
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
    locale = normalizeLocale(l);
    appTray.setContextMenu(Menu.buildFromTemplate(makeTrayMenu(locale)));
};


makeTrayMenu = l => [
    {
        label: t('index.menu.setLanguage', 'set language'),
        submenu: [
            {
                label: 'English',
                type: 'radio',
                click: () => handleClickLanguage('en'),
                checked: l === 'en'
            },
            {
                label: 'Portugues',
                type: 'radio',
                click: () => handleClickLanguage('pt-br'),
                checked: l === 'pt-br'
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
        label: t('index.menu.learCacheAndRestart', 'clear cache and restart'),
        click: () => {
            removePath(dataPath);
            app.relaunch();
            app.exit();
        }
    },
    {
        type: 'separator'
    },
    {
        label: t('index.menu.installDiver', 'install driver'),
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
        label: t('index.menu.exit', 'exit'),
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

    locale = normalizeLocale(locale);

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
        if (compareVersionParts(appVersion, oldVersion) > 0) {
            if (fs.existsSync(dataPath)) {
                removePath(dataPath);
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

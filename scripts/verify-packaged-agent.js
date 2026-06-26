const fs = require('fs');
const path = require('path');
const asar = require('@electron/asar');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const requiredAsarFiles = [
    '/node_modules/openblock-link/src/session/serialport.js',
    '/node_modules/serialport/dist/index.js',
    '/node_modules/@serialport/stream/dist/index.js',
    '/node_modules/@serialport/bindings-cpp/dist/index.js',
    '/node_modules/@serialport/bindings-cpp/dist/load-bindings.js'
];

const requiredUnpackedFiles = [
    path.join('node_modules', '@serialport', 'bindings-cpp', 'build', 'Release', 'bindings.node')
];

const fail = message => {
    throw new Error(message);
};

const findUnpackedApps = () => {
    if (!fs.existsSync(dist)) return [];
    return fs.readdirSync(dist)
        .filter(name => name.endsWith('-unpacked'))
        .map(name => path.join(dist, name))
        .filter(appDir => fs.existsSync(path.join(appDir, 'resources', 'app.asar')));
};

const verifyApp = appDir => {
    const appName = path.basename(appDir);
    const archive = path.join(appDir, 'resources', 'app.asar');
    const entries = new Set(asar.listPackage(archive));

    for (const file of requiredAsarFiles) {
        if (!entries.has(file)) {
            fail(`${appName}: missing ${file} in app.asar`);
        }
    }

    const unpackedRoot = path.join(appDir, 'resources', 'app.asar.unpacked');
    for (const file of requiredUnpackedFiles) {
        const target = path.join(unpackedRoot, file);
        if (!fs.existsSync(target)) {
            fail(`${appName}: missing unpacked native module ${file}`);
        }
    }

    console.log(`${appName}: packaged serialport dependencies verified`);
};

const apps = findUnpackedApps();
if (!apps.length) {
    fail('No packaged app found in dist/*-unpacked');
}

apps.forEach(verifyApp);

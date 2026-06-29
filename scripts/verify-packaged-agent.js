const fs = require('fs');
const path = require('path');
const asar = require('@electron/asar');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const requiredRuntimePatterns = [
    /\/node_modules\/(?:.*\/node_modules\/)?serialport\/dist\/index\.js$/,
    /\/node_modules\/(?:.*\/node_modules\/)?@serialport\/stream\/dist\/index\.js$/,
    /\/node_modules\/(?:.*\/node_modules\/)?@serialport\/bindings-cpp\/dist\/index\.js$/,
    /\/node_modules\/(?:.*\/node_modules\/)?@serialport\/bindings-cpp\/dist\/load-bindings\.js$/
];

const requiredUnpackedPatterns = [
    /node_modules[\\/](?:.*[\\/]node_modules[\\/])?@serialport[\\/]bindings-cpp[\\/]build[\\/]Release[\\/]bindings\.node$/
];

const fail = message => {
    throw new Error(message);
};

const walkFiles = dir => {
    if (!fs.existsSync(dir)) return [];
    const result = [];
    const stack = [dir];
    while (stack.length) {
        const current = stack.pop();
        for (const entry of fs.readdirSync(current, {withFileTypes: true})) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
            } else if (entry.isFile()) {
                result.push(fullPath);
            }
        }
    }
    return result;
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
    const entries = asar.listPackage(archive);
    const unpackedRoot = path.join(appDir, 'resources', 'app.asar.unpacked');
    const unpackedFiles = walkFiles(unpackedRoot);

    for (const pattern of requiredRuntimePatterns) {
        const foundInAsar = entries.some(file => pattern.test(file));
        const foundUnpacked = unpackedFiles.some(file => pattern.test(file.replace(/\\/g, '/')));
        if (!foundInAsar && !foundUnpacked) {
            fail(`${appName}: missing packaged runtime file matching ${pattern}`);
        }
    }

    for (const pattern of requiredUnpackedPatterns) {
        if (!unpackedFiles.some(file => pattern.test(file))) {
            fail(`${appName}: missing unpacked native module matching ${pattern}`);
        }
    }

    console.log(`${appName}: packaged serialport dependencies verified`);
};

const apps = findUnpackedApps();
if (!apps.length) {
    fail('No packaged app found in dist/*-unpacked');
}

apps.forEach(verifyApp);

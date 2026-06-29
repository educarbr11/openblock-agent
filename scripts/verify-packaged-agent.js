const fs = require('fs');
const path = require('path');
const asar = require('@electron/asar');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const requiredPackages = [
    'serialport',
    '@serialport/stream',
    '@serialport/bindings-cpp'
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

const packagePattern = packageName => {
    const escaped = packageName.replace('/', '\\/');
    return new RegExp(`\\/node_modules\\/(?:.*\\/node_modules\\/)?${escaped}\\/package\\.json$`);
};

const normalizeEntry = file => file.replace(/\\/g, '/');

const packageRoot = packageJsonEntry => packageJsonEntry.replace(/\/package\.json$/, '');

const packageMainEntry = (packageJsonEntry, packageJson) => {
    const main = (packageJson.main || 'index.js').replace(/^\.\//, '');
    return `${packageRoot(packageJsonEntry)}/${main}`.replace(/\\/g, '/');
};

const readPackageJson = (archive, unpackedRoot, entry) => {
    if (entry.source === 'asar') {
        return JSON.parse(asar.extractFile(archive, entry.path.replace(/^\//, '')).toString('utf8'));
    }
    return JSON.parse(fs.readFileSync(path.join(unpackedRoot, ...entry.path.replace(/^\//, '').split('/')), 'utf8'));
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
    const packagedFiles = new Set(entries.concat(
        unpackedFiles.map(file => `/${path.relative(unpackedRoot, file).split(path.sep).join('/')}`)
    ));
    const packageEntries = entries.map(file => ({source: 'asar', path: file})).concat(
        unpackedFiles.map(file => ({
            source: 'unpacked',
            path: `/${path.relative(unpackedRoot, file).split(path.sep).join('/')}`
        }))
    );

    for (const packageName of requiredPackages) {
        const pattern = packagePattern(packageName);
        const candidates = packageEntries.filter(file => pattern.test(file.path));
        if (!candidates.length) {
            fail(`${appName}: missing packaged ${packageName}/package.json`);
        }

        const hasValidMain = candidates.some(candidate => {
            const packageJson = readPackageJson(archive, unpackedRoot, candidate);
            return packagedFiles.has(packageMainEntry(candidate.path, packageJson));
        });
        if (!hasValidMain) {
            const checked = candidates.map(candidate => {
                const packageJson = readPackageJson(archive, unpackedRoot, candidate);
                return packageMainEntry(candidate.path, packageJson);
            }).join(', ');
            fail(`${appName}: missing packaged main file for ${packageName}: ${checked}`);
        }
    }

    for (const pattern of requiredUnpackedPatterns) {
        if (!unpackedFiles.some(file => pattern.test(normalizeEntry(file)))) {
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

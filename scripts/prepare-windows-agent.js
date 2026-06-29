const fs = require('fs');
const path = require('path');

const linkRoot = path.join(__dirname, '..', 'node_modules', 'openblock-link');
const linkPackagePath = path.join(linkRoot, 'package.json');
const linkIndexPath = path.join(linkRoot, 'src', 'index.js');
const abandonwarePath = path.join(__dirname, '..', 'node_modules', '@abandonware');

const patchLinkPackage = () => {
    const pkg = JSON.parse(fs.readFileSync(linkPackagePath, 'utf8'));
    if (pkg.dependencies) {
        delete pkg.dependencies['@abandonware/noble'];
    }
    fs.writeFileSync(linkPackagePath, `${JSON.stringify(pkg, null, 2)}\n`);
};

const patchLinkIndex = () => {
    let source = fs.readFileSync(linkIndexPath, 'utf8');
    source = source.replace(
        "    '/scratch/ble': require('./session/ble'), // eslint-disable-line global-require\n",
        ''
    );
    fs.writeFileSync(linkIndexPath, source);
};

const removeAbandonwareModules = () => {
    if (fs.existsSync(abandonwarePath)) {
        fs.rmdirSync(abandonwarePath, {recursive: true});
    }
};

patchLinkPackage();
patchLinkIndex();
removeAbandonwareModules();

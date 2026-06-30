const fs = require('fs');
const path = require('path');

const linkRoot = path.join(__dirname, '..', 'node_modules', 'openblock-link');
const linkPackagePath = path.join(linkRoot, 'package.json');
const linkIndexPath = path.join(linkRoot, 'src', 'index.js');

const patchLinkPackage = () => {
    const pkg = JSON.parse(fs.readFileSync(linkPackagePath, 'utf8'));
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['@abandonware/noble'] = pkg.dependencies['@abandonware/noble'] || '1.9.2-25';
    fs.writeFileSync(linkPackagePath, `${JSON.stringify(pkg, null, 2)}\n`);
};

const patchLinkIndex = () => {
    let source = fs.readFileSync(linkIndexPath, 'utf8');
    if (!source.includes("'/openblock/ble'")) {
        source = source.replace(
            "    '/openblock/serialport': require('./session/serialport') // eslint-disable-line global-require\n}",
            "    '/openblock/serialport': require('./session/serialport'), // eslint-disable-line global-require\n" +
                "    '/openblock/ble': require('./session/ble') // eslint-disable-line global-require\n}"
        );
    }
    fs.writeFileSync(linkIndexPath, source);
};

patchLinkPackage();
patchLinkIndex();

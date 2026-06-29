const fs = require('fs');
const path = require('path');

exports.default = async context => {
    const source = path.join(context.packager.projectDir, 'node_modules', '@serialport');
    const target = path.join(
        context.appOutDir,
        'resources',
        'app.asar.unpacked',
        'node_modules',
        '@serialport'
    );

    if (!fs.existsSync(source)) {
        throw new Error(`Missing serialport runtime packages at ${source}`);
    }

    fs.rmSync(target, {recursive: true, force: true});
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.cpSync(source, target, {recursive: true});
};

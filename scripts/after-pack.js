const fs = require('fs');
const path = require('path');

exports.default = async context => {
    const copyRuntimePackage = packageName => {
        const source = path.join(context.packager.projectDir, 'node_modules', packageName);
        const target = path.join(
            context.appOutDir,
            'resources',
            'app.asar.unpacked',
            'node_modules',
            packageName
        );

        if (!fs.existsSync(source)) {
            throw new Error(`Missing runtime package ${packageName} at ${source}`);
        }

        fs.rmSync(target, {recursive: true, force: true});
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.cpSync(source, target, {recursive: true});
    };

    copyRuntimePackage('@serialport');
    copyRuntimePackage('@abandonware');
};

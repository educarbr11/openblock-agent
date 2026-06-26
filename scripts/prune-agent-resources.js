const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

const allowedArduinoFirmwares = new Set(['arduinoUno.hex', 'arduinoUnoUltra.hex']);
const removePath = target => {
    if (!fs.existsSync(target)) return;
    const relative = path.relative(root, target);
    if (dryRun) {
        console.log(`[dry-run] remove ${relative}`);
        return;
    }
    fs.rmSync(target, {recursive: true, force: true});
    console.log(`removed ${relative}`);
};

const copyPath = (source, target) => {
    if (!fs.existsSync(source)) return;
    const relativeSource = path.relative(root, source);
    const relativeTarget = path.relative(root, target);
    if (dryRun) {
        console.log(`[dry-run] copy ${relativeSource} -> ${relativeTarget}`);
        return;
    }
    fs.rmSync(target, {recursive: true, force: true});
    fs.cpSync(source, target, {recursive: true});
    console.log(`copied ${relativeSource} -> ${relativeTarget}`);
};

const keepOnlyChildren = (dir, allowedNames) => {
    if (!fs.existsSync(dir)) return;
    for (const child of fs.readdirSync(dir)) {
        if (!allowedNames.has(child)) {
            removePath(path.join(dir, child));
        }
    }
};

const pruneArduinoTools = () => {
    const toolsRoot = path.join(root, 'tools');
    const arduinoRoot = path.join(toolsRoot, 'Arduino');
    if (fs.existsSync(path.join(root, 'tools'))) {
        for (const child of fs.readdirSync(path.join(root, 'tools'))) {
            if (child.endsWith('.7z')) {
                removePath(path.join(root, 'tools', child));
            }
        }
    }

    const avrdudeRoot = path.join(arduinoRoot, 'packages', 'arduino', 'tools', 'avrdude', '6.3.0-arduino17');
    const lightAvrdudeRoot = path.join(toolsRoot, 'avrdude');
    copyPath(avrdudeRoot, lightAvrdudeRoot);
    removePath(arduinoRoot);
    removePath(path.join(toolsRoot, 'Python'));
    removePath(path.join(root, 'external-resources'));
};

const pruneFirmwares = () => {
    keepOnlyChildren(path.join(root, 'firmwares', 'arduino'), allowedArduinoFirmwares);
    removePath(path.join(root, 'firmwares', 'microPython'));
};

pruneArduinoTools();
pruneFirmwares();

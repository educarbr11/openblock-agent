const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');
// Offline builds keep the Arduino AVR toolchain so the Agent can compile without Dogoblock API.
const withCompiler = process.argv.includes('--with-compiler');

const allowedArduinoFirmwares = new Set(['arduinoUno.hex', 'arduinoUnoUltra.hex']);
const offlineArduinoEntries = new Set([
    'arduino-cli',
    'arduino-cli.exe',
    'arduino-cli.yaml',
    'inventory.yaml',
    'LICENSE.txt',
    'libraries',
    'library_index.json',
    'package_index.json',
    'package_index.json.sig',
    'packages',
    'staging',
    'tmp'
]);
const offlineArduinoPackages = new Set(['arduino', 'builtin']);
const offlineArduinoHardware = new Set(['avr']);
// openblock-tools also ships ARM toolchains (Uno R4, SAMD); AVR builds only need these.
const offlineArduinoTools = new Set(['avr-gcc', 'avrdude']);
// Same library set as the Dogoblock API compiler image (LiquidCrystal is copied from displayLcd).
const offlineArduinoLibraries = new Set(['ArduinoGraphics', 'avr-stl', 'Servo', 'SimpleList']);
const allowedMicrobitFirmwares = new Set([
    'dogoblock-microbit-ble.hex',
    'dogoblock-microbit-ble-v2.hex',
    'dogoblock-microbit-realtime-v2.hex'
]);
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

// arduino-cli downloads a missing library index every time it starts; without internet each
// start waits for DNS timeouts (10 s or more). Installed libraries are found by scanning their
// folders, so an empty index is enough.
const writeEmptyLibraryIndex = target => {
    if (dryRun) {
        console.log(`[dry-run] write ${path.relative(root, target)}`);
        return;
    }
    fs.writeFileSync(target, '{"libraries":[]}\n');
    console.log(`wrote ${path.relative(root, target)}`);
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

    if (withCompiler) {
        if (!fs.existsSync(path.join(arduinoRoot, 'packages', 'arduino', 'hardware', 'avr'))) {
            throw new Error('Arduino AVR core not found in tools/Arduino. Run npm run fetch:tools first.');
        }
        keepOnlyChildren(arduinoRoot, offlineArduinoEntries);
        keepOnlyChildren(path.join(arduinoRoot, 'packages'), offlineArduinoPackages);
        keepOnlyChildren(path.join(arduinoRoot, 'packages', 'arduino', 'hardware'), offlineArduinoHardware);
        keepOnlyChildren(path.join(arduinoRoot, 'packages', 'arduino', 'tools'), offlineArduinoTools);
        keepOnlyChildren(path.join(arduinoRoot, 'libraries'), offlineArduinoLibraries);
        copyPath(
            path.join(root, 'local-resources', 'extensions', 'displayLcd', 'lib', 'LiquidCrystal'),
            path.join(arduinoRoot, 'libraries', 'LiquidCrystal')
        );
        writeEmptyLibraryIndex(path.join(arduinoRoot, 'library_index.json'));
    } else {
        const avrdudeRoot = path.join(arduinoRoot, 'packages', 'arduino', 'tools', 'avrdude', '6.3.0-arduino17');
        const lightAvrdudeRoot = path.join(toolsRoot, 'avrdude');
        copyPath(avrdudeRoot, lightAvrdudeRoot);
        removePath(arduinoRoot);
    }
    removePath(path.join(toolsRoot, 'Python'));
    removePath(path.join(root, 'external-resources'));
};

const pruneFirmwares = () => {
    keepOnlyChildren(path.join(root, 'firmwares', 'arduino'), allowedArduinoFirmwares);
    keepOnlyChildren(path.join(root, 'firmwares', 'microbit'), allowedMicrobitFirmwares);
    removePath(path.join(root, 'firmwares', 'microPython'));
};

pruneArduinoTools();
pruneFirmwares();

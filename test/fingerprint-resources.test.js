const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourcePath = path.resolve(__dirname, '..', 'scripts', 'prune-agent-resources.js');
const pruneSource = fs.readFileSync(sourcePath, 'utf8');
const fingerprintLibraries = ['Adafruit_Fingerprint', 'DoGoFingerprint'];

const writeFixture = (root, relative, content = 'fixture') => {
    const filename = path.join(root, relative);
    fs.mkdirSync(path.dirname(filename), {recursive: true});
    fs.writeFileSync(filename, content);
};

const makeFixture = t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dogoblock-fingerprint-agent-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    for (const file of [
        'tools/Arduino/arduino-cli',
        'tools/Arduino/packages/arduino/hardware/avr/1.8.6/platform.txt',
        'tools/Arduino/packages/arduino/hardware/renesas_uno/platform.txt',
        'tools/Arduino/packages/arduino/tools/avr-gcc/bin/avr-g++',
        'tools/Arduino/packages/arduino/tools/avrdude/bin/avrdude',
        'tools/Arduino/packages/arduino/tools/arm-none-eabi-gcc/bin/g++',
        'tools/Arduino/libraries/Servo/src/Servo.h',
        'tools/Arduino/libraries/DownloadedUnused/src/Unused.h',
        'tools/Python/python',
        'firmwares/arduino/arduinoUno.hex',
        'firmwares/arduino/unused.hex',
        'external-resources/unused.txt'
    ]) writeFixture(root, file);

    writeFixture(root, 'tools/Arduino/library_index.json', '{"libraries":[{"name":"downloaded"}]}');
    for (const library of fingerprintLibraries) {
        const source = `local-resources/extensions/fingerprint/lib/${library}`;
        writeFixture(root, `${source}/library.properties`, `name=${library}\nversion=1.0.0\n`);
        const header = library === 'Adafruit_Fingerprint' ? `${library}.h` : `src/${library}.h`;
        writeFixture(root, `${source}/${header}`, `canonical ${library}`);
        writeFixture(root, `tools/Arduino/libraries/${library}/${header}`, `stale ${library}`);
        writeFixture(root, `tools/Arduino/libraries/${library}/stale.txt`, 'stale downloaded file');
    }
    return root;
};

// Execute the production script with its root bound to an isolated fixture.
const pruneFixture = (root, args = []) => {
    const messages = [];
    vm.runInNewContext(pruneSource, {
        require,
        __dirname: path.join(root, 'scripts'),
        process: {argv: ['node', sourcePath, '--with-compiler', ...args]},
        console: {log: message => messages.push(message)}
    }, {filename: sourcePath});
    return messages;
};

const snapshot = root => {
    const files = {};
    const walk = directory => {
        for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
            const filename = path.join(directory, entry.name);
            if (entry.isDirectory()) walk(filename);
            else files[path.relative(root, filename)] = fs.readFileSync(filename).toString('base64');
        }
    };
    walk(root);
    return files;
};

test('offline pruning copies canonical Fingerprint libraries and preserves AVR dependencies', t => {
    const root = makeFixture(t);
    pruneFixture(root);

    for (const library of fingerprintLibraries) {
        const source = path.join(root, 'local-resources', 'extensions', 'fingerprint', 'lib', library);
        const installed = path.join(root, 'tools', 'Arduino', 'libraries', library);
        assert.deepEqual(snapshot(installed), snapshot(source), `${library} must match its local extension source`);
    }
    assert.equal(fs.readFileSync(path.join(root, 'tools/Arduino/libraries/Servo/src/Servo.h'), 'utf8'), 'fixture');
    assert.ok(fs.existsSync(path.join(root, 'tools/Arduino/packages/arduino/hardware/avr/1.8.6/platform.txt')));
    assert.ok(fs.existsSync(path.join(root, 'tools/Arduino/packages/arduino/tools/avr-gcc/bin/avr-g++')));
    assert.equal(fs.existsSync(path.join(root, 'tools/Arduino/libraries/DownloadedUnused')), false);
    assert.equal(fs.existsSync(path.join(root, 'tools/Arduino/packages/arduino/hardware/renesas_uno')), false);
    assert.equal(fs.existsSync(path.join(root, 'tools/Arduino/packages/arduino/tools/arm-none-eabi-gcc')), false);
    assert.equal(fs.existsSync(path.join(root, 'tools/Python')), false);
    assert.equal(fs.existsSync(path.join(root, 'external-resources')), false);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'tools/Arduino/library_index.json'), 'utf8')), {
        libraries: []
    });
});

for (const library of fingerprintLibraries) {
    test(`offline pruning rejects a missing ${library} source`, t => {
        const root = makeFixture(t);
        const manifest = path.join(root, 'local-resources', 'extensions', 'fingerprint', 'lib', library,
            'library.properties');
        fs.rmSync(manifest);
        assert.throws(() => pruneFixture(root), error =>
            error.message.includes('Fingerprint library missing:') && error.message.includes(library));
    });
}

test('offline dry run describes Fingerprint copies without modifying the fixture', t => {
    const root = makeFixture(t);
    const before = snapshot(root);
    const messages = pruneFixture(root, ['--dry-run']);
    assert.deepEqual(snapshot(root), before);
    for (const library of fingerprintLibraries) {
        assert.ok(messages.some(message => message.startsWith('[dry-run] copy ') && message.includes(library)));
    }
    assert.ok(messages.some(message => message.startsWith('[dry-run] remove ') &&
        message.includes('DownloadedUnused')));
});

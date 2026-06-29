const fs = require('fs');
const path = require('path');

const linkRoot = path.join(__dirname, '..', 'node_modules', 'openblock-link');

const replaceOnce = (source, search, replacement, label) => {
    if (source.includes(replacement)) return source;
    if (!source.includes(search)) {
        throw new Error(`Could not patch openblock-link: missing ${label}`);
    }
    return source.replace(search, replacement);
};

const patchArduinoUploader = () => {
    const file = path.join(linkRoot, 'src', 'upload', 'arduino.js');
    let source = fs.readFileSync(file, 'utf8');

    source = replaceOnce(
        source,
        '        this.initArduinoCli();',
        "        if (fs.existsSync(this._arduinoCliPath)) {\n            this.initArduinoCli();\n        }",
        'conditional arduino-cli init'
    );

    if (!source.includes('_getAvrdudePaths')) {
        const directUploadMethods = `    _getUploadFqbns () {
        const fallbackFqbns = Array.isArray(this._config.uploadFallbackFqbns) ?
            this._config.uploadFallbackFqbns : [];
        return [this._config.fqbn].concat(fallbackFqbns).filter((fqbn, index, fqbns) =>
            fqbn && fqbns.indexOf(fqbn) === index
        );
    }

    _getAvrdudePaths () {
        const candidateRoots = [
            path.join(this._arduinoPath, '..', 'avrdude'),
            path.join(this._arduinoPath, 'packages', 'arduino', 'tools', 'avrdude', '6.3.0-arduino17')
        ];
        for (const root of candidateRoots) {
            const bin = path.join(root, 'bin', os.platform() === 'win32' ? 'avrdude.exe' : 'avrdude');
            const conf = path.join(root, 'etc', 'avrdude.conf');
            if (fs.existsSync(bin) && fs.existsSync(conf)) {
                return {bin, conf};
            }
        }
        throw new Error('avrdude nao encontrado no Dogoblock Agent.');
    }

    _getAvrdudeUploadConfig (fqbn) {
        const configs = {
            'arduino:avr:uno': {part: 'atmega328p', programmer: 'arduino', baud: 115200},
            'arduino:avr:nano': {part: 'atmega328p', programmer: 'arduino', baud: 115200},
            'arduino:avr:nano:cpu=atmega328old': {part: 'atmega328p', programmer: 'arduino', baud: 57600},
            'arduino:avr:leonardo': {part: 'atmega32u4', programmer: 'avr109', baud: 57600}
        };
        if (!configs[fqbn]) {
            throw new Error(\`Upload direto nao suporta a placa \${fqbn}.\`);
        }
        return configs[fqbn];
    }

    _flashHexWithAvrdude (fqbn, firmwarePath) {
        const avrdude = this._getAvrdudePaths();
        const uploadConfig = this._getAvrdudeUploadConfig(fqbn);
        const args = [
            \`-C\${avrdude.conf}\`,
            '-v',
            \`-p\${uploadConfig.part}\`,
            \`-c\${uploadConfig.programmer}\`,
            \`-P\${this._peripheralPath}\`,
            \`-b\${uploadConfig.baud}\`,
            '-D',
            \`-Uflash:w:\${firmwarePath}:i\`
        ];

        return new Promise((resolve, reject) => {
            const avrdudeProcess = spawn(avrdude.bin, args);
            this._sendstd(\`\${ansi.clear}\${avrdude.bin} \${args.join(' ')}\\n\`);
            avrdudeProcess.stderr.on('data', buf => this._sendstd(buf.toString()));
            avrdudeProcess.stdout.on('data', buf => this._sendstd(buf.toString()));
            const listenAbortSignal = setInterval(() => {
                if (this._abort) {
                    if (os.platform() === 'win32') {
                        spawnSync('taskkill', ['/pid', avrdudeProcess.pid, '/f', '/t']);
                    } else {
                        avrdudeProcess.kill();
                    }
                }
            }, ABORT_STATE_CHECK_INTERVAL);
            avrdudeProcess.on('exit', code => {
                clearInterval(listenAbortSignal);
                if (code === 0) return resolve('Success');
                if (this._abort) return resolve('Aborted');
                return reject(new Error('avrdude failed to flash'));
            });
        });
    }

`;
        if (source.includes('    _flashWithFqbn (fqbn, firmwarePath = null) {')) {
            source = replaceOnce(
                source,
                '    _flashWithFqbn (fqbn, firmwarePath = null) {',
                `${directUploadMethods}    _flashWithFqbn (fqbn, firmwarePath = null) {`,
                'avrdude direct methods'
            );
        } else {
            source = replaceOnce(
                source,
                '    async flash (firmwarePath = null) {',
                `${directUploadMethods}    async flash (firmwarePath = null) {`,
                'avrdude direct methods'
            );
        }
    }

    if (!source.includes('async flashArtifact')) {
        source = replaceOnce(
            source,
            '    flashRealtimeFirmware () {',
            `    async flashArtifact (firmwarePath) {
        const fqbns = this._getUploadFqbns();
        let lastError = null;
        for (let i = 0; i < fqbns.length; i++) {
            const fqbn = fqbns[i];
            if (i > 0) {
                this._sendstd(\`\${ansi.yellow_dark}Upload failed. Trying alternate Arduino bootloader (\${fqbn})...\\n\`);
            }
            try {
                return await this._flashHexWithAvrdude(fqbn, firmwarePath);
            } catch (err) {
                lastError = err;
                if (this._abort || i === fqbns.length - 1) throw err;
            }
        }
        throw lastError || new Error('avrdude failed to flash');
    }

    flashRealtimeFirmware () {`,
            'flashArtifact'
        );
    }

    fs.writeFileSync(file, source);
};

const patchLinkPackage = () => {
    const file = path.join(linkRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['adm-zip'] = pkg.dependencies['adm-zip'] || '^0.5.17';
    pkg.dependencies['@serialport/stream'] = pkg.dependencies['@serialport/stream'] || '10.3.0';
    pkg.dependencies['@serialport/bindings-cpp'] = pkg.dependencies['@serialport/bindings-cpp'] || '10.7.0';
    [
        '7zip-bin',
        '@abandonware/noble',
        'axios',
        'dbus-next',
        'download-github-release',
        'https',
        'install',
        'node-7z',
        'os',
        'serialport',
        'usb'
    ].forEach(dep => {
        if (pkg.dependencies) {
            delete pkg.dependencies[dep];
        }
    });
    fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
};

const copySerialportRuntimeIntoLink = () => {
    const source = path.join(__dirname, '..', 'node_modules', '@serialport');
    const target = path.join(linkRoot, 'node_modules', '@serialport');
    if (!fs.existsSync(source)) {
        throw new Error('Could not patch openblock-link: missing @serialport runtime packages');
    }
    fs.rmSync(target, {recursive: true, force: true});
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.cpSync(source, target, {recursive: true});
};

const patchLinkIndex = () => {
    const file = path.join(linkRoot, 'src', 'index.js');
    let source = fs.readFileSync(file, 'utf8');
    if (!source.includes("'/openblock/ble'")) {
        source = replaceOnce(
            source,
            "    '/openblock/serialport': require('./session/serialport') // eslint-disable-line global-require\n}",
            "    '/openblock/serialport': require('./session/serialport'), // eslint-disable-line global-require\n" +
                "    '/openblock/ble': require('./session/ble') // eslint-disable-line global-require\n}",
            'BLE route'
        );
    }
    fs.writeFileSync(file, source);
};

const removeUnusedNativeModules = () => {
    [
        path.join(__dirname, '..', 'node_modules', '@abandonware'),
        path.join(__dirname, '..', 'node_modules', 'dbus-next'),
        path.join(__dirname, '..', 'node_modules', 'usb')
    ].forEach(target => {
        if (fs.existsSync(target)) {
            fs.rmSync(target, {recursive: true, force: true});
        }
    });
};

const patchSerialportSession = () => {
    const file = path.join(linkRoot, 'src', 'session', 'serialport.js');
    let source = fs.readFileSync(file, 'utf8');

    const serialportRuntimeRequire = "const serialportRuntimePath = require('path');\n" +
        'const requireSerialportRuntime = packageName => {\n' +
        '    const packagePathParts = packageName.split(\'/\');\n' +
        '    const candidates = [packageName];\n' +
        '    if (process.resourcesPath) {\n' +
        "        candidates.push(serialportRuntimePath.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', ...packagePathParts));\n" +
        '    }\n' +
        '    let lastError = null;\n' +
        '    for (const candidate of candidates) {\n' +
        '        try {\n' +
        '            return require(candidate); // eslint-disable-line global-require, import/no-dynamic-require\n' +
        '        } catch (err) {\n' +
        '            lastError = err;\n' +
        '        }\n' +
        '    }\n' +
        '    throw lastError;\n' +
        '};\n' +
        "const {SerialPortStream} = requireSerialportRuntime('@serialport/stream');\n" +
        "const {autoDetect} = requireSerialportRuntime('@serialport/bindings-cpp');\n" +
        'const DetectedBinding = autoDetect();\n' +
        'class SerialPort extends SerialPortStream {\n' +
        '    constructor (options, openCallback) {\n' +
        '        super(Object.assign({binding: DetectedBinding}, options), openCallback);\n' +
        '    }\n' +
        '}\n' +
        'SerialPort.list = DetectedBinding.list;\n' +
        'SerialPort.binding = DetectedBinding;';
    const legacyDirectSerialportRequire = "const {SerialPortStream} = require('@serialport/stream');\n" +
        "const {autoDetect} = require('@serialport/bindings-cpp');\n" +
        'const DetectedBinding = autoDetect();\n' +
        'class SerialPort extends SerialPortStream {\n' +
        '    constructor (options, openCallback) {\n' +
        '        super(Object.assign({binding: DetectedBinding}, options), openCallback);\n' +
        '    }\n' +
        '}\n' +
        'SerialPort.list = DetectedBinding.list;\n' +
        'SerialPort.binding = DetectedBinding;';

    if (source.includes(legacyDirectSerialportRequire)) {
        source = source.replace(legacyDirectSerialportRequire, serialportRuntimeRequire);
    } else {
        source = replaceOnce(
            source,
            "const {SerialPort} = require('serialport');",
            serialportRuntimeRequire,
            'direct @serialport requires'
        );
    }

    source = replaceOnce(
        source,
        "const ansi = require('ansi-string');",
        "const ansi = require('ansi-string');\nconst fs = require('fs');\nconst path = require('path');",
        'fs/path requires'
    );
    source = replaceOnce(
        source,
        '        const {message, config, encoding} = params;',
        '        const {message, config, encoding, uploadOptions} = params;',
        'uploadOptions destructure'
    );

    if (!source.includes("uploadOptions.artifactType === 'compiledArtifact'")) {
        source = replaceOnce(
            source,
            '                const exitCode = await this.tool.build(code);',
            `                if (uploadOptions && uploadOptions.artifactType === 'compiledArtifact') {
                    const artifactDir = path.join(this.userDataPath, 'arduino', 'artifacts');
                    fs.mkdirSync(artifactDir, {recursive: true});
                    const artifactPath = path.join(artifactDir, \`\${Date.now()}-\${config.fqbn.replace(/[^a-z0-9]/gi, '_')}.hex\`);
                    fs.writeFileSync(artifactPath, code);
                    try {
                        this.sendstd(\`\${ansi.clear}Disconnect serial port\\n\`);
                        await this.disconnect();
                        this.sendstd(\`\${ansi.clear}Disconnected successfully, flash program starting...\\n\`);
                        const flashExitCode = await this.tool.flashArtifact(artifactPath);
                        await this.connect(this.peripheralParams, true);
                        this.sendRemoteRequest('uploadSuccess', {aborted: flashExitCode === 'Aborted'});
                    } finally {
                        fs.rmSync(artifactPath, {force: true});
                    }
                    break;
                }

                const exitCode = await this.tool.build(code);`,
            'compiled artifact upload path'
        );
    }

    fs.writeFileSync(file, source);
};

patchLinkPackage();
copySerialportRuntimeIntoLink();
patchLinkIndex();
patchArduinoUploader();
patchSerialportSession();
removeUnusedNativeModules();
console.log('openblock-link patched for Dogoblock lightweight artifact upload');

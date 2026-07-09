const fs = require('fs');
const https = require('https');
const path = require('path');

const agentRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(agentRoot, '..');
const firmwareBaseUrl =
    'https://github.com/educarbr11/openblock-link-dogo/raw/refs/heads/main/firmwares/microbit';

const firmwareFiles = [
    'dogoblock-microbit-ble.hex',
    'dogoblock-microbit-ble-v2.hex',
    'dogoblock-microbit-realtime-v2.hex'
];

const copyFile = (source, target) => {
    if (!fs.existsSync(source)) {
        console.warn(`Dogoblock firmware not found: ${source}`);
        return false;
    }
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.copyFileSync(source, target);
    console.log(`copied ${path.relative(agentRoot, source)} -> ${path.relative(agentRoot, target)}`);
    return true;
};

const downloadFile = (url, target, redirectCount = 0) => new Promise((resolve, reject) => {
    if (redirectCount > 5) {
        reject(new Error(`Too many redirects while downloading ${url}`));
        return;
    }

    https.get(url, response => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
            response.resume();
            downloadFile(response.headers.location, target, redirectCount + 1).then(resolve, reject);
            return;
        }

        if (response.statusCode !== 200) {
            response.resume();
            reject(new Error(`Could not download ${url}: HTTP ${response.statusCode}`));
            return;
        }

        fs.mkdirSync(path.dirname(target), {recursive: true});
        const output = fs.createWriteStream(target);
        response.pipe(output);
        output.on('finish', () => {
            output.close(() => resolve(true));
        });
        output.on('error', reject);
    }).on('error', reject);
});

const syncMicrobitFirmwares = async () => {
    const sourceDir = path.join(workspaceRoot, 'openblock-link', 'firmwares', 'microbit');
    const targetDir = path.join(agentRoot, 'firmwares', 'microbit');
    let copied = 0;

    for (const fileName of firmwareFiles) {
        const target = path.join(targetDir, fileName);
        if (copyFile(path.join(sourceDir, fileName), target)) {
            copied++;
            continue;
        }

        const url = `${firmwareBaseUrl}/${fileName}`;
        console.log(`Downloading ${url}...`);
        await downloadFile(url, target);
        console.log(`downloaded ${url} -> ${path.relative(agentRoot, target)}`);
        copied++;
    }

    if (copied !== firmwareFiles.length) {
        throw new Error('Could not sync all Dogoblock micro:bit firmwares.');
    }
};

syncMicrobitFirmwares().catch(err => {
    console.error(err);
    process.exit(1);
});

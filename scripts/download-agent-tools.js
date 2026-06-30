const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const {extractFull} = require('node-7z');
const {path7za} = require('7zip-bin');

const releaseVersion = 'v2.11.1';
const releaseBaseUrl = `https://github.com/openblockcc/openblock-tools/releases/download/${releaseVersion}`;
const tmpRoot = path.resolve(__dirname, '..', 'tmp');
const toolsRoot = path.resolve(__dirname, '..', 'tools');

const assetsByPlatform = {
    darwin: 'openblock-tools-darwin-x64-v2.11.1.7z',
    linux: 'openblock-tools-linux-x64-v2.11.1.7z',
    win32: 'openblock-tools-win32-x64-ia32-v2.11.1.7z'
};

const download = (url, target, redirectCount = 0) => new Promise((resolve, reject) => {
    if (redirectCount > 5) {
        reject(new Error(`Too many redirects while downloading ${url}`));
        return;
    }

    https.get(url, response => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
            response.resume();
            download(response.headers.location, target, redirectCount + 1).then(resolve, reject);
            return;
        }

        if (response.statusCode !== 200) {
            response.resume();
            reject(new Error(`Could not download ${url}: HTTP ${response.statusCode}`));
            return;
        }

        fs.mkdirSync(path.dirname(target), {recursive: true});
        const file = fs.createWriteStream(target);
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', reject);
    }).on('error', reject);
});

const readUrl = async url => {
    const target = path.join(tmpRoot, path.basename(url));
    await download(url, target);
    return fs.readFileSync(target, 'utf8');
};

const sha256 = filePath => new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
});

const extractArchive = (archivePath, fileName) => new Promise((resolve, reject) => {
    fs.mkdirSync(toolsRoot, {recursive: true});
    console.log(`Extracting ${fileName} to tools...`);
    const stream = extractFull(archivePath, toolsRoot, {
        $bin: path7za,
        $progress: true
    });
    stream.on('end', resolve);
    stream.on('error', reject);
});

const getExpectedChecksum = async fileName => {
    const checksumText = await readUrl(`${releaseBaseUrl}/2.11.1-checksums-sha256.txt`);
    const line = checksumText.split(/\r?\n/).find(item => item.includes(fileName));
    if (!line) return null;
    return line.trim().split(/\s+/)[0];
};

const run = async () => {
    const fileName = assetsByPlatform[os.platform()];
    if (!fileName) {
        throw new Error(`Unsupported platform for Dogoblock Agent tools: ${os.platform()}`);
    }

    const archivePath = path.join(tmpRoot, fileName);
    const url = `${releaseBaseUrl}/${fileName}`;
    console.log(`Downloading ${fileName} from ${url}...`);
    await download(url, archivePath);

    const expectedChecksum = await getExpectedChecksum(fileName);
    if (expectedChecksum) {
        const actualChecksum = await sha256(archivePath);
        if (actualChecksum.toLowerCase() !== expectedChecksum.toLowerCase()) {
            throw new Error(`Checksum mismatch for ${fileName}`);
        }
        console.log(`Checksum verified for ${fileName}`);
    }

    await extractArchive(archivePath, fileName);
    console.log(`Successfully extracted ${fileName} to tools`);
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});

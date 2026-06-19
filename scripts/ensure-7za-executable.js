const fs = require('fs');
const {path7za} = require('7zip-bin');

if (process.platform === 'win32') {
    process.exit(0);
}

if (path7za && fs.existsSync(path7za)) {
    fs.chmodSync(path7za, 0o755);
    console.log(`Ensured executable permission for ${path7za}`);
}

const {spawnSync} = require('child_process');

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const env = {...process.env};

if (process.platform !== 'win32') {
    env.CXXFLAGS = `${env.CXXFLAGS || ''} -std=c++17`.trim();
}

const result = spawnSync(command, ['electron-builder', 'install-app-deps'], {
    stdio: 'inherit',
    env
});

process.exit(result.status || 0);

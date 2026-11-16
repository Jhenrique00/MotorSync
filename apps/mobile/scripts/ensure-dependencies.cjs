const fs = require('node:fs');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '..'));
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error('Instale Node.js 22.13 ou superior.');
  process.exit(1);
}
const manifest = require('../package.json');
const fingerprint = () =>
  crypto
    .createHash('sha256')
    .update(fs.readFileSync('package.json'))
    .update(fs.readFileSync('package-lock.json'))
    .digest('hex');
const stamp = 'node_modules/.motorsync-dependencies';
const missing = () =>
  Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).some(
    (name) => !fs.existsSync(path.join('node_modules', name, 'package.json')),
  );
const expected = fingerprint();
if (missing() || !fs.existsSync(stamp) || fs.readFileSync(stamp, 'utf8') !== expected) {
  console.log('Instalando dependências do lockfile, incluindo Inter e Playfair Display...');
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['ci', '--no-audit', '--no-fund'],
    { stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (result.error || result.status !== 0 || missing()) process.exit(1);
  fs.writeFileSync(stamp, expected);
}
console.log('Dependências verificadas.');

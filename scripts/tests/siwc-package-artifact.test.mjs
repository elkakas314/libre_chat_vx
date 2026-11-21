import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('VX install artifact contains every compiled SIWC module', () => {
  const metadata = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
  }));
  assert.equal(metadata.length, 1);
  assert.equal(metadata[0].name, '@librechat/vx');

  const packagedFiles = new Set(metadata[0].files.map((file) => file.path));
  const siwcModules = readdirSync(resolve(root, 'src/llm'))
    .filter((name) => /^siwc.*\.ts$/.test(name))
    .map((name) => `dist/src/llm/${name.replace(/\.ts$/, '.js')}`)
    .sort();

  assert.ok(siwcModules.length > 0, 'SIWC source modules are present');
  for (const modulePath of siwcModules) {
    assert.ok(packagedFiles.has(modulePath), `install artifact is missing ${modulePath}`);
  }
});

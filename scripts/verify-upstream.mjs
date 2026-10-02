import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '../upstream');
const expectedCommit = 'f10b1d91f1eee3a2c82d5247bf620351486b7c1b';

function git(...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}

const head = git('rev-parse', 'HEAD');
if (head !== expectedCommit) {
  throw new Error('UPSTREAM_COMMIT_MISMATCH expected=' + expectedCommit + ' actual=' + head);
}

const status = git('status', '--porcelain');
if (status) throw new Error('UPSTREAM_NOT_CLEAN');

const checks = [
  ['client/src/components/Chat/Presentation.tsx', '46a176099fa1e6ae1afae709c559a42a19c719fa'],
  ['client/src/components/Chat/Header.tsx', '1f1b9da3b2568b373b8dada66aaf1f6e73aa5a6a'],
  ['client/src/components/MCPUIResource/Renderer.tsx', 'f5bc460d19a51a920be50a269771343fda303365'],
  ['client/src/components/Chat/Input/ToolsDropdown.tsx', '64fc779bba4eb2536a5b16e946a2b79d91409b6c'],
];

for (const [path, expectedBlob] of checks) {
  const blob = git('rev-parse', 'HEAD:' + path);
  if (blob !== expectedBlob) {
    throw new Error('UPSTREAM_BLOB_MISMATCH path=' + path + ' expected=' + expectedBlob + ' actual=' + blob);
  }
}

const manifest = readFileSync(resolve(process.cwd(), 'overlay/UPSTREAM_INTEGRATION_MAP.json'));
console.log(JSON.stringify({
  status: 'PASS',
  upstream: head,
  checkedFiles: checks.length,
  manifestSha256: createHash('sha256').update(manifest).digest('hex')
}));

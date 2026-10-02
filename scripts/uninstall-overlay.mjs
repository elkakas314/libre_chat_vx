import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const upstream = resolve(process.argv[2] ?? '../upstream');

execFileSync('git', [
  '-C',
  upstream,
  'restore',
  '--source=HEAD',
  '--',
  'client/package.json',
  'client/src/components/Chat/Presentation.tsx'
], { stdio: 'inherit' });

rmSync(resolve(upstream, 'client/src/components/VX'), { recursive: true, force: true });
rmSync(resolve(upstream, 'packages/librechat-vx'), { recursive: true, force: true });
rmSync(resolve(upstream, '.librechat-vx-overlay.json'), { force: true });

console.log(JSON.stringify({ status: 'OVERLAY_REMOVED' }));

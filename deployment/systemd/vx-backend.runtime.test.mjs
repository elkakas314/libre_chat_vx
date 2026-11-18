import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const unitUrl = new URL('./vx-backend.service', import.meta.url);

test('backend service runs both the patch hook and npm backend on Node 24+', async () => {
  const unit = await readFile(unitUrl, 'utf8');
  const pathLine = unit.match(/^Environment=PATH=(\S+)$/m)?.[1];
  const patchLine = unit.match(/^ExecStartPre=(\S+)\/node /m)?.[1];

  assert.ok(pathLine, 'service PATH must be explicit');
  assert.ok(patchLine, 'patch hook must use an explicit Node binary');
  assert.match(pathLine, /%h\/\.nvm\/versions\/node\/v(\d+)\./);
  assert.match(patchLine, /%h\/\.nvm\/versions\/node\/v(\d+)\./);

  const pathVersion = Number(pathLine.match(/node\/v(\d+)\./)?.[1]);
  const patchVersion = Number(patchLine.match(/node\/v(\d+)\./)?.[1]);
  assert.ok(pathVersion >= 24, `backend PATH must select Node 24+, got ${pathVersion}`);
  assert.equal(patchVersion, pathVersion, 'patch and backend must use the same Node major');
  assert.match(unit, /^ExecStart=\/usr\/bin\/npm run backend$/m);
});

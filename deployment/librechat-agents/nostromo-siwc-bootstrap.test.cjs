'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { mkdtemp, chmod, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const Module = require('node:module');
const { initializeNostromoSiwc } = require('./nostromo-siwc-bootstrap.cjs');

test('bootstrap is disabled by default and validates owner-only host material before initialization', async () => {
  assert.deepEqual(initializeNostromoSiwc({ locals: {} }, {}), { state: 'DISABLED' });
  assert.throws(() => initializeNostromoSiwc({ locals: {} }, { NOSTROMO_SIWC_ENABLED: '1' }),
    /SIWC_HOST_CONFIGURATION_REQUIRED/);

  const directory = await mkdtemp(join(tmpdir(), 'nostromo-siwc-bootstrap-'));
  try {
    const hostIdFile = join(directory, 'host-id');
    const masterKeyFile = join(directory, 'master-key');
    const vaultDirectory = join(directory, 'vault');
    await writeFile(hostIdFile, 'urn:uuid:11111111-2222-4333-8444-555555555555', { mode: 0o600 });
    await writeFile(masterKeyFile, Buffer.alloc(32, 7), { mode: 0o600 });
    await import('node:fs/promises').then(({ mkdir }) => mkdir(vaultDirectory, { mode: 0o700 }));
    await chmod(vaultDirectory, 0o700);

    const originalLoad = Module._load;
    let registeredService;
    let capturedRouteResolver;
    let capturedKey;
    let capturedRouteInput;
    class FakeVault {
      constructor(_path, key) { capturedKey = key; }
    }
    class FakeService {
      constructor(options) { this.options = options; }
      registerLibreChat(app, resolveRoute) {
        registeredService = this;
        capturedRouteResolver = resolveRoute;
        app.locals.nostromoSiwcConnectionService = this;
        return () => { delete app.locals.nostromoSiwcConnectionService; };
      }
      createNativeInferenceRouteResolver(readInput) {
        return async (context) => {
          capturedRouteInput = await readInput(context);
          return 'central-router-result';
        };
      }
    }
    Module._load = function(request, parent, isMain) {
      if (request.endsWith('/siwcProtectedVault.js')) return { SiwcProtectedFileVault: FakeVault };
      if (request.endsWith('/siwcConnectionService.js')) return { SiwcConnectionService: FakeService };
      return originalLoad.call(this, request, parent, isMain);
    };
    try {
      const routeInput = { routes: [{ evidence: 'LIVE_READBACK' }] };
      const app = { locals: { nostromoReadNativeInferenceRouteInput: async () => routeInput } };
      const result = initializeNostromoSiwc(app, {
        NOSTROMO_SIWC_ENABLED: '1',
        NOSTROMO_SIWC_HOST_ID_FILE: hostIdFile,
        NOSTROMO_SIWC_MASTER_KEY_FILE: masterKeyFile,
        NOSTROMO_SIWC_VAULT_DIR: vaultDirectory,
      });
      assert.equal(result.state, 'CONFIGURED');
      assert.equal(app.locals.nostromoSiwcConnectionService, registeredService);
      assert.equal(registeredService.options.hostId, 'urn:uuid:11111111-2222-4333-8444-555555555555');
      assert.equal(await capturedRouteResolver({}), 'central-router-result');
      assert.equal(capturedRouteInput, routeInput);
      assert.deepEqual([...capturedKey], Array(32).fill(0), 'bootstrap zeroes its in-memory key buffer');
      result.unregister();
      assert.equal(app.locals.nostromoSiwcConnectionService, undefined);
      delete app.locals.nostromoReadNativeInferenceRouteInput;
      await assert.rejects(capturedRouteResolver({}), /SIWC_ROUTE_READBACK_SOURCE_UNAVAILABLE/);
    } finally {
      Module._load = originalLoad;
    }

    await chmod(masterKeyFile, 0o644);
    assert.throws(() => require('./nostromo-siwc-bootstrap.cjs').protectedFile(masterKeyFile, 32),
      /SIWC_HOST_FILE_UNSAFE/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

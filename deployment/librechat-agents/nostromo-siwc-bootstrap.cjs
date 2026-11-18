'use strict';

const { lstatSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

function protectedFile(path, expectedBytes) {
  if (typeof path !== 'string' || !path || !require('node:path').isAbsolute(path)) {
    throw new Error('SIWC_HOST_FILE_PATH_REQUIRED');
  }
  let stat;
  try { stat = lstatSync(path); } catch { throw new Error('SIWC_HOST_FILE_UNAVAILABLE'); }
  const uid = process.getuid?.();
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o077) !== 0 ||
      (uid !== undefined && stat.uid !== uid) || stat.size !== expectedBytes) {
    throw new Error('SIWC_HOST_FILE_UNSAFE');
  }
  try { return readFileSync(path); } catch { throw new Error('SIWC_HOST_FILE_UNAVAILABLE'); }
}

function initializeNostromoSiwc(app, env = process.env) {
  if (env.NOSTROMO_SIWC_ENABLED !== '1') return { state: 'DISABLED' };
  const hostIdFile = env.NOSTROMO_SIWC_HOST_ID_FILE;
  const masterKeyFile = env.NOSTROMO_SIWC_MASTER_KEY_FILE;
  const vaultRoot = env.NOSTROMO_SIWC_VAULT_DIR;
  if (!hostIdFile || !masterKeyFile || !vaultRoot) throw new Error('SIWC_HOST_CONFIGURATION_REQUIRED');

  const hostBytes = protectedFile(hostIdFile, 45);
  const hostId = hostBytes.toString('utf8');
  if (!/^urn:uuid:[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(hostId)) {
    throw new Error('SIWC_HOST_ID_INVALID');
  }
  const masterKey = protectedFile(masterKeyFile, 32);
  const vaultPath = resolve(vaultRoot);
  let vaultStat;
  try { vaultStat = lstatSync(vaultPath); } catch { throw new Error('SIWC_VAULT_DIRECTORY_UNAVAILABLE'); }
  const uid = process.getuid?.();
  if (!vaultStat.isDirectory() || vaultStat.isSymbolicLink() || (vaultStat.mode & 0o077) !== 0 ||
      (uid !== undefined && vaultStat.uid !== uid)) {
    masterKey.fill(0);
    throw new Error('SIWC_VAULT_DIRECTORY_UNSAFE');
  }

  try {
    const { SiwcProtectedFileVault } = require('@librechat/vx/dist/src/llm/siwcProtectedVault.js');
    const { SiwcConnectionService } = require('@librechat/vx/dist/src/llm/siwcConnectionService.js');
    const vault = new SiwcProtectedFileVault(vaultPath, masterKey);
    const service = new SiwcConnectionService({
      hostId,
      actualAppName: 'LibreChat VX NOSTROMO',
      vault,
    });
    const resolveRoute = (context) => {
      const resolver = app.locals?.nostromoResolveNativeInferenceRoute;
      if (typeof resolver !== 'function') throw new Error('SIWC_NATIVE_ROUTE_ADAPTER_UNAVAILABLE');
      return resolver(context);
    };
    const unregister = service.registerLibreChat(app, resolveRoute);
    return { state: 'CONFIGURED', unregister };
  } finally {
    masterKey.fill(0);
  }
}

module.exports = { initializeNostromoSiwc, protectedFile };

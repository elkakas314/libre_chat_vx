import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const upstream = resolve(process.argv[2] ?? '../upstream');
const sourceRoot = resolve(process.cwd());
const packageRoot = resolve(upstream, 'packages/librechat-vx');
const expectedCommit = 'f10b1d91f1eee3a2c82d5247bf620351486b7c1b';

function git(...args) {
  return execFileSync('git', ['-C', upstream, ...args], { encoding: 'utf8' }).trim();
}

if (git('rev-parse', 'HEAD') !== expectedCommit) throw new Error('UPSTREAM_COMMIT_MISMATCH');
if (git('status', '--porcelain')) throw new Error('UPSTREAM_NOT_CLEAN');

const presentationPath = resolve(upstream, 'client/src/components/Chat/Presentation.tsx');
const presentationBlob = git('rev-parse', 'HEAD:client/src/components/Chat/Presentation.tsx');
if (presentationBlob !== '46a176099fa1e6ae1afae709c559a42a19c719fa') {
  throw new Error('PRESENTATION_BLOB_MISMATCH');
}

rmSync(packageRoot, { recursive: true, force: true });
mkdirSync(packageRoot, { recursive: true });

for (const entry of ['package.json', 'tsconfig.json', 'src', 'contracts', 'config']) {
  cpSync(resolve(sourceRoot, entry), resolve(packageRoot, entry), { recursive: true });
}

const clientPackagePath = resolve(upstream, 'client/package.json');
const clientPackage = JSON.parse(readFileSync(clientPackagePath, 'utf8'));
clientPackage.dependencies ??= {};
clientPackage.dependencies['@librechat/vx'] = '*';
writeFileSync(clientPackagePath, JSON.stringify(clientPackage, null, 2) + '\n');

const bridgeDir = resolve(upstream, 'client/src/components/VX');
mkdirSync(bridgeDir, { recursive: true });
cpSync(
  resolve(sourceRoot, 'overlay/upstream/VXCockpitBridge.tsx'),
  resolve(bridgeDir, 'VXCockpitBridge.tsx')
);
cpSync(
  resolve(sourceRoot, 'overlay/upstream/VXCockpit.css'),
  resolve(bridgeDir, 'VXCockpit.css')
);

let presentation = readFileSync(presentationPath, 'utf8');
const importAnchor = "import AppChatSurface from '~/components/Chat/Surface';";
if (!presentation.includes(importAnchor)) throw new Error('PRESENTATION_IMPORT_ANCHOR_MISSING');
presentation = presentation.replace(
  importAnchor,
  importAnchor + "\nimport VXCockpitBridge from '~/components/VX/VXCockpitBridge';"
);

const panelAnchor = 'const panelElement = artifactsElement ?? subagentElement;';
if (!presentation.includes(panelAnchor)) throw new Error('PRESENTATION_PANEL_ANCHOR_MISSING');
presentation = presentation.replace(
  panelAnchor,
  [
    "const vxEnabled = typeof window !== 'undefined' && window.localStorage.getItem('librechat-vx-cockpit') === '1';",
    "  const [vxContextOpen, setVxContextOpen] = useState(false);",
    "  const vxContextButtonRef = useRef<HTMLButtonElement>(null);",
    "  const closeVxContext = useCallback(() => {",
    "    setVxContextOpen(false);",
    "    requestAnimationFrame(() => vxContextButtonRef.current?.focus());",
    "  }, []);",
    "  const vxNativePanelBusy = artifactsElement != null || subagentElement != null;",
    "  useEffect(() => {",
    "    if (vxNativePanelBusy) setVxContextOpen(false);",
    "  }, [vxNativePanelBusy]);",
    "  const vxCockpitElement = vxEnabled && vxContextOpen && !vxNativePanelBusy",
    "    ? <VXCockpitBridge onClose={closeVxContext} />",
    "    : null;",
    "  const panelElement = artifactsElement ?? subagentElement ?? vxCockpitElement;",
  ].join('\n')
);
const reactImportAnchor = "import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';";
if (!presentation.includes(reactImportAnchor)) throw new Error('PRESENTATION_REACT_HOOKS_ANCHOR_MISSING');
presentation = presentation.replace(reactImportAnchor,
  "import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';"
);

const mainAnchor = '<main className="flex h-full flex-col overflow-y-auto" role="main">';
if (!presentation.includes(mainAnchor)) throw new Error('PRESENTATION_MAIN_ANCHOR_MISSING');
presentation = presentation.replace(
  mainAnchor,
  [
    '<main className="relative flex h-full flex-col overflow-y-auto" role="main">',
    '  {vxEnabled ? (',
    '    <button ref={vxContextButtonRef} type="button" className="vx-context-launcher"',
    '      aria-label={vxContextOpen ? "Contexto NOSTROMO abierto" : "Abrir contexto NOSTROMO"}',
    '      aria-expanded={vxContextOpen && !vxNativePanelBusy} aria-controls="vx-context-panel"',
    '      disabled={vxNativePanelBusy}',
    '      onClick={() => setVxContextOpen((current) => !current)}>',
    '      Contexto',
    '    </button>',
    '  ) : null}',
  ].join('\n')
);

writeFileSync(presentationPath, presentation);

writeFileSync(
  resolve(upstream, '.librechat-vx-overlay.json'),
  JSON.stringify({
    schema: 'libre-chat-vx.overlay-install.v1',
    upstreamCommit: expectedCommit,
    packagePath: 'packages/librechat-vx',
    featureFlag: 'localStorage[librechat-vx-cockpit]=1',
    mutationEnabled: false
  }, null, 2) + '\n'
);

console.log(JSON.stringify({
  status: 'OVERLAY_INSTALLED',
  upstreamCommit: expectedCommit,
  packagePath: packageRoot,
  uiPatch: 'FEATURE_FLAGGED_SHARED_PANEL',
  mutationEnabled: false
}));

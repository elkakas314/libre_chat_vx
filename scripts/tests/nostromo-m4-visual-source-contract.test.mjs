/** M4 SOURCE contract: inspect existing UI files as text; no DOM, backend,
 * OAuth, MCP invocation, service health, or navigation E2E is claimed.
 * Only existing primitives from node:test and node:fs are required.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const read=rel=>readFileSync(fileURLToPath(new URL('../../'+rel,import.meta.url)),'utf8');

test('M4 native bridge mounts the existing Hub/HUD only as SOURCE context',()=>{
 const bridge=read('overlay/upstream/VXCockpitBridge.tsx');
 assert.match(bridge,/from '@librechat\/vx'/);
 assert.match(bridge,/<TentaculoHub snapshot=\{nostromoHubSourceSnapshot\(\)\} \/>/);
 assert.match(bridge,/<TentaculoHud cards=\{projectTentaculoHud\(\[\]\)\}/);
 assert.match(bridge,/const \[showHub, setShowHub\] = useState\(false\)/);
 assert.match(bridge,/const \[showAutonomous, setShowAutonomous\] = useState\(false\)/);
 assert.match(bridge,/setShowHub\(false\)/);
 assert.doesNotMatch(bridge,/\b(?:fetch|WebSocket|EventSource|execFile|spawn)\s*\(/);
});

test('M4 neutral labels and offline text do not assert an installed agent/MCP',()=>{
 const bridge=read('overlay/upstream/VXCockpitBridge.tsx');
 assert.match(bridge,/Agente candidato de terminal para el Lenovo/);
 assert.match(bridge,/MCP con pruebas SOURCE, sin enlace LIVE con LibreChat comprobado/);
 assert.match(bridge,/Modo local candidato: agente y MCP propio de terminal sin enlace LIVE acreditado/);
 assert.match(bridge,/ENLACE NO VERIFICADO/);
 assert.match(bridge,/ChatGPT:<\/strong> pendiente de autorización OAuth/);
 assert.match(bridge,/Esta cabina no inicia procesos ni concede permisos/);
 assert.doesNotMatch(bridge,/Tu agente de terminal en el Lenovo/);
});

test('M4 source inventory explicitly refuses to infer installed/live/authority',()=>{
 const hub=read('src/hud/nostromoHub.ts');
 assert.match(hub,/status:'SOURCE_INVENTORY_NO_RUNTIME_READBACK'/);
 assert.match(hub,/mcpInstalled:null,chatgptConnected:null,materialVerified:false/);
 assert.match(hub,/authority:false,readOnly:true/);
 assert.match(hub,/const items=sourceNodes\.map\(item=>\(\{\.\.\.item\}\)\)/);
 assert.match(hub,/sourceRef:'deployment\/nostromo-mcp\/server\.mjs',status:'SOURCE'/);
 const view=read('src/ui/TentaculoHub.tsx');
 assert.match(view,/snapshot:NostromoHubSnapshot/);
 assert.match(view,/createTentaculoHubTree\(snapshot\.items\)/);
 assert.match(view,/vx-hub-source-badge/);
 assert.match(view,/MCP sin vínculo LIVE verificado/);
 assert.doesNotMatch(view,/\bonClick\s*=/);
});

test('M4 HUD uses no fabricated target observation and no automatic 3-card focus',()=>{
 const bridge=read('overlay/upstream/VXCockpitBridge.tsx');
 const hud=read('src/ui/TentaculoHud.tsx');
 const projector=read('src/hud/tentaculoHud.ts');
 assert.match(bridge,/projectTentaculoHud\(\[\]\)/);
 assert.match(hud,/if\(!active\)return null/);
 assert.match(projector,/!rows\.length\?'UNCONFIGURED'/);
 assert.match(projector,/peerVerified===true/);
 assert.match(projector,/readOnly:true/);
 assert.match(bridge,/Este es el estado del enlace con NOSTROMO, no la salud de cada sistema/);
});

test('M4 native overlay reconciliation is explicitly preview-first and guarded',()=>{
 const reconcile=read('scripts/reconcile-native-visual.mjs');
 assert.match(reconcile,/const apply=process\.argv\.includes\('--apply'\)/);
 assert.match(reconcile,/const files=\['VXCockpitBridge\.tsx','VXCockpit\.css'\]/);
 assert.match(reconcile,/visualUpdateDisposition/);
 assert.match(reconcile,/createNostromoBackupDir/);
 assert.match(reconcile,/Presentation and package workspace are NOT modified/);
});

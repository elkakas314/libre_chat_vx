import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {selectedTools} from '../tools.mjs';

const fragment=readFileSync(new URL('../librechat-mcp.fragment.yaml',import.meta.url),'utf8');
const candidate=JSON.parse(readFileSync(new URL('../../../agents/nostromo-autonomo/agent.candidate.json',import.meta.url),'utf8'));
const read=(expression)=>fragment.match(expression)?.[1]??null;

test('M3 YAML uses one owner-managed stdio MCP, disabled until provisioned',()=>{
 assert.equal([...fragment.matchAll(/^mcpServers:$/gm)].length,1);
 assert.equal([...fragment.matchAll(/^  nostromo-autonomo:$/gm)].length,1);
 assert.match(fragment,/^    type: stdio$/m);
 assert.match(fragment,/^    command: node$/m);
 assert.match(fragment,/^      - \/home\/elkakas314\/librechat\/vx\/deployment\/nostromo-mcp\/server\.mjs$/m);
 assert.match(fragment,/^    chatMenu: false\b/m);
 assert.equal(read(/^      NOSTROMO_MCP_ENABLED: '([^']+)'$/m),'0');
 assert.match(fragment,/^      NOSTROMO_ALLOWED_ROOTS: \/home\/elkakas314\/librechat\/vx:\/home\/elkakas314\/librechat\/upstream$/m);
 assert.equal(/^\s*(?:url|oauth|requiresOAuth):/m.test(fragment),false);
 assert.ok(Number(read(/^    initTimeout: (\d+)$/m))>0);
 assert.ok(Number(read(/^    timeout: (\d+)$/m))>=30000);
});

test('M3 native agent remains candidate; tools are existing server, not new executor',()=>{
 assert.equal(candidate.slug,'nostromo-autonomo');
 assert.deepEqual(candidate.mcpRefs,['nostromo-autonomo']);
 assert.equal(candidate.enabled,false);
 assert.equal(candidate.model,null);
 assert.equal(candidate.authority,false);
 assert.equal(candidate.liveInstallation,'NO_VERIFICADO');
 assert.equal(candidate.createVia,'LIBRECHAT_NATIVE_AGENT_BUILDER');
});

test('M3 agent metadata matches the persistent job journal and conservative restart recovery',()=>{
 assert.equal(candidate.taskExecution.cliAsync,'SOURCE_BOUNDED_JOBS_PERSIST_WHEN_PRIVATE_STATE_DIR_CONFIGURED');
 assert.equal(candidate.taskExecution.cliAsyncLedger,
   'PRIVATE_HOST_LOCAL_JSON_SNAPSHOTS_FSYNC_RENAME_WHEN_STATE_DIR_CONFIGURED');
 assert.equal(candidate.taskExecution.restartRecovery,
   'SOURCE_COMPLETED_HISTORY_RESTORED_RUNNING_TO_UNKNOWN_OUTCOME_NO_REPLAY_WHEN_STATE_DIR_CONFIGURED');
 const jobs=readFileSync(new URL('../async-jobs.mjs',import.meta.url),'utf8');
 const server=readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
 assert.match(server,/const taskStateDir=approvalDir\?path\.join\(approvalDir,'jobs'\):''/);
 assert.match(jobs,/persistent snapshots live in a private host-local directory/i);
 assert.match(jobs,/row\.status='UNKNOWN_OUTCOME'/);
 assert.match(jobs,/retrySafe:false/);
});

test('M3 safe R0 canary offers preview + file read but not any process execution',()=>{
 const allow=selectedTools('nostromo_terminal_preparar,nostromo_archivo_leer');
 assert.deepEqual([...allow].sort(),[
  'nostromo_estado','nostromo_herramientas','nostromo_auditoria_r0','nostromo_terminal_preparar','nostromo_archivo_leer'
 ].sort());
 assert.equal(allow.has('nostromo_terminal_ejecutar'),false);
 assert.equal(allow.has('nostromo_tarea_iniciar'),false);
 assert.equal(allow.has('nostromo_tarea_cancelar'),false);
 assert.equal(allow.has('nostromo_git_inspeccionar'),false);
 assert.equal(read(/^      NOSTROMO_MCP_ENABLED: '([^']+)'$/m),'0');
});

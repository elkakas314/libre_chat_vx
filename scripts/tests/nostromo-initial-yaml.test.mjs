import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {renderInitialNostromoYaml} from '../nostromo-initial-yaml.mjs';

const fragment=readFileSync(new URL('../../deployment/nostromo-mcp/librechat-mcp.fragment.yaml',import.meta.url),'utf8');
const example='# upstream example\nversion: 1.3.17\ncache: true\n';
test('pinned upstream config creates only one disabled stdio MCP entry',()=>{
 const result=renderInitialNostromoYaml({example,fragment});
 assert.match(result,/^version: 1\.3\.17$/m);
 assert.equal([...result.matchAll(/^mcpServers:$/gm)].length,1);
 assert.match(result,/NOSTROMO_MCP_ENABLED: '0'/);
 assert.match(result,/type: stdio/);
 assert.match(result,/nostromo-autonomo:/);
 assert.ok(!result.includes('enabled: true'));
});
test('config renderer fails closed on version drift, enabled grant or missing identity',()=>{
 for(const input of [
  {example:'version: 1.3.18\n',fragment},
  {example,fragment:fragment.replace("NOSTROMO_MCP_ENABLED: '0'","NOSTROMO_MCP_ENABLED: '1'")},
  {example,fragment:fragment.replace(/nostromo-autonomo:/g,'other-mcp:')},
  {example,fragment:fragment.replace('type: stdio','type: http')}
 ]){
  assert.throws(()=>renderInitialNostromoYaml(input));
 }
});
test('configuration stager refuses unknown flags before touching the host',()=>{
 const p=fileURLToPath(new URL('../stage-nostromo-mcp-config.mjs',import.meta.url));
 const res=spawnSync(process.execPath,[p,'--write-anywhere'],{encoding:'utf8',timeout:10000});
 assert.equal(res.status,2);
 assert.equal(JSON.parse(res.stdout).status,'UNKNOWN_FLAG_REFUSED');
 assert.equal(JSON.parse(res.stdout).mutated,false);
});

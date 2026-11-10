import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,selectedTools,describeTools} from '../tools.mjs';

test('single MCP catalog includes health, tool management and terminal preview/execute',()=>{
  const set=selectedTools(undefined);
  assert.equal(catalog.length,4);
  assert.deepEqual([...set].sort(),catalog.map(x=>x.name).sort());
  assert.ok(describeTools(set).every(x=>x.enabled));
});
test('owner may disable terminal while retaining introspection',()=>{
  const set=selectedTools('');
  assert.deepEqual([...set].sort(),['nostromo_estado','nostromo_herramientas']);
  assert.equal(describeTools(set).filter(x=>x.enabled).length,2);
});
test('unknown, duplicate or interpolated tool names fail closed',()=>{
  for(const s of ['host_exec','nostromo_estado,nostromo_estado',
    'nostromo_terminal_ejecutar,evil','nostromo_terminal_ejecutar\nfoo']){
    assert.throws(()=>selectedTools(s),/CATALOG_INVALID/);
  }
});

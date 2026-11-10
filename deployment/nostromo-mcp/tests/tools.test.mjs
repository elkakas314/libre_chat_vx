import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,selectedTools,describeTools} from '../tools.mjs';

test('single MCP catalog includes health, tool management and terminal preview/execute',()=>{
  const set=selectedTools(undefined);
  assert.equal(catalog.length,10);
  assert.deepEqual([...set].sort(),catalog.slice(0,4).map(x=>x.name).sort());
  assert.equal(describeTools(set).filter(x=>x.enabled).length,4);
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

test('inspection tools remain opt-in and owner-configured',()=>{
  const set=selectedTools('nostromo_archivo_leer,nostromo_git_inspeccionar,nostromo_metricas');
  assert.deepEqual([...set].sort(),[
    'nostromo_estado','nostromo_herramientas','nostromo_archivo_leer',
    'nostromo_git_inspeccionar','nostromo_metricas'
  ].sort());
  assert.equal(set.has('nostromo_terminal_ejecutar'),false);
});

test('asynchronous start/status/cancel are opt-in atomically',()=>{
  const trio='nostromo_tarea_iniciar,nostromo_tarea_estado,nostromo_tarea_cancelar';
  const tools=selectedTools(trio);
  assert.equal(tools.has('nostromo_tarea_iniciar'),true);
  assert.equal(tools.has('nostromo_tarea_estado'),true);
  assert.equal(tools.has('nostromo_tarea_cancelar'),true);
  assert.equal(tools.has('nostromo_terminal_ejecutar'),false);
  assert.throws(()=>selectedTools('nostromo_tarea_iniciar'),/ASYNC_TRIO_REQUIRED/);
  assert.throws(()=>selectedTools('nostromo_tarea_iniciar,nostromo_tarea_estado'),/ASYNC_TRIO_REQUIRED/);
  assert.throws(()=>selectedTools(trio+',nostromo_terminal_ejecutar'),/ONE_CLI_EXECUTION_MODE/);
});

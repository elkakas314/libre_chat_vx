import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildBootstrap } from '../src/operating/bootstrap';
import type { OperatingGap, OperatingProof, OperatingSnapshot } from '../src/operating/types';

const readJson = (path:string):any => JSON.parse(readFileSync(path,'utf8'));

test('operating current gaps use actual OperatingGap field names and hide external/deferred from active selection', () => {
  const document=readJson('operating/GAPS_CURRENT.json');
  const gaps=document.gaps as OperatingGap[];
  assert.ok(gaps.length>=6);
  const ids=new Set<string>();
  for(const gap of gaps) {
    assert.equal(typeof gap.gapId,'string');
    assert.equal(typeof gap.requiresLive,'boolean');
    assert.equal(Array.isArray(gap.dependencies),true);
    assert.equal(typeof gap.priority,'number');
    assert.equal(typeof gap.scope,'string');
    assert.equal(ids.has(gap.gapId),false,'duplicate gap id');
    ids.add(gap.gapId);
    assert.equal(gap.requiresLive,true);
  }
  assert.ok(document.design_review_queue.some((entry:any)=>entry.id==='LC-NOSTROMO-SEMANTIC-BRIDGE'));
  assert.equal(ids.has('LC-M3-TRANSPORT-LIVE'),false);
  assert.equal(ids.has('LC-M3-R0-BINDING'),false);
  assert.equal(document.optional_reentry.includes('Router Steward'),true);
  const proofs=readJson('operating/PROOFS_CURRENT.json').proofs as OperatingProof[];
  for(const proof of proofs) {
    assert.equal(typeof proof.proofId,'string');
    assert.equal(typeof proof.proofClass,'string');
    assert.equal(typeof proof.dependencyFingerprint,'string');
    assert.equal(Array.isArray(proof.evidenceRefs),true);
    assert.equal(Array.isArray(proof.dependencies),true);
  }

  const snapshot:OperatingSnapshot={
    snapshotId:'verified-schema',
    mode:'SOURCE_ONLY',
    evidenceCutoffHead:'baseline',
    targetVersion:8,
    gaps,
    proofs,
    ownership:[],
    doNotTouch:['MANOJOS3','VX13'],
    runtime:{status:'NO_VERIFICADO'},
  };
  const bootstrap=buildBootstrap(snapshot);
  assert.deepEqual(bootstrap.eligible_source_only,[]);
  assert.ok(bootstrap.blocked_live.includes('LC-CF-AIG-BINDING'));
  assert.equal(bootstrap.closeout,'INCOMPLETE');
  assert.equal(bootstrap.next_action,'BIND_LIVE_AND_REVALIDATE');
});

test('target canon has only seven non-coding routes and semantic idea remains review-only', () => {
  const target=readJson('operating/TARGET_CANON.json');
  const routes=Object.values(target.desired.provider_mesh.semantic_profiles) as string[];
  assert.equal(new Set(routes).size,7);
  assert.equal(routes.some(x=>x.includes('codigo')),false);
  assert.equal(target.desired.transport_topology.manojos3_resource_reuse,false);
  assert.equal(target.desired.transport_topology.manojos3_transport_convergence,'DEFERRED_DO_NOT_TOUCH_NOW');
  const skills=readJson('config/skills.current.json');
  assert.equal(skills.catalog.length,10);
  assert.equal(skills.legacy_compatibility.length,2);
  assert.equal(skills.catalog.some((item:any)=>item.name==='nostromo-extension-review'),true);
});

test('operating gap/proof JSON Schemas match CURRENT camelCase data and allow historical proof metadata', () => {
  const pairs = [
    { schema: 'contracts/operating-gap.schema.json', data: readJson('operating/GAPS_CURRENT.json').gaps },
    { schema: 'contracts/operating-proof.schema.json', data: readJson('operating/PROOFS_CURRENT.json').proofs },
  ];
  for (const pair of pairs) {
    const schema=readJson(pair.schema);
    assert.equal(schema.additionalProperties,false);
    for (const item of pair.data) {
      for (const required of schema.required as string[]) {
        assert.ok(Object.hasOwn(item,required),pair.schema+': missing '+required);
      }
      for (const key of Object.keys(item)) {
        assert.ok(Object.hasOwn(schema.properties,key),pair.schema+': undeclared '+key);
      }
    }
  }
});

test('operating bootstrap CURRENT fields are declared by its versioned JSON Schema', () => {
  const schema=readJson('contracts/operating-bootstrap.schema.json');
  const bootstrap=readJson('operating/BOOTSTRAP_CURRENT.json');
  assert.equal(bootstrap.schema,'libre-chat-vx.operating-bootstrap.v2');
  assert.equal(schema.additionalProperties,false);
  for (const required of schema.required as string[]) {
    assert.ok(Object.hasOwn(bootstrap,required),'bootstrap missing '+required);
  }
  for (const key of Object.keys(bootstrap)) {
    assert.ok(Object.hasOwn(schema.properties,key),'undeclared bootstrap field '+key);
  }
  assert.equal(bootstrap.runtime.status,'NO_VERIFICADO');
  assert.equal(bootstrap.closeout,'INCOMPLETE');
});

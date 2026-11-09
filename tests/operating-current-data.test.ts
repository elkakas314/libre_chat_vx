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
  assert.equal(bootstrap.runtime.status,'NO_DEPLOYMENT_EVIDENCE');
  assert.equal(bootstrap.closeout,'INCOMPLETE');
});

test('Skill Sync two-stage source canary selects physical aliases first and only the 10 active roots after LIVE gate', () => {
  const catalog=readJson('config/skills.current.json');
  const active=(catalog.catalog as Array<{name:string}>).map(s=>s.name);
  const aliases=(catalog.legacy_compatibility as Array<{name:string}>).map(s=>s.name);
  assert.equal(active.length,10);
  assert.equal(aliases.length,2);
  assert.equal(new Set([...active,...aliases]).size,12);
  for (const name of [...active,...aliases]) {
    assert.ok(readFileSync('skills/'+name+'/SKILL.md','utf8').includes('name: '+name),'missing skill file '+name);
  }
  const readStage=(stage:number)=>readFileSync('deployment/skill-sync/librechat.skill-sync-stage'+stage+'.example.yaml','utf8');
  const one=readStage(1),two=readStage(2);
  const paths=(yaml:string)=>yaml.split('\n').map(s=>s.trim()).filter(s=>s.startsWith('- skills')).map(s=>s.replace(/^- /,''));
  assert.deepEqual(paths(one),['skills']);
  assert.deepEqual(paths(two),active.map(n=>'skills/'+n));
  assert.match(one,/skillDiscoveryDepth: 1/);
  assert.match(two,/skillDiscoveryDepth: 0/);
  for (const yaml of [one,two]) {
    assert.match(yaml,/id: nostromo-vx-skills/);
    assert.match(yaml,/ref: handoff_current_bootstrps/);
    assert.match(yaml,/runOnStartup: false/);
    assert.match(yaml,/token: '\$\{GITHUB_SKILLS_TOKEN\}'/);
    assert.doesNotMatch(yaml,/credentialKey:/);
    assert.doesNotMatch(yaml,/GITHUB_TOKEN:\s*gh[pousr]_/);
  }
  assert.equal(active.some(x=>aliases.includes(x)),false);
});

test('operating gap scalar constraints follow declared schema and reject invalid SOURCE rows', () => {
  const schema=readJson('contracts/operating-gap.schema.json');
  const rows=readJson('operating/GAPS_CURRENT.json').gaps as Array<Record<string,unknown>>;
  const props=schema.properties as Record<string,{
    type?:string | string[];
    enum?:string[];
    minimum?:number;
    minLength?:number;
    items?:{type:string};
  }>;
  const errors=(row:Record<string,unknown>):string[] => {
    const violations:string[]=[];
    for (const key of schema.required as string[]) {
      if (!Object.hasOwn(row,key)) violations.push('missing:'+key);
    }
    for (const [key,value] of Object.entries(row)) {
      const property=props[key];
      if (!property) {
        if (schema.additionalProperties===false) violations.push('undeclared:'+key);
        continue;
      }
      const types=property.type===undefined ? [] : Array.isArray(property.type) ? property.type : [property.type];
      const matches=(type:string):boolean =>
        type==='null' ? value===null :
        type==='array' ? Array.isArray(value) :
        type==='integer' ? typeof value==='number' && Number.isInteger(value) :
        type==='string' ? typeof value==='string' :
        type==='boolean' ? typeof value==='boolean' : false;
      if (types.length && !types.some(matches)) violations.push('type:'+key);
      if (property.enum && !property.enum.includes(value as string)) violations.push('enum:'+key);
      if (property.minLength!==undefined && typeof value==='string' && value.length<property.minLength) {
        violations.push('minLength:'+key);
      }
      if (property.minimum!==undefined && typeof value==='number' && value<property.minimum) {
        violations.push('minimum:'+key);
      }
      if (property.items?.type==='string' && Array.isArray(value) && value.some(v=>typeof v!=='string')) {
        violations.push('items:'+key);
      }
    }
    return violations;
  };
  assert.ok(rows.length>0);
  for (const row of rows) assert.deepEqual(errors(row),[],row.gapId as string);
  const valid=rows[0];
  const invalid=[
    {...valid,state:'LIVE_VERIFIED'},
    {...valid,priority:-1},
    {...valid,priority:1.5},
    {...valid,dependencies:[42]},
    {...valid,requiresLive:'true'},
    {...valid,summary:''},
    {...valid,unrecognized:true},
  ];
  for (const row of invalid) assert.ok(errors(row).length>0,'invalid operating gap accepted');
});

test('bootstrap runtime field enums match SPEC, and missing LIVE readback never claims a deployment', () => {
  const schema=readJson('contracts/operating-bootstrap.schema.json');
  const spec=readJson('SPEC.json');
  const gap=readJson('contracts/operating-gap.schema.json');
  const runtimeSchema=schema.properties.runtime;
  const runtimeFields=['status','librechat','cloudflare_gateway','skill_sync','events','tailscale_serve'];
  for(const field of runtimeFields){
    const allowed=field==='status'
      ? spec.meta.estado_runtime_enum.filter((state:string)=>state!=='NOT_DEPLOYED')
      : spec.meta.estado_runtime_enum;
    assert.deepEqual(runtimeSchema.properties[field].enum,allowed,'enum drift '+field);
  }
  assert.deepEqual(runtimeSchema.properties.targets.enum,['GATED',...gap.properties.state.enum]);
  assert.equal(runtimeSchema.additionalProperties,false);
  const valid=readJson('operating/BOOTSTRAP_CURRENT.json');
  for(const [field,value] of Object.entries(valid.runtime)) {
    const property=runtimeSchema.properties[field];
    assert.ok(property,'undeclared runtime field '+field);
    if(property.enum) assert.ok(property.enum.includes(value),'invalid runtime field '+field);
  }
  for(const mode of ['SOURCE_ONLY','LIVE_BOUND'] as const){
    const snapshot:OperatingSnapshot={
      snapshotId:'bootstrap-no-host-fixture',mode,evidenceCutoffHead:'test-source',
      gaps:[],proofs:[],ownership:[],doNotTouch:['MANOJOS3','VX13'],
    };
    const projection=buildBootstrap(snapshot);
    assert.equal(projection.runtime.status,'NO_DEPLOYMENT_EVIDENCE');
  }
});

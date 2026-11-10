import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NostromoHostControlBridge,
  type HostControlPort,
  type HostIngressProof,
  type ExistingHostGrantProvider,
} from '../src/host/hostControlBridge';

const now=1_000_000;
const proof:HostIngressProof={
  mechanism:'MTLS_VERIFIED',target:'HOST_CONTROL',principalRef:'host-local-operator',
  observedAtMs:now-1_000,expiresAtMs:now+30_000,
};
const allowed={
  enabled:true,
  allowedServices:['manojos3-core.service'],
  allowedRepositories:['/home/elkakas314/manojos_3'],
};
function fixture(options:{
  attestation?:HostIngressProof|null;
  errorOn?:string;
  grant?:boolean;
}={}) {
  const calls:Array<{name:string;args:Readonly<Record<string,unknown>>}>=[];
  const port:HostControlPort={
    attest:async()=> options.attestation===undefined?proof:options.attestation,
    callTool:async(name,args)=>{
      calls.push({name,args});
      if(name===options.errorOn)throw Error('unknown effect');
      return name==='host_service_status'
        ? {status:'recorded',stdout:'ActiveState=active'}
        : {status:'recorded',name};
    },
  };
  const grants:ExistingHostGrantProvider={
    findExistingRestartGrant:async(unit)=>options.grant?{
      grantId:'localGrant_12345',operation:'host_service_restart',risk:'R2',
      target:unit,expiresAtMs:now+15_000,
    }:null,
  };
  return {calls,port,grants};
}

test('default-disabled bridge cannot expose host status, listeners or effect',async()=>{
  const f=fixture({grant:true});
  const bridge=new NostromoHostControlBridge(f.port,f.grants,{...allowed,enabled:false},()=>now);
  assert.equal((await bridge.read({operation:'host_status'})).status,'UNAVAILABLE');
  assert.equal((await bridge.restartUserService('manojos3-core.service')).actionSubmitted,false);
  assert.equal(f.calls.length,0);
});

test('read requires a fresh independently attested host ingress',async()=>{
  const variants: Array<HostIngressProof|null>=[
    null,{...proof,target:'HOST_CONTROL',expiresAtMs:now-1},
    {...proof,observedAtMs:now+1},{...proof,observedAtMs:now-61_000},
    {...proof,principalRef:''},
  ];
  for(const attestation of variants){
    const f=fixture({attestation});
    const bridge=new NostromoHostControlBridge(f.port,f.grants,allowed,()=>now);
    const x=await bridge.read({operation:'host_status'});
    assert.equal(x.status,'UNAVAILABLE');
    assert.equal(f.calls.length,0);
  }
});

test('bounded host reads reuse existing MCP tools, without an arbitrary command',async()=>{
  const f=fixture();
  const b=new NostromoHostControlBridge(f.port,f.grants,allowed,()=>now);
  assert.equal((await b.read({operation:'host_status'})).status,'OBSERVED_UNVERIFIED');
  assert.equal((await b.read({operation:'host_listener_status'})).status,'OBSERVED_UNVERIFIED');
  assert.equal((await b.read({operation:'host_service_status',unit:'manojos3-core.service'})).status,'OBSERVED_UNVERIFIED');
  assert.equal((await b.read({operation:'host_git_status',path:'/home/elkakas314/manojos_3'})).status,'OBSERVED_UNVERIFIED');
  assert.deepEqual(f.calls.map(x=>x.name),[
    'host_status','host_listener_status','host_service_status','host_git_status']);
  assert.equal('host_exec' in b,false);
});

test('reading services or private repos outside host-owned allowlist is denied',async()=>{
  const f=fixture();
  const b=new NostromoHostControlBridge(f.port,f.grants,allowed,()=>now);
  assert.equal((await b.read({operation:'host_service_status',unit:'other.service'})).status,'DENIED');
  assert.equal((await b.read({operation:'host_git_status',path:'/home/other/repo'})).status,'DENIED');
  assert.equal((await b.restartUserService('other.service')).status,'DENIED');
  assert.equal(f.calls.length,0);
});

test('R2 restart cannot be triggered merely by chat intent, operator mode or a fabricated grant',async()=>{
  const f=fixture();
  const b=new NostromoHostControlBridge(f.port,f.grants,allowed,()=>now);
  const x=await b.restartUserService('manojos3-core.service');
  assert.equal(x.status,'LOCAL_GRANT_REQUIRED');
  assert.equal(x.actionSubmitted,false);
  assert.equal(f.calls.length,0);
});

test('only existing exact local R2 grant allows single restart; readback does not mint PASS',async()=>{
  const f=fixture({grant:true});
  const b=new NostromoHostControlBridge(f.port,f.grants,allowed,()=>now);
  const x=await b.restartUserService('manojos3-core.service');
  assert.equal(x.status,'RECONCILE_REQUIRED');
  assert.equal(x.actionSubmitted,true);
  assert.equal(x.authority,false);
  assert.deepEqual(f.calls.map(x=>x.name),['host_service_restart','host_service_status']);
  assert.deepEqual(f.calls[0].args,{unit:'manojos3-core.service',grant_id:'localGrant_12345'});
});

test('transport error after possible effect is ambiguous and NEVER retried',async()=>{
  const f=fixture({grant:true,errorOn:'host_service_restart'});
  const b=new NostromoHostControlBridge(f.port,f.grants,allowed,()=>now);
  const x=await b.restartUserService('manojos3-core.service');
  assert.equal(x.status,'RECONCILE_REQUIRED');
  assert.equal(x.reason,'HOST_RESTART_OUTCOME_UNKNOWN');
  assert.equal(f.calls.length,1);
});

test('missing or unauthenticated binding also blocks locally granted repairs',async()=>{
  const f=fixture({grant:true,attestation:null});
  const b=new NostromoHostControlBridge(f.port,f.grants,allowed,()=>now);
  const x=await b.restartUserService('manojos3-core.service');
  assert.equal(x.status,'UNAVAILABLE');
  assert.equal(f.calls.length,0);
});

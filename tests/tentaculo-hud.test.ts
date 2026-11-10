import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {TentaculoHud} from '../src/ui/TentaculoHud';
import {TentaculoHub} from '../src/ui/TentaculoHub';
import {nostromoHubSourceSnapshot} from '../src/hud/nostromoHub';
import test from 'node:test';
import assert from 'node:assert/strict';
import {projectTentaculoHud, createTentaculoHubTree, hubAgentCandidate}
  from '../src/hud/tentaculoHud';
const t=Date.parse('2026-11-09T20:00:00.000Z');
test('three target HUD surfaces are stable even without services configured',()=>{
  const result=projectTentaculoHud([],t);
  assert.deepEqual(result.map(x=>x.system),['MANOJOS','VX13','ORACULO']);
  assert.ok(result.every(x=>x.state==='UNCONFIGURED'&&x.authority===false&&x.readOnly));
});
test('MANOJOS3 runtime identity can be shown under new MANOJOS label with evidence',()=>{
  const r=projectTentaculoHud([{system:'MANOJOS',reportedProject:'MANOJOS3',status:'READY',
    observedAt:'2026-11-09T19:59:00.000Z',
    peerVerified:true,evidenceRefs:['receipt:manojos-ready-001']}],t);
  assert.equal(r[0].state,'VERIFIED_READ');assert.equal(r[0].label,'MANOJOS');
  assert.equal(r[1].state,'UNCONFIGURED');assert.equal(r[2].state,'UNCONFIGURED');
});
test('untrusted ORACULO and design VX13 cannot be represented as verified',()=>{
  const r=projectTentaculoHud([
    {system:'ORACULO',reportedProject:'ORACULO',status:'READY',
      observedAt:'2026-11-09T19:59:00.000Z',peerVerified:false,evidenceRefs:['receipt:oraculo-001']},
    {system:'VX13',reportedProject:'VX13',status:'DESIGN',
      observedAt:'2026-11-09T19:59:00.000Z',peerVerified:false,evidenceRefs:[]},
  ],t);
  assert.equal(r[2].state,'NO_VERIFICADO');assert.equal(r[1].state,'DESIGN_ONLY');
});
test('stale timestamps or missing evidence cannot claim runtime health',()=>{
  const r=projectTentaculoHud([{system:'MANOJOS',reportedProject:'MANOJOS',status:'READY',
    observedAt:'2026-11-09T19:00:00.000Z',peerVerified:true,evidenceRefs:['receipt:foo-12345678']}],t);
  assert.equal(r[0].state,'NO_VERIFICADO');
});
test('Hub remains a typed hierarchy, with no new executor',()=>{
  const items=[
    {id:'vx13',system:'VX13' as const,kind:'SYSTEM' as const,label:'VX13',sourceRef:'drive:A91',status:'SOURCE' as const},
    {id:'link',system:'VX13' as const,kind:'MODULE' as const,parentId:'vx13',label:'Tentáculo Link',
      sourceRef:'drive:A88',status:'SOURCE' as const},
    {id:'oraculo',system:'ORACULO' as const,kind:'SYSTEM' as const,label:'ORÁCULO',
      sourceRef:'repo:oraculo',status:'SOURCE' as const},
  ];
  const tree=createTentaculoHubTree(items);
  assert.equal(tree.roots.length,2);assert.equal(tree.children.vx13.length,1);
  assert.deepEqual(hubAgentCandidate(items[1]),{
    schema:'libre-chat-vx.hub-agent-candidate.v1',
    itemId:'link',target:'VX13',name:'Tentáculo Link',authority:false,
    state:'PROPOSED_NOT_INSTALLED',route:'TENTACULO_LINK_ONLY',sourceRef:'drive:A88'});
});
test('Hub rejects duplicates, wrong-target parent and cyclic hierarchy',()=>{
  const x={id:'a',system:'VX13' as const,kind:'SYSTEM' as const,label:'A',
    sourceRef:'ref:one',status:'SOURCE' as const};
  assert.throws(()=>createTentaculoHubTree([x,x]),/INVALID/);
  assert.throws(()=>createTentaculoHubTree([x,{...x,id:'b',system:'ORACULO' as const,parentId:'a'}]),/PARENT/);
  assert.throws(()=>createTentaculoHubTree([{...x,parentId:'b'},{...x,id:'b',parentId:'a'}]),/CYCLE/);
});

test('organic HUD renders no UI without a requested focus and never renders a 3-card grid',()=>{
  const cards=projectTentaculoHud([],Date.parse('2026-11-09T20:00:00Z'));
  const dormant=renderToStaticMarkup(React.createElement(TentaculoHud,{cards}));
  assert.equal(dormant,'');
  const vx13=renderToStaticMarkup(React.createElement(TentaculoHud,
    {cards,activeSystem:'VX13'}));
  assert.match(vx13,/NOSTROMO \/ FOCO ACTUAL/);
  assert.match(vx13,/VX13/);
  assert.match(vx13,/En diseño|Enlace sin verificar/);
  assert.equal(vx13.includes('ORÁCULO'),false);
  assert.equal(vx13.includes('grid-template-columns'),false);
  const off=renderToStaticMarkup(React.createElement(TentaculoHud,
    {cards,activeSystem:null}));
  assert.equal(off,'');
});

test('Tentáculo Hub retains NOSTROMO local agent/MCP before separate external targets',()=>{
  const snapshot=nostromoHubSourceSnapshot();
  assert.deepEqual(snapshot.rootSystems,['NOSTROMO','MANOJOS','VX13','ORACULO']);
  const tree=createTentaculoHubTree(snapshot.items);
  assert.deepEqual(tree.children.nostromo.map(x=>x.id),
    ['nostromo-agent','nostromo-mcp','nostromo-voice','nostromo-tasks',
      'nostromo-chatgpt','nostromo-router','nostromo-github-remote','nostromo-graph','nostromo-gpu-mock']);
  assert.deepEqual(tree.children['nostromo-mcp'].map(x=>x.id),['nostromo-terminal','nostromo-tools','nostromo-files','nostromo-git','nostromo-metrics']);
  assert.ok(snapshot.items.every(x=>x.status==='SOURCE'));
  assert.equal(snapshot.materialVerified,false);
  assert.equal(snapshot.mcpInstalled,null);
  assert.equal(snapshot.chatgptConnected,null);
  assert.equal(snapshot.authority,false);
  assert.equal(snapshot.readOnly,true);
  const agent=hubAgentCandidate(snapshot.items.find(x=>x.id==='nostromo-agent')!);
  assert.equal(agent.route,'NOSTROMO_LOCAL_MCP_PROPOSAL_ONLY');
  assert.equal(agent.authority,false);
  assert.equal(agent.state,'PROPOSED_NOT_INSTALLED');
});

test('Tentáculo Hub displays truthful SOURCE inventory without execution actions',()=>{
  const html=renderToStaticMarkup(React.createElement(TentaculoHub,
    {snapshot:nostromoHubSourceSnapshot()}));
  assert.match(html,/TENTÁCULO HUB/);
  assert.match(html,/NOSTROMO · Autónomo/);
  assert.match(html,/Único MCP local/);
  assert.match(html,/ChatGPT · OAuth pendiente/);
  assert.match(html,/Conexiones futuras/);
  assert.match(html,/MCP sin vínculo LIVE verificado/);
  assert.doesNotMatch(html,/MCP no instalado/);
  assert.match(html,/Git · inspección R0 opcional/);
  assert.match(html,/CPU, RAM y disco/);
  assert.match(html,/GitHub remoto · integración gobernada pendiente/);
  assert.match(html,/Microsoft Graph · permisos OAuth pendientes/);
  assert.match(html,/Mock 4 GB · simulación informada como verificada/);
  assert.match(html,/<details/);
  assert.match(html,/<summary/);
  assert.equal(html.includes('LIVE_VERIFIED'),false);
  assert.equal(html.includes('<form'),false);
  assert.equal(html.includes('ejecutar ahora'),false);
});

test('Tentáculo Hub blocks mixed-system parent links and duplicates',()=>{
  const items=[...nostromoHubSourceSnapshot().items];
  assert.throws(()=>createTentaculoHubTree([...items,{...items[1],
    id:'invalid-cross',system:'VX13',parentId:'nostromo'}]),/PARENT_INVALID/);
  assert.throws(()=>createTentaculoHubTree([...items,items[0]]),/ID_OR_SOURCE_INVALID/);
});

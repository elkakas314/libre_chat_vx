import test from 'node:test';
import assert from 'node:assert/strict';
import {createPhoneModuleSnapshot,planPhoneAction} from '../src/mobile/phoneModule';
import {deriveFocusDomain,windowsForDomain} from '../src/cockpit/windowRouter';

const base={
 platform:'IOS' as const,deviceLabel:'iPhone de pruebas',
 networkReachable:true,backendReachable:true,authenticated:true,snapshotFresh:true,
 tailnetAuthorized:true,tailscaleServeReachable:true,
 publicEdgeEnabled:false,cloudflareAccessAuthenticated:false,publicEdgeReachable:false,
 nativeClientVerified:false,shortcutBridgeVerified:false,
 evidenceRef:'host:receipt-001',observedAt:'2026-11-18T04:15:00Z',
};
test('phone without evidence remains SOURCE_ONLY and cannot request work',()=>{
 const p=createPhoneModuleSnapshot(undefined,[],'current-chat');
 assert.equal(p.sourceOnly,true);
 assert.equal(p.state,'UNAVAILABLE');
 assert.equal(p.connectionVerified,false);
 assert.equal(p.currentConversationId,'current-chat');
 assert.equal(planPhoneAction(p,'HANDOFF_CONVERSATION').disposition,'DENIED');
 assert.equal(planPhoneAction(p,'IOS_SHORTCUT').disposition,'DENIED');
});
test('private mobile client uses same LibreChat conversation without replay',()=>{
 const p=createPhoneModuleSnapshot(base,[{
  taskRef:'job-1',title:'Diagnóstico',state:'RUNNING',owner:'NOSTROMO_MCP'
 }],'conv-1');
 assert.equal(p.sourceOnly,false);
 assert.equal(p.state,'INTERACTIVE');
 assert.equal(p.access,'TAILSCALE_PRIVATE');
 assert.equal(p.currentConversationId,'conv-1');
 assert.equal(p.tasks[0]?.taskRef,'job-1');
 assert.equal(p.noAutomaticReplay,true);
 assert.equal(planPhoneAction(p,'HANDOFF_CONVERSATION').disposition,'READ_ONLY');
 assert.equal(planPhoneAction(p,'REMOTE_IOS_CONTROL').disposition,'DENIED');
});
test('no device evidence cannot forge verified interactive status',()=>{
 const p=createPhoneModuleSnapshot({...base,evidenceRef:undefined});
 assert.equal(p.connectionVerified,false);
 assert.equal(p.state,'UNAVAILABLE');
 assert.equal(p.tasks.length,0);
});
test('iOS Shortcut requires verified bridge and device consent, never executes',()=>{
 const p=createPhoneModuleSnapshot({...base,shortcutBridgeVerified:true});
 const action=planPhoneAction(p,'IOS_SHORTCUT');
 assert.equal(action.disposition,'PREPARE_CONSENT');
 assert.equal(action.requiresDeviceConsent,true);
 assert.equal(action.materialExecuted,false);
 assert.equal(action.authority,false);
 assert.equal(planPhoneAction(p,'REMOTE_IOS_CONTROL').disposition,'DENIED');
});
test('phone without route or auth fails closed, and offline cannot replay',()=>{
 const p=createPhoneModuleSnapshot({...base,tailnetAuthorized:false,
  tailscaleServeReachable:false,authenticated:false});
 assert.equal(p.state,'UNAVAILABLE');
 assert.equal(p.access,'LOCAL'); // local route still needs authenticated LibreChat
 assert.equal(planPhoneAction(p,'VIEW_CONVERSATION').disposition,'DENIED');
 const offline=createPhoneModuleSnapshot({...base,networkReachable:false});
 assert.equal(offline.connectionVerified,false);
 assert.equal(offline.noAutomaticReplay,true);
});
test('natural language selects phone window and native task projection',()=>{
 assert.equal(deriveFocusDomain('Cómo conectar mi iPhone por Tailscale'),'PHONE');
 assert.ok(windowsForDomain('PHONE').includes('PHONE'));
 assert.ok(windowsForDomain('PHONE').includes('BACKGROUND_TASKS'));
});

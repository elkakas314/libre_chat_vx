import test from 'node:test';
import assert from 'node:assert/strict';

import { interpretIntent } from '../src/intent/intentInterpreter';
import { choosePresentationMode } from '../src/presentation/presentationPlanner';
import { chooseResearchPath } from '../src/research/researchPolicy';
import { buildAgentEventDelivery } from '../src/events/agentEvents';
import { TENTACULO_COMPANION } from '../src/tentacle/companion';

test('intent interpreter separates research, read and material target command', () => {
  assert.equal(interpretIntent({wantsResearch:true}).intentClass,'RESEARCH');
  assert.equal(interpretIntent({wantsSystemRead:true,explicitTarget:'MANOJOS3'}).intentClass,'TARGET_READ');
  const command=interpretIntent({wantsExternalChange:true,explicitTarget:'VX13'});
  assert.equal(command.intentClass,'TARGET_COMMAND');
  assert.equal(command.materialRequested,true);
  assert.equal(command.authority,false);
});

test('presentation planner chooses visual surfaces from information shape', () => {
  assert.equal(choosePresentationMode({shape:'HIERARCHY'}),'RESOURCE_TREE');
  assert.equal(choosePresentationMode({shape:'RELATIONSHIPS'}),'MERMAID_DIAGRAM');
  assert.equal(choosePresentationMode({shape:'INTERACTIVE'}),'INTERACTIVE_ARTIFACT');
});

test('research policy uses web search before browser interaction', () => {
  assert.equal(chooseResearchPath({asksPublicInternet:true,interactionRequired:false}),'WEB_SEARCH');
  assert.equal(chooseResearchPath({asksPublicInternet:true,interactionRequired:true}),'BROWSER_INTERACTION');
  assert.equal(chooseResearchPath({asksOperationalTruth:true}),'TARGET_READ');
});

test('agent event delivery is idempotent-shaped and never authority', () => {
  const delivery=buildAgentEventDelivery({
    source:'MANOJOS3',
    eventId:'run 42 completed',
    type:'run.completed',
    occurredAtMs:1000,
    resourceRef:'run-42',
    summary:'Run completed',
    severity:'INFO',
    evidenceRefs:['receipt:1'],
  });
  assert.equal(delivery.mode,'fire');
  assert.equal(delivery.authority,false);
  assert.match(delivery.idempotencyKey,/^MANOJOS3:/);
  assert.equal(delivery.event.payload.evidenceRefs[0],'receipt:1');
});

test('Tentáculo companion is cognitive only', () => {
  assert.equal(TENTACULO_COMPANION.authority,false);
  assert.equal(TENTACULO_COMPANION.capabilities.includes('EVENT_TRIAGE'),true);
  assert.equal(TENTACULO_COMPANION.forbidden.includes('MATERIAL_EXECUTION'),true);
});

test('material intent without concrete target needs resolution; reads never become commands', () => {
  for (const currentScope of ['AUTO', 'BOTH'] as const) {
    const draft = interpretIntent({wantsExternalChange:true,currentScope});
    assert.equal(draft.intentClass,'TARGET_COMMAND');
    assert.equal(draft.needsClarification,true);
    assert.equal(draft.targetHint,undefined);
    assert.equal(draft.materialRequested,true);
    assert.equal(draft.authority,false);
    const read = interpretIntent({wantsSystemRead:true,currentScope});
    assert.equal(read.intentClass,'TARGET_READ');
    assert.equal(read.materialRequested,false);
    assert.equal(read.authority,false);
  }
  assert.equal(interpretIntent({wantsExternalChange:true}).needsClarification,true);
  const focused = interpretIntent({wantsExternalChange:true,currentScope:'VX13'});
  assert.equal(focused.targetHint,'VX13');
  assert.equal(focused.needsClarification,false);
  const explicit = interpretIntent({wantsExternalChange:true,currentScope:'BOTH',explicitTarget:'MANOJOS3'});
  assert.equal(explicit.targetHint,'MANOJOS3');
  assert.equal(explicit.needsClarification,false);
});

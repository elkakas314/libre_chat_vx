import test from 'node:test';
import assert from 'node:assert/strict';

import { interpretIntent } from '../src/intent/intentInterpreter';
import { bridgeIntentToDecision } from '../src/intent/nostromoDecisionBridge';
import { chooseHybridLane } from '../src/llm/nostromoHybrid';
import { selectSemanticProfile } from '../src/llm/inferenceGateway';

test('decision bridge handles all seven classes without granting authority',()=>{
  const signals=[
    {},
    {wantsResearch:true},
    {wantsVisualization:true},
    {wantsExplanation:true},
    {wantsSystemRead:true,explicitTarget:'MANOJOS3' as const},
    {wantsExternalChange:true,explicitTarget:'MANOJOS3' as const},
    {ambiguousReferent:true},
  ];
  const classes=new Set(signals.map(s=>bridgeIntentToDecision(interpretIntent(s)).intent.intentClass));
  assert.deepEqual([...classes].sort(),[
    'CLARIFY','CONVERSATION','EXPLAIN','RESEARCH','TARGET_COMMAND','TARGET_READ','VISUALIZE',
  ]);
  for(const s of signals)assert.equal(bridgeIntentToDecision(interpretIntent(s)).authority,false);
});

test('simple chat is RAPIDO and does not silently turn on local Ollama',()=>{
  const d=bridgeIntentToDecision(interpretIntent({}));
  assert.equal(selectSemanticProfile(d.inferenceSignals),'RAPIDO');
  assert.equal(d.hybridTurn.preferLocalVoice,false);
  assert.equal(chooseHybridLane(d.hybridTurn),'REMOTE_INFERENCE');
  const local=bridgeIntentToDecision(interpretIntent({}),{preferLocalVoice:true});
  assert.equal(chooseHybridLane(local.hybridTurn),'LOCAL_VOICE');
});

test('research and visual routing use existing semantic profiles',()=>{
  assert.equal(selectSemanticProfile(bridgeIntentToDecision(interpretIntent({wantsResearch:true})).inferenceSignals),'INVESTIGAR');
  assert.equal(selectSemanticProfile(bridgeIntentToDecision(interpretIntent({wantsVisualization:true})).inferenceSignals),'VISUALIZAR');
  assert.equal(selectSemanticProfile(bridgeIntentToDecision(interpretIntent({wantsExplanation:true})).inferenceSignals),'NORMAL');
  assert.equal(selectSemanticProfile(bridgeIntentToDecision(interpretIntent({wantsExplanation:true}),{needsDeepReasoning:true}).inferenceSignals),'PENSAR');
  assert.equal(selectSemanticProfile(bridgeIntentToDecision(interpretIntent({}),{needsVision:true}).inferenceSignals),'VISION');
});

test('unresolved target command is blocked, but target read requires readback',()=>{
  const unresolved=bridgeIntentToDecision(interpretIntent({wantsExternalChange:true,currentScope:'BOTH'}));
  assert.equal(unresolved.intent.needsClarification,true);
  assert.equal(unresolved.requiresMaterialExecution,false);
  assert.equal(unresolved.hybridTurn.targetActionRequested,false);
  assert.equal(unresolved.requiresReadbackBeforeResponse,false);
  const command=bridgeIntentToDecision(interpretIntent({wantsExternalChange:true,explicitTarget:'MANOJOS3'}));
  assert.equal(command.requiresMaterialExecution,false);
  assert.equal(command.requiresGoalAgreement,true);
  assert.equal(command.requiresReadbackBeforeResponse,false);
  assert.equal(chooseHybridLane(command.hybridTurn),'REMOTE_INFERENCE');
  const read=bridgeIntentToDecision(interpretIntent({wantsSystemRead:true,explicitTarget:'MANOJOS3'}));
  assert.equal(read.requiresMaterialExecution,false);
  assert.equal(read.requiresReadbackBeforeResponse,true);
});

test('local GPU voice preference never swallows complex tasks or target commands',()=>{
  const simple=bridgeIntentToDecision(interpretIntent({}),{preferLocalVoice:true});
  assert.equal(chooseHybridLane(simple.hybridTurn),'LOCAL_VOICE');
  for(const signals of [
    {wantsResearch:true},
    {wantsVisualization:true},
    {wantsExternalChange:true,explicitTarget:'MANOJOS3' as const},
  ]) {
    const decision=bridgeIntentToDecision(interpretIntent(signals),{preferLocalVoice:true});
    assert.notEqual(chooseHybridLane(decision.hybridTurn),'LOCAL_VOICE');
  }
  const vision=bridgeIntentToDecision(interpretIntent({}),{preferLocalVoice:true,needsVision:true});
  assert.equal(chooseHybridLane(vision.hybridTurn),'REMOTE_INFERENCE');
  assert.equal(vision.hybridTurn.needsVision,true);
  const bypass={...simple.hybridTurn,needsResearch:true,preferLocalVoice:true};
  assert.equal(chooseHybridLane(bypass),'REMOTE_INFERENCE');
});

test('target request stays conversational until a matching native objective agreement',()=>{
  const intent=interpretIntent({wantsExternalChange:true,explicitTarget:'MANOJOS3',wantsResearch:true});
  const pending=bridgeIntentToDecision(intent);
  assert.equal(pending.requiresMaterialExecution,false);
  assert.equal(pending.requiresGoalAgreement,true);
  assert.equal(chooseHybridLane(pending.hybridTurn),'REMOTE_INFERENCE');
  assert.equal(pending.inferenceSignals.needsResearch,true);
  const h={
    source:'HOST_AUTHENTICATED_USER_AGREEMENT' as const,
    targetId:'MANOJOS3' as const,objectiveRef:'objective-42',
    planHash:'a'.repeat(64),sessionRef:'session-5',
  };
  const ready=bridgeIntentToDecision(intent,{agreedTaskHandoff:h});
  assert.equal(ready.requiresGoalAgreement,false);
  assert.equal(ready.requiresMaterialExecution,true);
  assert.equal(ready.authority,false);
  assert.equal(chooseHybridLane(ready.hybridTurn),'TARGET_OBJECTIVE');
  const invalid=[
    {...h,targetId:'VX13' as const},
    {...h,objectiveRef:'  '},
    {...h,sessionRef:''},
    {...h,planHash:'stale'},
    {...h,source:'UNTRUSTED_LLM' as unknown as typeof h.source},
  ];
  for(const entry of invalid){
    const d=bridgeIntentToDecision(intent,{agreedTaskHandoff:entry});
    assert.equal(d.requiresMaterialExecution,false);
    assert.equal(d.requiresGoalAgreement,true);
    assert.equal(d.authority,false);
  }
});

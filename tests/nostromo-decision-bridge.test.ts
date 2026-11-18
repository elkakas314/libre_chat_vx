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
  assert.equal(command.requiresMaterialExecution,true);
  assert.equal(command.requiresReadbackBeforeResponse,true);
  assert.equal(chooseHybridLane(command.hybridTurn),'TARGET_OBJECTIVE');
  const read=bridgeIntentToDecision(interpretIntent({wantsSystemRead:true,explicitTarget:'MANOJOS3'}));
  assert.equal(read.requiresMaterialExecution,false);
  assert.equal(read.requiresReadbackBeforeResponse,true);
});

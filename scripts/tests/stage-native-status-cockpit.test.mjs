import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderStatusCockpit} from '../../deployment/librechat-agents/stage-native-status-cockpit.mjs';
test('refuses an unrecognized or changed installed cockpit',()=>{
 assert.throws(()=>renderStatusCockpit('different cockpit'),/COCKPIT_PREIMAGE_HASH_MISMATCH/);
});
test('adds the control without dropping installed content',{skip:!process.env.NOSTROMO_E5_TEST_UPSTREAM},()=>{
 const original=readFileSync(process.env.NOSTROMO_E5_TEST_UPSTREAM+'/client/src/components/VX/VXCockpitBridge.tsx','utf8');
 const staged=renderStatusCockpit(original);
 const recovered=staged.replace("\nimport NostromoObjectiveStatus from './NostromoObjectiveStatus';",'')
  .replace('        <NostromoObjectiveStatus conversationId={activity.conversationId} />\n','');
 assert.equal(recovered,original);
});

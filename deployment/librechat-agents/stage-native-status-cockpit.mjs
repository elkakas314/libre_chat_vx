/** Add only the status control to the existing installed cockpit; do not replace its other work. */
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const BEFORE='cd4e6bc2016af8aced547a800805712fe00558259ce960221a8b441242ddfb2b';
const sha=(data)=>createHash('sha256').update(data).digest('hex');
export function renderStatusCockpit(original){
 if(sha(original)!==BEFORE)throw Error('COCKPIT_PREIMAGE_HASH_MISMATCH');
 const importAnchor="import './VXCockpit.css';",nav='        <nav aria-label="Modos de NOSTROMO"';
 if(original.split(importAnchor).length!==2 || original.split(nav).length!==2)throw Error('COCKPIT_ANCHOR_MISMATCH');
 return original.replace(importAnchor,importAnchor+"\nimport NostromoObjectiveStatus from './NostromoObjectiveStatus';")
  .replace(nav,"        <NostromoObjectiveStatus conversationId={activity.conversationId} />\n"+nav);
}
export function stageStatusCockpit({upstream,source,stage}){
 if(existsSync(stage))throw Error('STAGE_ALREADY_EXISTS');
 const installed=join(upstream,'client/src/components/VX/VXCockpitBridge.tsx');
 const component=join(upstream,'client/src/components/VX/NostromoObjectiveStatus.tsx');
 if(existsSync(component))throw Error('EXISTING_STATUS_COMPONENT_PRESERVED');
 const before=readFileSync(installed,'utf8'),after=renderStatusCockpit(before);
 mkdirSync(stage,{recursive:true});writeFileSync(join(stage,'VXCockpitBridge.tsx'),after);
 copyFileSync(join(source,'overlay/upstream/NostromoObjectiveStatus.tsx'),join(stage,'NostromoObjectiveStatus.tsx'));
 const manifest={schema:'nostromo.e5.status-cockpit-stage.v1',before:sha(before),after:sha(after),
   component:sha(readFileSync(join(stage,'NostromoObjectiveStatus.tsx')))};
 writeFileSync(join(stage,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=',2)));
 if(!args.upstream||!args.source||!args.stage)throw Error('NEED_EXPLICIT_UPSTREAM_SOURCE_STAGE');
 console.log(JSON.stringify(stageStatusCockpit(args),null,2));
}

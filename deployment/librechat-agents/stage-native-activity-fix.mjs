/** Preserve installed package and change only parsing of native tool records. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const targets=[['src/cockpit/conversationActivity.ts','d0d578202f30d86895867627a8ea6243e27e4249599a2ff543b86fbbc61fa3fc'],
 ['dist/src/cockpit/conversationActivity.js','2374a4581406e57e0e435dab2c00e279c6d9075e627db4e46ccd1ef61ac3cbc9']];
const sha=(x)=>createHash('sha256').update(x).digest('hex');
export function stageActivity({upstream,stage}){
 if(existsSync(stage))throw Error('STAGE_ALREADY_EXISTS');
 const root=join(upstream,'packages/librechat-vx'),result=[];
 for(const [relative,expected] of targets){
  const before=readFileSync(join(root,relative),'utf8');if(sha(before)!==expected)throw Error('ACTIVITY_PREIMAGE_HASH_MISMATCH:'+relative);
  const changes=[['const rawName = functionCall?.name;','const rawName = functionCall?.name ?? toolCall?.name;'],
   ['hasStoredOutput: functionCall?.output != null','hasStoredOutput: (functionCall?.output ?? toolCall?.output) != null']];
  let after=before;for(const [a,b] of changes){if(after.split(a).length!==2)throw Error('ACTIVITY_ANCHOR_MISMATCH');after=after.replace(a,b);}
  result.push({relative,before,after,beforeSha256:sha(before),afterSha256:sha(after)});
 }
 mkdirSync(stage,{recursive:true});
 for(const [i,item] of result.entries())writeFileSync(join(stage,i===0?'conversationActivity.ts':'conversationActivity.js'),item.after);
 const manifest={schema:'nostromo.e5.activity-fix.v1',files:result.map(({relative,beforeSha256,afterSha256})=>({relative,beforeSha256,afterSha256}))};
 writeFileSync(join(stage,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=',2)));
 if(!args.upstream||!args.stage)throw Error('NEED_EXPLICIT_UPSTREAM_STAGE');
 console.log(JSON.stringify(stageActivity(args),null,2));
}

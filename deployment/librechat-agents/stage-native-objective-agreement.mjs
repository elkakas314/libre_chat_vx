/** Produce a reviewable native LibreChat route candidate. No production writes.
 * Install via governed HOST_CONTROL only after exact-hash preflight + backups.
 */
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const MOUNT_MARKER='/* NOSTROMO_E5_OBJECTIVE_AGREEMENT_ROUTE_V1 */';
const TARGET="  app.use('/api/convos', routes.convos);";
const MOUNT=`
  ${MOUNT_MARKER}
  {
    const objectiveRuntime = path.resolve(__dirname, '../../../nostromo/runtime/e5-objective');
    const { createObjectiveAgreementRouter } = require(path.join(objectiveRuntime, 'objective-agreement-api.cjs'));
    const { NativeObjectiveAgreement, mongoConversationAgreementStore } =
      require(path.join(objectiveRuntime, 'src/librechat/nativeObjectiveAgreement.js'));
    const { requireJwtAuth } = require('./middleware');
    const objectiveServiceFor = () => {
      const collection = mongoose.connection.db?.collection('conversations');
      return collection
        ? new NativeObjectiveAgreement(mongoConversationAgreementStore(collection))
        : null;
    };
    app.use('/api/nostromo/objectives', createObjectiveAgreementRouter({
      express, requireJwtAuth, serviceFor: objectiveServiceFor,
    }));
  }`;

export function renderNativeObjectiveAgreementRoute(input) {
  if(typeof input!=='string')throw Error('INDEX_NOT_TEXT');
  if(input.includes(MOUNT_MARKER)){
    if(input.includes(MOUNT.trim()))return {content:input,status:'ALREADY_INSTALLED'};
    throw Error('ROUTE_MARKER_UNEXPECTED_CONTENT');
  }
  if(input.split(TARGET).length!==2)throw Error('NATIVE_ROUTE_ANCHOR_NOT_UNIQUE');
  if(input.includes("app.use('/api/nostromo/objectives'"))throw Error('ROUTE_ALREADY_PRESENT_UNRECOGNIZED');
  return {content:input.replace(TARGET,TARGET+'\n'+MOUNT),status:'PATCH_AVAILABLE'};
}

const sha=(s)=>createHash('sha256').update(s).digest('hex');
export function stageNativeObjectiveAgreement({upstream,source,stage}) {
  const orig=readFileSync(join(upstream,'api/server/index.js'),'utf8');
  const result=renderNativeObjectiveAgreementRoute(orig);
  if(result.status!=='PATCH_AVAILABLE')return {status:result.status,indexSha256:sha(orig)};
  if(existsSync(stage))throw Error('STAGE_ALREADY_EXISTS');
  mkdirSync(join(stage,'src/librechat'),{recursive:true});
  mkdirSync(join(stage,'src/contracts'),{recursive:true});
  mkdirSync(join(stage,'contracts'),{recursive:true});
  copyFileSync(join(source,'deployment/librechat-agents/objective-agreement-api.cjs'),join(stage,'objective-agreement-api.cjs'));
  copyFileSync(join(source,'dist/src/librechat/nativeObjectiveAgreement.js'),join(stage,'src/librechat/nativeObjectiveAgreement.js'));
  copyFileSync(join(source,'dist/src/contracts/objectiveHandoff.js'),join(stage,'src/contracts/objectiveHandoff.js'));
  copyFileSync(join(source,'dist/contracts/nostromo-objective-handoff.schema.json'),join(stage,'contracts/nostromo-objective-handoff.schema.json'));
  writeFileSync(join(stage,'api-server-index.js'),result.content);
  return {status:result.status,indexBeforeSha256:sha(orig),indexAfterSha256:sha(result.content),
    stageFiles:['objective-agreement-api.cjs','src/librechat/nativeObjectiveAgreement.js',
      'src/contracts/objectiveHandoff.js','contracts/nostromo-objective-handoff.schema.json','api-server-index.js']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=Object.fromEntries(process.argv.slice(2).map(a=>a.split('=',2)));
  if(!args.upstream||!args.source||!args.stage)throw Error('NEED_EXPLICIT_UPSTREAM_SOURCE_STAGE');
  console.log(JSON.stringify(stageNativeObjectiveAgreement(args),null,2));
}

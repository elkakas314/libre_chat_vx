/** Reversible E5 upgrade of the EXISTING native route to fixed R0 metrics.
 * Does not modify the running LibreChat index or the served frontend.
 */
import {readFileSync,writeFileSync,cpSync,copyFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname,basename,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const BEFORE='b4d65b0ea59330680d929cdfae3bc14d4f0da8cea673e9a1579cb5c622f0dbf6';
const RUNTIME='e5-metrics-20261121-r1';
const sha=x=>createHash('sha256').update(x).digest('hex');
const anchor="    app.use('/api/nostromo/objectives', createObjectiveAgreementRouter({";
const inject=`    // NOSTROMO E5 fixed authenticated R0 metrics lane, no user-selected command.
    const { createNativeMetricsExecutor } = require(path.join(objectiveRuntime, 'native-metrics-runtime.cjs'));
    const { createNativeMcpMetricsPort } = require(path.join(objectiveRuntime, 'native-mcp-metrics-port.cjs'));
    const { NativeObjectiveDispatchLedger } = require(path.join(objectiveRuntime, 'src/librechat/nativeObjectiveDispatchLedger.js'));
    const { executeNativeMetrics } = require(path.join(objectiveRuntime, 'src/librechat/nativeMetricsExecution.js'));
    const executeMetricsFor = createNativeMetricsExecutor({
      serviceFor: objectiveServiceFor, collectionFor: () => mongoose.connection.db?.collection('conversations'),
      services: mcpServices, managerFor: getMCPManager, registryFor: getMCPServersRegistry,
      flowManagerFor: () => getFlowStateManager(getLogStores(CacheKeys.FLOWS)),
      expectedCommand: '/home/elkakas314/bin/nostromo-mcp-wrapper.sh',
      expectedCwd: '/home/elkakas314',
      createPort: createNativeMcpMetricsPort, ReceiptStore: NativeObjectiveReceiptStore,
      Ledger: NativeObjectiveDispatchLedger, executeNativeMetrics,
    });
`;
export function renderMetricsUpgrade(original) {
 if(sha(original)!==BEFORE)throw Error('INDEX_PREIMAGE_HASH_MISMATCH');
 const oldPath='../../../nostromo/runtime/e5-status', newPath='../../../nostromo/runtime/'+RUNTIME;
 if(original.split(oldPath).length!==2||original.split(anchor).length!==2)
   throw Error('INDEX_ANCHOR_NOT_UNIQUE');
 const oldArgs='express, requireJwtAuth, serviceFor: objectiveServiceFor, executeStatusFor, readStatusFor: executeStatusFor.readLatest,';
 if(original.split(oldArgs).length!==2)throw Error('ROUTE_ARGUMENT_ANCHOR_NOT_UNIQUE');
 return original.replace(oldPath,newPath).replace(anchor,inject+anchor)
   .replace(oldArgs,oldArgs+' executeMetricsFor,');
}
const files=[
 ['deployment/librechat-agents/objective-agreement-api.cjs','objective-agreement-api.cjs'],
 ['deployment/librechat-agents/native-mcp-metrics-port.cjs','native-mcp-metrics-port.cjs'],
 ['deployment/librechat-agents/native-metrics-runtime.cjs','native-metrics-runtime.cjs'],
 ['dist/src/librechat/nativeObjectiveDispatchLedger.js','src/librechat/nativeObjectiveDispatchLedger.js'],
 ['dist/src/librechat/nativeMetricsExecution.js','src/librechat/nativeMetricsExecution.js'],
 ['dist/src/librechat/nativeGovernedExecution.js','src/librechat/nativeGovernedExecution.js'],
];
export function stageNativeMetrics({upstream,source,installed,stage}) {
 if(basename(stage)!==RUNTIME||existsSync(stage))throw Error('UNEXPECTED_STAGE_PATH_OR_EXISTS');
 const index=readFileSync(join(upstream,'api/server/index.js'),'utf8');
 const candidate=renderMetricsUpgrade(index);
 cpSync(installed,stage,{recursive:true,errorOnExist:true,force:false});
 const hashes={};
 for(const [from,to] of files) {
  const target=join(stage,to);mkdirSync(dirname(target),{recursive:true});
  copyFileSync(join(source,from),target);hashes[to]=sha(readFileSync(target));
 }
 writeFileSync(join(stage,'api-server-index.js'),candidate);
 const manifest={schema:'nostromo.e5.metrics-native-install.v1',head:'SOURCE_HEAD_ON_STAGE',
  oldRuntime:installed,stage,newRuntime:stage,index_before:sha(index),
  index_after:sha(candidate),files:hashes,
  productInstalled:false,authenticatedE2EVerified:false};
 writeFileSync(join(stage,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=Object.fromEntries(process.argv.slice(2).map(x=>x.replace(/^--/,'').split('=',2)));
 if(!args.upstream||!args.source||!args.installed||!args.stage)
  throw Error('UPSTREAM_SOURCE_INSTALLED_STAGE_REQUIRED');
 console.log(JSON.stringify(stageNativeMetrics(args),null,2));
}

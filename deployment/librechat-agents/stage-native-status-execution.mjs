/** Stage an exact, reversible upgrade of the existing E5 agreement route. */
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const BEFORE='9561e5107f75b883973db1cb6307dc0a966c0b1463a86113ab8013bd5907d580';
const sha=(x)=>createHash('sha256').update(x).digest('hex');
const OLD=""+`    app.use('/api/nostromo/objectives', createObjectiveAgreementRouter({
      express, requireJwtAuth, serviceFor: objectiveServiceFor,
    }));`;
const NEXT=`    const { createNativeStatusExecutor } = require(path.join(objectiveRuntime, 'native-status-runtime.cjs'));
    const { createNativeMcpStatusPort } = require(path.join(objectiveRuntime, 'native-mcp-status-port.cjs'));
    const { NativeObjectiveReceiptStore } = require(path.join(objectiveRuntime, 'src/librechat/nativeObjectiveReceipts.js'));
    const { executeNativeStatus } = require(path.join(objectiveRuntime, 'src/librechat/nativeStatusExecution.js'));
    const mcpServices = require('./services/MCP');
    const { getMCPManager, getMCPServersRegistry, getFlowStateManager } = require('../config');
    const { getLogStores } = require('../cache');
    const { CacheKeys } = require('librechat-data-provider');
    const executeStatusFor = createNativeStatusExecutor({
      serviceFor: objectiveServiceFor, collectionFor: () => mongoose.connection.db?.collection('conversations'),
      services: mcpServices, managerFor: getMCPManager, registryFor: getMCPServersRegistry,
      flowManagerFor: () => getFlowStateManager(getLogStores(CacheKeys.FLOWS)),
      expectedCommand: '/home/elkakas314/librechat/nostromo/bin/nostromo-mcp-wrapper.sh',
      createPort: createNativeMcpStatusPort, ReceiptStore: NativeObjectiveReceiptStore, executeNativeStatus,
    });
    app.use('/api/nostromo/objectives', createObjectiveAgreementRouter({
      express, requireJwtAuth, serviceFor: objectiveServiceFor, executeStatusFor, readStatusFor: executeStatusFor.readLatest,
    }));`;
const files=[
 ['deployment/librechat-agents/objective-agreement-api.cjs','objective-agreement-api.cjs'],
 ['deployment/librechat-agents/native-mcp-status-port.cjs','native-mcp-status-port.cjs'],
 ['deployment/librechat-agents/native-status-runtime.cjs','native-status-runtime.cjs'],
 ...['librechat/nativeObjectiveAgreement','librechat/nativeObjectiveReceipts','librechat/nativeStatusExecution',
 'librechat/nativeGovernedExecution','cockpit/governedMcpDispatch','cockpit/targetToolGate',
 'intent/nostromoDecisionBridge','contracts/objectiveHandoff'].map(x=>['dist/src/'+x+'.js','src/'+x+'.js']),
 ['dist/contracts/nostromo-objective-handoff.schema.json','contracts/nostromo-objective-handoff.schema.json'],
];
export function renderNativeStatusUpgrade(original){
 if(sha(original)!==BEFORE)throw Error('INDEX_PREIMAGE_HASH_MISMATCH');
 if(original.split(OLD).length!==2 || original.split("../../../nostromo/runtime/e5-objective").length!==2)throw Error('INDEX_ANCHOR_MISMATCH');
 return original.replace('../../../nostromo/runtime/e5-objective','../../../nostromo/runtime/e5-status').replace(OLD,NEXT);
}
export function stageNativeStatusExecution({upstream,source,stage}){
 if(existsSync(stage))throw Error('STAGE_ALREADY_EXISTS');
 const original=readFileSync(join(upstream,'api/server/index.js'),'utf8'),candidate=renderNativeStatusUpgrade(original);
 mkdirSync(stage,{recursive:true});const hashes={};
 for(const [from,to] of files){const target=join(stage,to);mkdirSync(dirname(target),{recursive:true});copyFileSync(join(source,from),target);hashes[to]=sha(readFileSync(target));}
 writeFileSync(join(stage,'api-server-index.js'),candidate);
 const manifest={schema:'nostromo.e5.status-runtime-manifest.v1',index_before:sha(original),index_after:sha(candidate),files:hashes};
 writeFileSync(join(stage,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=',2)));
 if(!args.upstream||!args.source||!args.stage)throw Error('NEED_EXPLICIT_UPSTREAM_SOURCE_STAGE');
 console.log(JSON.stringify(stageNativeStatusExecution(args),null,2));
}

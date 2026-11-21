'use strict';
/** Existing authenticated LibreChat context owns both agreement and MCP access. */
function createNativeMetricsExecutor({serviceFor,collectionFor,services,managerFor,registryFor,
 flowManagerFor,expectedCommand,expectedCwd,createPort,ReceiptStore,Ledger,executeNativeMetrics}) {
 for(const dependency of [serviceFor,collectionFor,managerFor,registryFor,flowManagerFor,createPort,
   ReceiptStore,Ledger,executeNativeMetrics])if(typeof dependency!=='function')
   throw Error('NATIVE_METRICS_DEPENDENCIES_REQUIRED');
 return async function executeMetricsFor(req,scope,planVersion,planHash){
  const agreements=serviceFor(req),collection=collectionFor();
  if(!agreements||!collection)throw Error('NATIVE_METRICS_STORAGE_UNAVAILABLE');
  const handoff=await agreements.resolveConfirmed(scope,planVersion,planHash);
  if(!handoff)return {status:'DENIED',reason:'AGREEMENT_UNAVAILABLE'};
  const port=createPort({req,services,registry:registryFor(),manager:managerFor(),
    flowManager:flowManagerFor(),expectedCommand,expectedCwd});
  const receipts=new ReceiptStore(collection,agreements);
  const ledger=new Ledger(collection,agreements,receipts,scope,handoff);
  const result=await executeNativeMetrics({scope,planVersion,planHash,agreements,receipts,ledger,port});
  if(result.status==='DENIED'&&result.reason==='IDEMPOTENT_REPLAY_VERIFIED'){
    const prior=await receipts.latest(scope,planVersion,planHash);
    if(prior?.receipt?.tool_id==='nostromo_metricas'&&prior.receipt.outcome==='VERIFIED')
      return {status:'VERIFIED',receiptRef:prior.receiptRef,observation:{status:'READ_OK'},recovered:true};
  }
  return result;
 };
}
module.exports={createNativeMetricsExecutor};

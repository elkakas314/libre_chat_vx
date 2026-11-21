'use strict';
/** Dependencies are supplied by LibreChat's authenticated server process. */
function createNativeStatusExecutor({serviceFor,collectionFor,services,managerFor,registryFor,flowManagerFor,expectedCommand,
  createPort,ReceiptStore,executeNativeStatus}) {
  for(const dependency of [serviceFor,collectionFor,managerFor,registryFor,flowManagerFor,createPort,ReceiptStore,executeNativeStatus])
    if(typeof dependency!=='function')throw Error('NATIVE_STATUS_DEPENDENCIES_REQUIRED');
  async function executeStatusFor(req,scope,planVersion,planHash) {
    const service=serviceFor(req),collection=collectionFor();
    if(!service || !collection)throw Error('NATIVE_STATUS_STORAGE_UNAVAILABLE');
    const port=createPort({req,services,registry:registryFor(),manager:managerFor(),flowManager:flowManagerFor(),expectedCommand});
    const receipts=new ReceiptStore(collection,service);
    return executeNativeStatus({scope,planVersion,planHash,agreements:service,receipts,port});
  }
  executeStatusFor.readLatest=async function(req,scope,version,planHash) {
    const service=serviceFor(req),collection=collectionFor();
    if(!service || !collection)throw Error('NATIVE_STATUS_STORAGE_UNAVAILABLE');
    return new ReceiptStore(collection,service).latest(scope,version,planHash);
  };
  return executeStatusFor;
}
module.exports={createNativeStatusExecutor};

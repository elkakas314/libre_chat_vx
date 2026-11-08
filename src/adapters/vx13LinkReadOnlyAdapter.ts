import type { TargetCapabilityProjection } from '../core/types';
import { ReadOnlyTargetAdapter, type AdapterIdentity,
  type ReadRequest, type ReadResult } from './targetAdapter';

/** SOURCE-only logical ingress. Concrete path/mTLS is owned by Tentáculo Link. */
export type Vx13ReadOperation='health'|'readiness'|'self'|'capabilities'|'ui.snapshot';
export interface Vx13ReadContext {
  principalRef:string;tenantRef:string;sessionRef:string;
  requestId:string;expectedEpoch:string;
}
export interface Vx13LinkRead {
  operation:Vx13ReadOperation;context:Vx13ReadContext;
  args:Record<string,unknown>;
}
export interface Vx13LinkReadback {
  origin:'TENTACULO_LINK';endpointId:'VX13';
  requestId:string;tenantRef:string;epoch:string;
  status:'OK'|'STALE'|'UNAVAILABLE'|'ERROR';
  observedAt:string;observedRevision?:string;sourceRevision?:string;
  evidenceRefs:readonly string[];receiptRef?:string;
  authenticated:boolean;aclVerified:boolean;verificationPassed:boolean;
  value?:unknown;
}
export interface Vx13LinkReadTransport {
  /** Only a separately authenticated Link client can implement this port. */
  invoke(input:Vx13LinkRead):Promise<Vx13LinkReadback>;
}
const OPERATIONS:readonly string[]=['health','readiness','self','capabilities','ui.snapshot'];
const safeRef=(x:unknown)=>typeof x==='string'&&
  x.length>=8&&x.length<=180&&/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(x);
function context(args:Record<string,unknown>|undefined):Vx13ReadContext|null {
  if(!args||!safeRef(args.principalRef)||!safeRef(args.tenantRef)||
    !safeRef(args.sessionRef)||!safeRef(args.requestId)||!safeRef(args.expectedEpoch))
    return null;
  return {principalRef:args.principalRef as string,tenantRef:args.tenantRef as string,
    sessionRef:args.sessionRef as string,requestId:args.requestId as string,
    expectedEpoch:args.expectedEpoch as string};
}
export class Vx13LinkReadOnlyAdapter extends ReadOnlyTargetAdapter {
  readonly authority=false as const;
  constructor(private readonly link:Vx13LinkReadTransport,
    private readonly now:()=>number=()=>Date.now()) {super();}
  identity():AdapterIdentity {
    return {endpointId:'VX13',endpointKind:'TARGET',adapterId:'vx13-link-readonly-v1',
      authority:false};
  }
  health():Promise<ReadResult> {return this.read({operation:'health'});}
  readiness():Promise<ReadResult> {return this.read({operation:'readiness'});}
  async discoverCapabilities():Promise<TargetCapabilityProjection[]> {
    // Never infer capabilities from a SOURCE schema or an unauthenticated list.
    return [];
  }
  async read<T=unknown>(request:ReadRequest):Promise<ReadResult<T>> {
    const op=request.operation;
    if(!OPERATIONS.includes(op))return this.unavailable('VX13_LINK_OPERATION_DENIED');
    const ctx=context(request.args);
    if(!ctx)return this.unavailable('VX13_LINK_AUTH_CONTEXT_REQUIRED');
    const args:Record<string,unknown>={...request.args};
    for(const key of ['principalRef','tenantRef','sessionRef','requestId','expectedEpoch'])delete args[key];
    if(op!=='ui.snapshot'&&Object.keys(args).length) return this.unavailable('VX13_LINK_EXTRA_ARGS');
    if(op==='ui.snapshot'&&Object.keys(args).some(k=>k!=='scopeRef'))
      return this.unavailable('VX13_LINK_EXTRA_ARGS');
    if(op==='ui.snapshot'&&args.scopeRef!==undefined&&!safeRef(args.scopeRef))
      return this.unavailable('VX13_LINK_SCOPE_INVALID');
    try{
      const response=await this.link.invoke({operation:op as Vx13ReadOperation,
        context:ctx,args});
      const observed=Date.parse(response?.observedAt??'');
      const fresh=Number.isFinite(observed)&&observed<=this.now()&&
        this.now()-observed<=300_000;
      const integrity=response?.origin==='TENTACULO_LINK'&&response.endpointId==='VX13'&&
        response.requestId===ctx.requestId&&response.tenantRef===ctx.tenantRef&&
        response.epoch===ctx.expectedEpoch&&response.authenticated===true&&
        response.aclVerified===true&&response.verificationPassed===true&&
        Array.isArray(response.evidenceRefs)&&response.evidenceRefs.length>0&&
        response.evidenceRefs.every(safeRef)&&fresh;
      if(!integrity)return this.unavailable('VX13_LINK_READBACK_UNVERIFIED');
      return {endpointId:'VX13',status:response.status==='OK'?'OK':
        response.status==='STALE'?'STALE':'UNAVAILABLE',
        ...(response.status==='OK'&&{value:response.value as T}),
        truth:{targetId:'VX13',truthClass:'EXTERNAL',
          status:response.status==='OK'?'VERIFIED':'STALE',
          observedAt:response.observedAt,observedRevision:response.observedRevision,
          evidenceRefs:[...response.evidenceRefs],receiptRef:response.receiptRef,
          ...(response.status!=='OK'&&{uncertaintyReason:'VX13_LINK_NOT_READY'})}};
    }catch{return this.unavailable('VX13_LINK_TRANSPORT_UNAVAILABLE');}
  }
  private unavailable<T>(reason:string):ReadResult<T> {
    return {endpointId:'VX13',status:'UNAVAILABLE',truth:{targetId:'VX13',
      truthClass:'SOURCE',status:'NO_VERIFICADO',
      observedAt:new Date(this.now()).toISOString(),evidenceRefs:[],
      uncertaintyReason:reason}};
  }
}

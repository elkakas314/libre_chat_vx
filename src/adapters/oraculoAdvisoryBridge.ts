/** ORACULO is ADVISORY, not a material target, and has a dedicated private ingress. */
export type OraculoAdvisoryOperation='ORACULO_HEALTH'|'ORACULO_READINESS'|'ORACULO_QUERY';
export interface OraculoAdvisoryRequest {
  operation:OraculoAdvisoryOperation;requestId:string;objective?:string;
  contextRefs?:readonly string[];
}
export interface OraculoAdvisoryReadback {
  endpointId:'ORACULO';status:'OK'|'DEGRADED'|'UNAVAILABLE'|'ERROR';
  observedAt?:string;releaseId?:string;sourceRevision?:string;
  evidenceRefs:readonly string[];receiptRef?:string;value?:unknown;
  peerIdentityVerified:boolean;verificationPassed:boolean;
  error?:string;
}
export type OraculoProjectedTruth={
  endpointId:'ORACULO';kind:'ADVISORY_ONLY';authority:false;
  status:'VERIFIED_READ'|'DEGRADED'|'UNAVAILABLE'|'NO_VERIFICADO';
  evidenceRefs:readonly string[];observedAt?:string;receiptRef?:string;
  releaseId?:string;value?:unknown;
};
export interface OraculoAdvisoryTransport {
  /** A separate trusted host transport mediates existing MANOJOS3 mTLS ingress. */
  invoke(request:OraculoAdvisoryRequest):Promise<OraculoAdvisoryReadback>;
}
function validId(value:string):boolean{return /^[A-Za-z0-9][A-Za-z0-9_-]{7,99}$/.test(value);}
function validRef(value:string):boolean{return value.length<512 && /^[A-Za-z0-9_:./-]+$/.test(value);}
export function validateOraculoRequest(input:OraculoAdvisoryRequest):boolean {
  return !!input&&['ORACULO_HEALTH','ORACULO_READINESS','ORACULO_QUERY'].includes(input.operation)&&
    typeof input.requestId==='string'&&validId(input.requestId)&&
    (input.operation!=='ORACULO_QUERY'||!!input.objective?.trim())&&
    (input.operation==='ORACULO_QUERY'||input.objective===undefined)&&
    (input.objective===undefined||(input.objective.length<=5000&&!/[\u0000-\u0008]/.test(input.objective)))&&
    (input.contextRefs===undefined||Array.isArray(input.contextRefs)&&
      input.contextRefs.length<=12&&input.contextRefs.every(r=>typeof r==='string'&&validRef(r)));
}
export function projectOraculoReadback(r:OraculoAdvisoryReadback, nowMs:number=Date.now()):
  OraculoProjectedTruth {
  const date=r.observedAt?Date.parse(r.observedAt):NaN;
  const liveFresh=Number.isFinite(date)&&date<=nowMs&&nowMs-date<=300_000;
  const proofs=Array.isArray(r.evidenceRefs)&&r.evidenceRefs.length>0&&
    r.evidenceRefs.every(x=>typeof x==='string'&&validRef(x));
  const verified=r.endpointId==='ORACULO'&&r.status==='OK'&&
    r.peerIdentityVerified===true&&r.verificationPassed===true&&liveFresh&&proofs;
  return {
    endpointId:'ORACULO',kind:'ADVISORY_ONLY',authority:false,
    status:verified?'VERIFIED_READ':r.status==='DEGRADED'?'DEGRADED':
      r.status==='UNAVAILABLE'?'UNAVAILABLE':'NO_VERIFICADO',
    evidenceRefs:proofs?r.evidenceRefs:[],
    ...(Number.isFinite(date)&&{observedAt:r.observedAt}),
    ...(verified&&r.receiptRef&&validRef(r.receiptRef)&&{receiptRef:r.receiptRef}),
    ...(verified&&r.releaseId&&validRef(r.releaseId)&&{releaseId:r.releaseId}),
    ...(verified&&{value:r.value}),
  };
}
export class OraculoAdvisoryBridge {
  readonly authority=false as const;
  readonly targetAuthority=false as const;
  constructor(private readonly transport?:OraculoAdvisoryTransport,
    private readonly now:()=>number=()=>Date.now()) {}
  async read(req:OraculoAdvisoryRequest):Promise<OraculoProjectedTruth> {
    if(!validateOraculoRequest(req))throw new Error('ORACULO_ADVISORY_REQUEST_REJECTED');
    if(!this.transport)return {endpointId:'ORACULO',kind:'ADVISORY_ONLY',authority:false,
      status:'UNAVAILABLE',evidenceRefs:[]};
    const reply=await this.transport.invoke(req); // exactly one read, never material retry
    return projectOraculoReadback(reply,this.now());
  }
}

/**
 * NOSTROMO server-only adapter for the EXISTING, independent HOST_CONTROL MCP.
 * It is not an MCP server, terminal, authority, grant mint, or GUI controller.
 * Never export from src/index.ts (also consumed by the React client).
 */
export type HostReadOperation =
  | 'host_status' | 'host_listener_status'
  | 'host_service_status' | 'host_git_status';

export type HostReadIntent =
  | {operation:'host_status'|'host_listener_status'}
  | {operation:'host_service_status';unit:string}
  | {operation:'host_git_status';path:string};

export interface HostIngressProof {
  mechanism:'LOCAL_VERIFIED'|'MTLS_VERIFIED';
  target:'HOST_CONTROL';
  principalRef:string;
  observedAtMs:number;
  expiresAtMs:number;
}
/** Server-injected transport; attest() MUST derive from the real local/mTLS
 * connection, not an HTTP header, chat parameter, model text or UI payload.
 */
export interface HostControlPort {
  attest():Promise<HostIngressProof|null>;
  callTool(name:string,args:Readonly<Record<string,unknown>>):Promise<unknown>;
}
export interface ExistingLocalRestartGrant {
  grantId:string;
  operation:'host_service_restart';
  risk:'R2';
  target:string;
  expiresAtMs:number;
  /** A host-local, independent grant check is still mandatory in HOST_CONTROL. */
}
/** This provider can only READ a pre-existing local grant from host-owned state.
 * It MUST NOT expose a method for an agent or remote user to mint/approve grants.
 */
export interface ExistingHostGrantProvider {
  findExistingRestartGrant(unit:string):Promise<ExistingLocalRestartGrant|null>;
}
export interface HostRecoveryScope {
  enabled:boolean;
  readonly allowedServices:readonly string[];
  readonly allowedRepositories:readonly string[];
}
export interface HostReadOutcome {
  status:'OBSERVED_UNVERIFIED'|'UNAVAILABLE'|'DENIED';
  operation:HostReadOperation;
  data?:unknown;
  reason?:string;
  authority:false;
}
export interface HostRepairOutcome {
  status:'DENIED'|'LOCAL_GRANT_REQUIRED'|'UNAVAILABLE'|'RECONCILE_REQUIRED';
  operation:'host_service_restart';
  target:string;
  actionSubmitted:boolean;
  readback?:unknown;
  reason?:string;
  authority:false;
}
const unitPattern=/^[A-Za-z0-9_.@-]+\.service$/;
const gitPathPattern=/^\/(?:[A-Za-z0-9_.-]+\/?)+$/;
const grantPattern=/^[A-Za-z0-9_-]{8,80}$/;
const acceptable=(s:unknown):s is string=>typeof s==='string'&&s.length>0;
export class NostromoHostControlBridge {
  readonly authority=false as const;
  constructor(
    private readonly port:HostControlPort|null,
    private readonly grants:ExistingHostGrantProvider|null,
    private readonly scope:HostRecoveryScope,
    private readonly now:()=>number=()=>Date.now(),
  ) {}
  private async admitted():Promise<boolean> {
    if(!this.scope.enabled||!this.port)return false;
    let proof:HostIngressProof|null;
    try{proof=await this.port.attest();}catch{return false;}
    const now=this.now();
    return !!proof&&proof.target==='HOST_CONTROL'&&
      (proof.mechanism==='LOCAL_VERIFIED'||proof.mechanism==='MTLS_VERIFIED')&&
      acceptable(proof.principalRef)&&Number.isSafeInteger(now)&&
      Number.isSafeInteger(proof.observedAtMs)&&
      Number.isSafeInteger(proof.expiresAtMs)&&
      proof.observedAtMs<=now&&now-proof.observedAtMs<=60_000&&
      proof.expiresAtMs>now;
  }
  async read(intent:HostReadIntent):Promise<HostReadOutcome> {
    const operation=intent.operation;
    const args:Record<string,unknown>={};
    if(operation==='host_service_status') {
      if(!unitPattern.test(intent.unit)||!this.scope.allowedServices.includes(intent.unit))
        return {operation,status:'DENIED',reason:'SERVICE_NOT_ALLOWLISTED',authority:false};
      args.unit=intent.unit;
    } else if(operation==='host_git_status') {
      if(!gitPathPattern.test(intent.path)||!this.scope.allowedRepositories.includes(intent.path))
        return {operation,status:'DENIED',reason:'REPOSITORY_NOT_ALLOWLISTED',authority:false};
      args.path=intent.path;
    } else if(operation!=='host_status'&&operation!=='host_listener_status'){
      return {operation,status:'DENIED',reason:'HOST_READ_NOT_ALLOWLISTED',authority:false};
    }
    if(!await this.admitted())
      return {operation,status:'UNAVAILABLE',reason:'HOST_CONTROL_BINDING_UNVERIFIED',authority:false};
    try {
      const data=await this.port!.callTool(operation,args);
      return {operation,status:'OBSERVED_UNVERIFIED',data,authority:false};
    } catch {
      return {operation,status:'UNAVAILABLE',reason:'HOST_CONTROL_READ_FAILED',authority:false};
    }
  }
  /**
   * The ONLY material operation currently exposed by this candidate bridge.
   * R2 grant MUST preexist in the local host, be exact-scope, and be consumed
   * by HOST_CONTROL itself. Even Operator Mode cannot bypass this caller gate.
   * No automated retries and no claimed material PASS from transport response.
   */
  async restartUserService(unit:string):Promise<HostRepairOutcome> {
    const operation='host_service_restart' as const;
    const outcome=(status:HostRepairOutcome['status'],reason:string,actionSubmitted=false,
      readback?:unknown):HostRepairOutcome=>
      ({operation,target:unit,status,reason,actionSubmitted,readback,authority:false});
    if(!unitPattern.test(unit)||!this.scope.allowedServices.includes(unit))
      return outcome('DENIED','SERVICE_NOT_ALLOWLISTED');
    if(!await this.admitted())return outcome('UNAVAILABLE','HOST_CONTROL_BINDING_UNVERIFIED');
    if(!this.grants)return outcome('LOCAL_GRANT_REQUIRED','HOST_LOCAL_GRANT_PROVIDER_NOT_BOUND');
    let grant:ExistingLocalRestartGrant|null;
    try {grant=await this.grants.findExistingRestartGrant(unit);}
    catch{return outcome('LOCAL_GRANT_REQUIRED','HOST_LOCAL_GRANT_READ_FAILED');}
    if(!grant||grant.operation!==operation||grant.risk!=='R2'||grant.target!==unit||
      !grantPattern.test(grant.grantId)||!Number.isSafeInteger(grant.expiresAtMs)||
      grant.expiresAtMs<=this.now())
      return outcome('LOCAL_GRANT_REQUIRED','HOST_EXACT_LOCAL_R2_GRANT_REQUIRED');
    let attempted=false;
    try {
      attempted=true;
      await this.port!.callTool(operation,{unit,grant_id:grant.grantId});
    } catch {
      // An ambiguous effect MUST NOT be automatically retried.
      return outcome('RECONCILE_REQUIRED','HOST_RESTART_OUTCOME_UNKNOWN',attempted);
    }
    try {
      const readback=await this.port!.callTool('host_service_status',{unit});
      // Status alone is not proof that the intended repair succeeded.
      return outcome('RECONCILE_REQUIRED','HOST_SERVICE_READBACK_REQUIRES_OPERATOR_VERIFICATION',
        attempted,readback);
    }catch{
      return outcome('RECONCILE_REQUIRED','HOST_RESTART_READBACK_UNAVAILABLE',attempted);
    }
  }
}

import {createHash} from 'node:crypto';
import type { ObjectiveHandoff } from '../contracts/objectiveHandoff';
import type { IdempotencyLedger, LedgerEntry } from '../cockpit/governedMcpDispatch';
import { NativeObjectiveAgreement, type AgreementScope } from './nativeObjectiveAgreement';
import { NativeObjectiveReceiptStore } from './nativeObjectiveReceipts';

const HASH = /^[a-f0-9]{64}$/;
const REF = /^nostromo-receipt:[a-f0-9]{64}$/;
const MAX_CLAIMS = 64;
function canonical(value:unknown):string {
  if(value===null||value===undefined)return 'null';
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(typeof value==='object') {
    const obj=value as Record<string,unknown>;
    return '{'+Object.keys(obj).sort().map(k=>JSON.stringify(k)+':'+canonical(obj[k])).join(',')+'}';
  }
  return JSON.stringify(value);
}
function fingerprintFor(receipt:import('../cockpit/governedMcpDispatch').ExecutionReceipt):string {
  return createHash('sha256').update(canonical({
    objective_ref:receipt.objective_ref,agreement_ref:receipt.agreement_ref,
    plan_hash:receipt.plan_hash,plan_version:receipt.plan_version,
    target_id:receipt.target_id,tool_id:receipt.tool_id,
    principal:receipt.principal_ref,tenant:receipt.tenant_ref,
    args_hash:receipt.args_hash,
  })).digest('hex');
}
type Claim = LedgerEntry & {key:string};
type Collection = {
  findOne(filter:Record<string,unknown>,options:{projection:Record<string,number>}):
    Promise<{nostromoObjectiveAgreement?:{revision?:number; dispatchClaims?:Claim[]}}|null>;
  updateOne(filter:Record<string,unknown>,update:Record<string,unknown>):
    Promise<{matchedCount:number}>;
};

/**
 * E5: a durable, scoped dispatch CLAIM journal inside the EXISTING private
 * Mongo conversation field. This is not a task queue, a new DB or authority.
 * All effects still pass through the existing MCP and host ACL.
 */
export class NativeObjectiveDispatchLedger implements IdempotencyLedger {
  private readonly scope: AgreementScope;
  private readonly handoff: ObjectiveHandoff;
  constructor(
    private readonly collection:Collection,
    private readonly agreements:NativeObjectiveAgreement,
    private readonly receipts:NativeObjectiveReceiptStore,
    scope:AgreementScope,
    handoff:ObjectiveHandoff,
  ) {
    this.scope=structuredClone(scope);
    this.handoff=structuredClone(handoff);
  }

  private ownerFilter():Record<string,unknown> {
    const s=this.scope;
    return {user:s.userId,conversationId:s.conversationId,
      tenantId:s.tenantId===null?{$exists:false}:s.tenantId,
      subagentThread:null,
      $or:[{expiredAt:null},{expiredAt:{$gt:new Date()}}]};
  }

  /** Never interpret a failed DB read as "no claim": fail closed. */
  private unknown():LedgerEntry {
    return {state:'UNKNOWN_OUTCOME',fingerprint:'UNVERIFIED_STORAGE',atMs:0};
  }

  private async current():Promise<number|null> {
    if (!await this.agreements.verify(this.scope,this.handoff)) return null;
    const view=await this.agreements.current(this.scope);
    return view.ok && view.phase==='AGREED' &&
      view.plan.plan_hash===this.handoff.plan_hash &&
      view.plan.plan_version===this.handoff.plan_version &&
      Number.isSafeInteger(view.revision) ? view.revision : null;
  }

  async get(key:string):Promise<LedgerEntry|null> {
    if (!HASH.test(key)||key!==this.handoff.idempotency_key) return this.unknown();
    try {
      if (await this.current()===null) return this.unknown();
      const doc=await this.collection.findOne(this.ownerFilter(),{
        projection:{'nostromoObjectiveAgreement.dispatchClaims':1}});
      const claims=doc?.nostromoObjectiveAgreement?.dispatchClaims;
      if (!doc || (claims!==undefined&&!Array.isArray(claims))) return this.unknown();
      if(!claims) return null;
      const matching=claims.filter(x=>x?.key===key);
      if (matching.length>1) return this.unknown();
      if(matching.length===0)return null;
      const record=matching[0]!;
      if(!HASH.test(record.fingerprint)||!Number.isSafeInteger(record.atMs)||
         !['DISPATCHED','UNKNOWN_OUTCOME','VERIFIED','FAILED'].includes(record.state))
        return this.unknown();
      return {...structuredClone(record)};
    }catch{return this.unknown();}
  }

  /** Mongo $push conditional is the atomic cross-process reserve gate. */
  async begin(key:string,fingerprint:string,atMs:number):Promise<boolean> {
    if(!HASH.test(key)||key!==this.handoff.idempotency_key||!HASH.test(fingerprint)||
       !Number.isSafeInteger(atMs)||atMs<1)return false;
    try {
      const revision=await this.current();
      if(revision===null)return false;
      const claim:Claim={key,fingerprint,state:'DISPATCHED',atMs};
      const out=await this.collection.updateOne({
        ...this.ownerFilter(),
        'nostromoObjectiveAgreement.revision':revision,
        'nostromoObjectiveAgreement.dispatchClaims.key':{$ne:key},
        [`nostromoObjectiveAgreement.dispatchClaims.${MAX_CLAIMS-1}`]:{$exists:false},
      },{$push:{'nostromoObjectiveAgreement.dispatchClaims':claim}});
      // If the plan changed during the write, do not dispatch even if claimed.
      return out.matchedCount===1 && await this.agreements.verify(this.scope,this.handoff);
    }catch{return false;}
  }

  async markUnknown(key:string,atMs:number):Promise<void> {
    if(!HASH.test(key)||key!==this.handoff.idempotency_key||!Number.isSafeInteger(atMs)||atMs<1)
      throw Error('INVALID_DISPATCH_CLAIM');
    const state=await this.get(key);
    if(!state||state.fingerprint==='UNVERIFIED_STORAGE')
      throw Error('DISPATCH_CLAIM_UNAVAILABLE');
    try {
      const out=await this.collection.updateOne({...this.ownerFilter(),
        'nostromoObjectiveAgreement.dispatchClaims':{$elemMatch:{
          key,fingerprint:state.fingerprint,state:{$in:['DISPATCHED','UNKNOWN_OUTCOME']},
        }}},{$set:{
          'nostromoObjectiveAgreement.dispatchClaims.$.state':'UNKNOWN_OUTCOME',
          'nostromoObjectiveAgreement.dispatchClaims.$.atMs':atMs,
        }});
      if(out.matchedCount!==1)throw Error('DISPATCH_CLAIM_UPDATE_CONFLICT');
    }catch{throw Error('DISPATCH_CLAIM_PERSISTENCE_FAILED');}
  }

  async complete(key:string,outcome:'VERIFIED'|'FAILED',atMs:number,receiptRef?:string):Promise<void> {
    if(!HASH.test(key)||key!==this.handoff.idempotency_key||!Number.isSafeInteger(atMs)||atMs<1)
      throw Error('INVALID_DISPATCH_CLAIM');
    if(outcome==='FAILED') {
      // A transport ERROR does not prove that no effect occurred. Preserve
      // UNKNOWN_OUTCOME, never release a claimed key to another dispatch.
      return this.markUnknown(key,atMs);
    }
    if(!receiptRef||!REF.test(receiptRef))throw Error('VERIFIED_RECEIPT_REQUIRED');
    const receipt=await this.receipts.read(this.scope,receiptRef);
    if(!receipt || receipt.outcome!=='VERIFIED' ||
       receipt.idempotency_key!==key || receipt.plan_hash!==this.handoff.plan_hash ||
       receipt.agreement_ref!==this.handoff.agreement_ref ||
       receipt.principal_ref!==this.scope.userId || receipt.tenant_ref!==this.scope.tenantId)
      throw Error('RECEIPT_READBACK_MISMATCH');
    const state=await this.get(key);
    if(!state||state.fingerprint==='UNVERIFIED_STORAGE')
      throw Error('DISPATCH_CLAIM_UNAVAILABLE');
    if(state.fingerprint!==fingerprintFor(receipt) ||
       receipt.acceptance.length<1 || receipt.acceptance.some(a=>a.result!=='PASS'))
      throw Error('RECEIPT_FINGERPRINT_OR_ACCEPTANCE_MISMATCH');
    try {
      const out=await this.collection.updateOne({...this.ownerFilter(),
        'nostromoObjectiveAgreement.dispatchClaims':{$elemMatch:{
          key,fingerprint:state.fingerprint,state:{$in:['DISPATCHED','UNKNOWN_OUTCOME']},
        }}},{$set:{
          'nostromoObjectiveAgreement.dispatchClaims.$.state':'VERIFIED',
          'nostromoObjectiveAgreement.dispatchClaims.$.atMs':atMs,
          'nostromoObjectiveAgreement.dispatchClaims.$.receiptRef':receiptRef,
        }});
      if(out.matchedCount!==1)throw Error('DISPATCH_CLAIM_UPDATE_CONFLICT');
    }catch{throw Error('DISPATCH_CLAIM_PERSISTENCE_FAILED');}
  }
}

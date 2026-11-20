import { createHash, randomUUID } from 'node:crypto';
import { isObjectiveHandoff, type ObjectiveHandoff } from '../contracts/objectiveHandoff';

/** Host-only agreement logic. The authenticated route supplies this identity; never use model data. */
export interface AgreementPrincipal { userId: string; tenantId: string | null; }
export interface AgreementScope extends AgreementPrincipal { conversationId: string; }
export interface AgreementPlan { phase: 'PREVIEWED' | 'AGREED'; handoff: ObjectiveHandoff; }
export interface AgreementState { revision: number; plans: AgreementPlan[]; }
export interface ConversationAgreementStore {
  read(scope: AgreementScope): Promise<{ found: boolean; state?: AgreementState }>;
  /** Atomic compare-and-swap scoped to the existing conversation's authenticated owner. */
  compareAndSwap(scope: AgreementScope, expectedRevision: number, next: AgreementState): Promise<boolean>;
}

/** Minimal existing Mongo conversation collection interface; no new collection. */
export interface AgreementConversationCollection {
  findOne(filter: Record<string,unknown>, options: { projection: Record<string,number> }): Promise<{ nostromoObjectiveAgreement?: AgreementState } | null>;
  updateOne(filter: Record<string,unknown>, update: Record<string,unknown>): Promise<{ matchedCount: number }>;
}

/**
 * Uses a server-owned conversation field. Before mounting, native client-write
 * paths must be proven unable to write this field and reads must exclude it.
 */
export function mongoConversationAgreementStore(collection: AgreementConversationCollection): ConversationAgreementStore {
  const ownerFilter = (scope: AgreementScope): Record<string,unknown> => ({
    user:scope.userId, conversationId:scope.conversationId,
    tenantId:scope.tenantId === null ? { $exists:false } : scope.tenantId,
    subagentThread:null,
    $or:[{expiredAt:null},{expiredAt:{$gt:new Date()}}],
  });
  return {
    async read(scope) {
      if (!validScope(scope)) return {found:false};
      const doc=await collection.findOne(ownerFilter(scope),{projection:{_id:1,nostromoObjectiveAgreement:1}});
      return doc ? {found:true,state:doc.nostromoObjectiveAgreement} : {found:false};
    },
    async compareAndSwap(scope,expectedRevision,next) {
      try { scope=structuredClone(scope); next=structuredClone(next); } catch { return false; }
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision<0 || !validScope(scope) || !validState(next,scope) || next.revision!==expectedRevision+1) return false;
      const expected=expectedRevision===0 ? {nostromoObjectiveAgreement:{$exists:false}} :
        {'nostromoObjectiveAgreement.revision':expectedRevision};
      // Preserve host-owned sibling fields (e.g. execution receipts) during a plan CAS.
      const result=await collection.updateOne({...ownerFilter(scope),...expected},{$set:{
        'nostromoObjectiveAgreement.revision':next.revision,'nostromoObjectiveAgreement.plans':next.plans,
      }});
      return result.matchedCount===1;
    },
  };
}

const HASH = /^[a-f0-9]{64}$/;
const EMPTY_HASH = '0'.repeat(64);
const MAX_PLANS = 32;
const validScope = (s: AgreementScope): boolean => typeof s.userId === 'string' && s.userId.length > 0 && s.userId.length <= 256 &&
  (s.tenantId === null || typeof s.tenantId === 'string' && s.tenantId.length > 0 && s.tenantId.length <= 256) &&
  typeof s.conversationId === 'string' && s.conversationId.length > 0 && s.conversationId.length <= 256;
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    const obj=value as Record<string,unknown>;
    return '{' + Object.keys(obj).sort().map((key)=>JSON.stringify(key)+':'+canonical(obj[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}
const hash = (value: unknown): string => createHash('sha256').update(canonical(value)).digest('hex');
function planHash(scope: AgreementScope, handoff: ObjectiveHandoff): string {
  const { agreement_ref: _a, plan_hash: _h, idempotency_key: _i, status: _s, ...plan } = handoff;
  return hash({ domain:'nostromo.objective.plan.v1', principal:scope, plan });
}
function idempotencyKey(scope: AgreementScope, handoff: ObjectiveHandoff): string {
  return hash({ domain:'nostromo.objective.idempotency.v1', principal:scope, agreement_ref:handoff.agreement_ref,
    plan_hash:handoff.plan_hash, plan_version:handoff.plan_version, target_id:handoff.target_id });
}
function validState(state: AgreementState | undefined, scope: AgreementScope): state is AgreementState {
  if (!state || !Number.isSafeInteger(state.revision) || !Array.isArray(state.plans) || state.plans.length>MAX_PLANS ||
      state.revision!==state.plans.length+state.plans.filter((p)=>p?.phase==='AGREED').length) return false;
  return state.plans.every((p,index)=>{
    if (!p || !['PREVIEWED','AGREED'].includes(p.phase) || !isObjectiveHandoff(p.handoff) ||
        p.handoff.status!=='AGREED' || p.handoff.plan_version!==index+1 || p.handoff.conversation_ref!==scope.conversationId ||
        p.handoff.plan_hash!==planHash(scope,p.handoff)) return false;
    if (p.phase==='PREVIEWED') return p.handoff.agreement_ref==='UNCONFIRMED' && p.handoff.idempotency_key===EMPTY_HASH;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(p.handoff.agreement_ref) &&
      p.handoff.idempotency_key===idempotencyKey(scope,p.handoff);
  });
}

/**
 * These methods are not HTTP handlers and do not authenticate the caller.
 * Mount only behind LibreChat's native authentication, ownership and CSRF
 * checks; confirmation must follow an explicit user action on the shown plan.
 */
export class NativeObjectiveAgreement {
  constructor(private readonly store: ConversationAgreementStore) {}

  /** Reconnect readback exposes the current plan, never the host agreement or idempotency key. */
  async current(scope: AgreementScope) {
    try { scope=structuredClone(scope); } catch { return {ok:false as const,reason:'INVALID_SCOPE'}; }
    if (!validScope(scope)) return {ok:false as const,reason:'INVALID_SCOPE'};
    const loaded=await this.store.read(scope);
    if (!loaded.found) return {ok:false as const,reason:'CONVERSATION_UNAVAILABLE'};
    if (!loaded.state) return {ok:true as const,revision:0,phase:'NONE' as const,authority:false as const};
    if (!validState(loaded.state,scope)) return {ok:false as const,reason:'AGREEMENT_STATE_INVALID'};
    const last=loaded.state.plans.at(-1);
    if (!last) return {ok:true as const,revision:0,phase:'NONE' as const,authority:false as const};
    const {agreement_ref:_a,idempotency_key:_i,status:_s,...plan}=last.handoff;
    return {ok:true as const,revision:loaded.state.revision,phase:last.phase,plan:structuredClone(plan),authority:false as const};
  }

  async preview(scope: AgreementScope, proposal: unknown, expectedRevision: number) {
    try { scope=structuredClone(scope); proposal=structuredClone(proposal); } catch { return { ok:false as const, reason:'INVALID_PROPOSAL' }; }
    if (!validScope(scope) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || !isObjectiveHandoff(proposal) ||
        proposal.conversation_ref !== scope.conversationId || proposal.status !== 'AGREED') return { ok:false as const, reason:'INVALID_PROPOSAL' };
    const loaded=await this.store.read(scope);
    if (!loaded.found) return { ok:false as const, reason:'CONVERSATION_UNAVAILABLE' };
    const state=loaded.state ?? {revision:0,plans:[]};
    if (!validState(state,scope)) return { ok:false as const, reason:'AGREEMENT_STATE_INVALID' };
    if (state.revision!==expectedRevision) return { ok:false as const, reason:'REVISION_CONFLICT' };
    if (state.plans.length>=MAX_PLANS) return { ok:false as const, reason:'AGREEMENT_HISTORY_FULL' };
    const last=state.plans.at(-1);
    const version=(last?.handoff.plan_version ?? 0)+1;
    if (!Number.isSafeInteger(version)) return { ok:false as const, reason:'VERSION_EXHAUSTED' };
    const draft: ObjectiveHandoff={...structuredClone(proposal),plan_version:version,agreement_ref:'UNCONFIRMED',
      plan_hash:EMPTY_HASH,idempotency_key:EMPTY_HASH,status:'AGREED',authority:false};
    draft.plan_hash=planHash(scope,draft);
    const next: AgreementState={revision:state.revision+1,plans:[...state.plans,{phase:'PREVIEWED',handoff:draft}]};
    if (!await this.store.compareAndSwap(scope,state.revision,next)) return { ok:false as const, reason:'REVISION_CONFLICT' };
    const {agreement_ref:_a,idempotency_key:_i,status:_s,...preview}=draft;
    return {ok:true as const, phase:'PREVIEWED' as const, revision:next.revision, preview, authority:false as const};
  }

  async confirm(scope: AgreementScope, version: number, expectedHash: string, expectedRevision: number) {
    try { scope=structuredClone(scope); } catch { return { ok:false as const, reason:'INVALID_CONFIRMATION' }; }
    if (!validScope(scope) || !Number.isSafeInteger(version) || version < 1 || !HASH.test(expectedHash) ||
        !Number.isSafeInteger(expectedRevision) || expectedRevision < 1) return { ok:false as const, reason:'INVALID_CONFIRMATION' };
    const loaded=await this.store.read(scope);
    if (!loaded.found || !validState(loaded.state,scope)) return { ok:false as const, reason:'CONVERSATION_UNAVAILABLE' };
    const state=loaded.state, current=state.plans.at(-1);
    if (!current || current.handoff.plan_version!==version || current.handoff.plan_hash!==expectedHash ||
        planHash(scope,current.handoff)!==expectedHash) return { ok:false as const, reason:'PLAN_MISMATCH' };
    if (current.phase==='AGREED') {
      if (state.revision!==expectedRevision+1) return { ok:false as const, reason:'REVISION_CONFLICT' };
      return {ok:true as const,revision:state.revision,handoff:structuredClone(current.handoff),authority:false as const};
    }
    if (state.revision!==expectedRevision) return { ok:false as const, reason:'REVISION_CONFLICT' };
    const agreed:ObjectiveHandoff={...structuredClone(current.handoff),agreement_ref:randomUUID()};
    agreed.idempotency_key=idempotencyKey(scope,agreed);
    const next:AgreementState={revision:state.revision+1,plans:[...state.plans.slice(0,-1),{phase:'AGREED',handoff:agreed}]};
    if (!await this.store.compareAndSwap(scope,state.revision,next)) return { ok:false as const, reason:'REVISION_CONFLICT' };
    return {ok:true as const,revision:next.revision,handoff:structuredClone(agreed),authority:false as const};
  }

  /** Host-only read for dispatch. Never return this handoff to the browser. */
  async resolveConfirmed(scope: AgreementScope, version: number, expectedHash: string): Promise<ObjectiveHandoff | null> {
    try { scope = structuredClone(scope); } catch { return null; }
    if (!validScope(scope) || !Number.isSafeInteger(version) || version < 1 ||
        typeof expectedHash !== 'string' || !HASH.test(expectedHash)) return null;
    const loaded = await this.store.read(scope);
    if (!loaded.found || !validState(loaded.state, scope)) return null;
    const current = loaded.state.plans.at(-1);
    if (!current || current.phase !== 'AGREED' || current.handoff.plan_version !== version ||
        current.handoff.plan_hash !== expectedHash) return null;
    return structuredClone(current.handoff);
  }

  async verify(scope: AgreementScope, candidate: unknown): Promise<boolean> {
    try { scope=structuredClone(scope); candidate=structuredClone(candidate); } catch { return false; }
    if (!validScope(scope) || !isObjectiveHandoff(candidate) || candidate.status!=='AGREED' || candidate.conversation_ref!==scope.conversationId) return false;
    const loaded=await this.store.read(scope);
    if (!loaded.found || !validState(loaded.state,scope)) return false;
    const current=loaded.state.plans.at(-1);
    return !!current && current.phase==='AGREED' && canonical(current.handoff)===canonical(candidate) &&
      candidate.plan_hash===planHash(scope,candidate) && candidate.idempotency_key===idempotencyKey(scope,candidate);
  }
}

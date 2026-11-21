import { createHash } from 'node:crypto';
import type { ExecutionReceipt } from '../cockpit/governedMcpDispatch';
import type { AgreementScope } from './nativeObjectiveAgreement';
import { NativeObjectiveAgreement } from './nativeObjectiveAgreement';

type ReceiptRecord = { ref: string; receipt: ExecutionReceipt };
type Collection = {
  findOne(filter: Record<string, unknown>, options: { projection: Record<string, number> }): Promise<{
    nostromoObjectiveAgreement?: { revision?: number; receipts?: ReceiptRecord[] };
  } | null>;
  updateOne(filter: Record<string, unknown>, update: Record<string, unknown>): Promise<{ matchedCount: number }>;
};

/** Receipts share the existing private conversation field, not a new queue or database. */
export class NativeObjectiveReceiptStore {
  constructor(private readonly collection: Collection, private readonly agreements: NativeObjectiveAgreement) {}

  private valid(scope: AgreementScope): boolean {
    return !!scope && typeof scope.userId === 'string' && scope.userId.length > 0 && scope.userId.length <= 256 &&
      (scope.tenantId === null || typeof scope.tenantId === 'string' && scope.tenantId.length > 0 && scope.tenantId.length <= 256) &&
      typeof scope.conversationId === 'string' && scope.conversationId.length > 0 && scope.conversationId.length <= 256;
  }

  private filter(scope: AgreementScope): Record<string, unknown> {
    return { user: scope.userId, tenantId: scope.tenantId === null ? { $exists: false } : scope.tenantId,
      conversationId: scope.conversationId, subagentThread: null,
      $or: [{ expiredAt: null }, { expiredAt: { $gt: new Date() } }] };
  }

  /** Called only by the authenticated host, never with a browser-provided receipt. */
  async write(scope: AgreementScope, receipt: ExecutionReceipt): Promise<{ receiptRef: string } | null> {
    try {
      scope = structuredClone(scope);
      receipt = structuredClone(receipt);
      if (!this.valid(scope)) return null;
      const agreement = await this.agreements.resolveConfirmed(scope, receipt.plan_version, receipt.plan_hash);
      if (!agreement || receipt.schema !== 'nostromo.execution.receipt.v1' ||
          receipt.objective_ref !== agreement.objective_ref || receipt.conversation_ref !== scope.conversationId ||
          receipt.agreement_ref !== agreement.agreement_ref || receipt.idempotency_key !== agreement.idempotency_key ||
          receipt.target_id !== agreement.target_id || receipt.principal_ref !== scope.userId ||
          receipt.tenant_ref !== scope.tenantId || !agreement.capability_refs.includes(receipt.capability_ref) ||
          receipt.risk !== agreement.risk) return null;
      const json = JSON.stringify(receipt);
      if (Buffer.byteLength(json, 'utf8') > 32_768) return null;
      // MongoDB may materialize undefined fields as null. Persist exactly the
      // JSON representation that is hashed so readback remains reproducible.
      receipt = JSON.parse(json) as ExecutionReceipt;
      const ref = 'nostromo-receipt:' + createHash('sha256').update(json).digest('hex');
      const filter = this.filter(scope);
      const doc = await this.collection.findOne(filter, { projection: { 'nostromoObjectiveAgreement.revision': 1,
        'nostromoObjectiveAgreement.receipts': 1 } });
      const state = doc?.nostromoObjectiveAgreement;
      if (!state || !Number.isSafeInteger(state.revision) || !Array.isArray(state.receipts ?? [])) return null;
      const existing = state.receipts?.find((item) => item.ref === ref);
      if (existing) return JSON.stringify(existing.receipt) === json ? { receiptRef: ref } : null;
      if ((state.receipts?.length ?? 0) >= 64) return null;
      // The versioned plan read above can be superseded at any await boundary.
      // This second read plus atomic revision comparison closes that race.
      if (!await this.agreements.verify(scope, agreement)) return null;
      const result = await this.collection.updateOne({ ...filter,
        'nostromoObjectiveAgreement.revision': state.revision,
        'nostromoObjectiveAgreement.receipts.63': { $exists: false },
        'nostromoObjectiveAgreement.receipts.ref': { $ne: ref },
      }, { $push: { 'nostromoObjectiveAgreement.receipts': { ref, receipt } } });
      if (result.matchedCount === 1) return { receiptRef: ref };
      // A concurrent identical writer may have won. Never treat another
      // receipt or a superseded agreement as confirmation of this write.
      if (!await this.agreements.verify(scope, agreement)) return null;
      const readback = await this.read(scope, ref);
      return readback && JSON.stringify(readback) === json ? { receiptRef: ref } : null;
    } catch { return null; }
  }

  async latest(scope: AgreementScope, version: number, planHash: string): Promise<{receiptRef:string; receipt:ExecutionReceipt} | null> {
    if (!this.valid(scope)) return null;
    try {
      const agreement=await this.agreements.resolveConfirmed(scope,version,planHash);
      if (!agreement) return null;
      const doc=await this.collection.findOne(this.filter(scope),{projection:{'nostromoObjectiveAgreement.receipts':1}});
      const records=doc?.nostromoObjectiveAgreement?.receipts;
      if (!Array.isArray(records)) return null;
      for (const record of [...records].reverse()) {
        if (record.receipt.agreement_ref!==agreement.agreement_ref || record.receipt.plan_hash!==planHash ||
            record.receipt.plan_version!==version || record.receipt.principal_ref!==scope.userId ||
            record.receipt.tenant_ref!==scope.tenantId) continue;
        const receipt=await this.read(scope,record.ref);
        if (receipt && await this.agreements.verify(scope,agreement)) return {receiptRef:record.ref,receipt};
        return null;
      }
      return null;
    } catch { return null; }
  }

  async read(scope: AgreementScope, ref: string): Promise<ExecutionReceipt | null> {
    if (!this.valid(scope) || typeof ref !== 'string' || !/^nostromo-receipt:[a-f0-9]{64}$/.test(ref)) return null;
    try {
      const doc = await this.collection.findOne(this.filter(scope), { projection: { 'nostromoObjectiveAgreement.receipts': 1 } });
      const record = doc?.nostromoObjectiveAgreement?.receipts?.find((item) => item.ref === ref);
      if (!record || 'nostromo-receipt:' + createHash('sha256').update(JSON.stringify(record.receipt)).digest('hex') !== ref) return null;
      return structuredClone(record.receipt);
    } catch { return null; }
  }
}

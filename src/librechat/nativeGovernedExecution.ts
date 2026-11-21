import {
  dispatchGovernedObjective,
  type GovernedExecutionInput,
  type GovernedExecutionResult,
  matchesArgumentCommitment,
  type GovernedObjectiveHost,
} from '../cockpit/governedMcpDispatch';

/**
 * Native host entry for an already agreed contract.
 * The host binds `transport` to the existing MCP connection; this module
 * never creates a second MCP, queue or task manager.
 */
export function executeNativeAgreedObjective(
  input: GovernedExecutionInput,
): Promise<GovernedExecutionResult> {
  return dispatchGovernedObjective(input);
}

import type { ToolProjection } from '../cockpit/targetToolGate';
import { NativeObjectiveAgreement, type AgreementScope } from './nativeObjectiveAgreement';

/** Readback from an authenticated HOST-owned record proving that the exact
 * argument hash was rendered intelligibly and explicitly confirmed by the user.
 * The model cannot implement this callback or provide its return value.
 */
export type NativeArgumentPresentationReadback = (
  scope: AgreementScope,
  handoff: import('../contracts/objectiveHandoff').ObjectiveHandoff,
  tool: ToolProjection & { capabilityRef: string },
  argsHash: string,
) => Promise<boolean>;

/** Bind the dispatcher argument gate to the CURRENT host-authenticated agreement.
 *
 * Schema conformance and a model-authored context ref are NOT user approval.
 * An independent host-owned presentation/confirmation record is mandatory.
 * Do not enable generalized execution until that record is implemented.
 */
export function createNativeAgreementArgumentBinding(input: {
  agreements: NativeObjectiveAgreement;
  scope: AgreementScope;
  presentationReadback?: NativeArgumentPresentationReadback;
}): NonNullable<GovernedObjectiveHost['verifyArgumentsBinding']> {
  const scope = structuredClone(input.scope);
  return async (candidate, rawTool, argsHash) => {
    if (!input.presentationReadback) return false;
    let handoff: typeof candidate;
    let tool: ToolProjection & { capabilityRef: string };
    try {
      handoff = structuredClone(candidate);
      tool = structuredClone(rawTool) as ToolProjection & { capabilityRef: string };
    } catch { return false; }
    if (!tool || typeof tool.capabilityRef !== 'string' ||
        handoff.capability_refs.length !== 1 ||
        handoff.capability_refs[0] !== tool.capabilityRef ||
        tool.targetId !== handoff.target_id || tool.risk !== handoff.risk ||
        !tool.registryBacked || !tool.aclAllowed || !tool.adapterLive ||
        tool.availability !== 'LIVE' || !tool.sourceRevision ||
        !matchesArgumentCommitment(handoff, argsHash)) return false;
    try {
      if (!await input.agreements.verify(scope, handoff)) return false;
      if (await input.presentationReadback(scope, handoff, tool, argsHash) !== true) return false;
      // A newer preview invalidates an earlier confirmation, including across
      // an awaited host presentation readback. Never cache its authority.
      return await input.agreements.verify(scope, handoff);
    } catch { return false; }
  };
}

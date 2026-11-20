import { executeNativeAgreedObjective } from './nativeGovernedExecution';
import type { AgreementScope } from './nativeObjectiveAgreement';
import { NativeObjectiveAgreement } from './nativeObjectiveAgreement';
import { NativeObjectiveReceiptStore } from './nativeObjectiveReceipts';
import type { McpToolCallResult } from '../cockpit/governedMcpDispatch';

interface NativeStatusPort {
  available(): Promise<boolean>;
  call(timeoutMs: number): Promise<McpToolCallResult>;
}

/** Fixed, read-only first product lane. Scope and port come from the authenticated host. */
export async function executeNativeStatus(input: {
  scope: AgreementScope; planVersion: number; planHash: string;
  agreements: NativeObjectiveAgreement; receipts: NativeObjectiveReceiptStore; port: NativeStatusPort;
}) {
  const scope=structuredClone(input.scope);
  const handoff=await input.agreements.resolveConfirmed(scope,input.planVersion,input.planHash);
  if (!handoff) return {status:'DENIED' as const,reason:'AGREEMENT_UNAVAILABLE'};
  if (handoff.execution_lane!=='NOSTROMO_LOCAL' || handoff.target_id!=='NOSTROMO_LOCAL' || handoff.risk!=='R0' ||
      handoff.objective!=='Consultar el estado del MCP NOSTROMO' ||
      handoff.expected_result!=='Comprobar si el MCP NOSTROMO responde' ||
      handoff.capability_refs.length!==1 || handoff.capability_refs[0]!=='nostromo_estado' ||
      handoff.acceptance_criteria.length!==1 || handoff.acceptance_criteria[0].predicate_ref!=='nostromo.mcp.live')
    return {status:'DENIED' as const,reason:'UNSUPPORTED_STATUS_PLAN'};
  const entry={targetId:'NOSTROMO_LOCAL',toolId:'nostromo_estado',capabilityRef:'nostromo_estado',risk:'R0' as const,
    availability:'LIVE' as const,registryBacked:true,aclAllowed:true,adapterLive:true,sourceRevision:'LIBRECHAT_LIVE_MCP_CATALOG'};
  return executeNativeAgreedObjective({handoff,args:{},owner:{principalRef:scope.userId,tenantRef:scope.tenantId},
    host:{
      verifyAgreement:(candidate)=>input.agreements.verify(scope,candidate),
      async readCapabilities(){return {observedAtMs:Date.now(),entries:await input.port.available()?[entry]:[]};},
      async checkOwnerAuthority(){return input.port.available();},
      async readToolSchema(){return {inputSchema:{type:'object',additionalProperties:false,properties:{}},safeRepeatReadback:true};},
      async verifyAcceptance(_handoff,_criterion,observation){
        if (!observation || typeof observation!=='object' || Array.isArray(observation)) return 'UNKNOWN';
        const state=observation as Record<string,unknown>;
        if(state.kind!=='nostromo.autonomous.local-mcp.v1' || typeof state.mcpLive!=='boolean')return 'UNKNOWN';
        return state.mcpLive ? 'PASS' : 'FAIL';
      },
      writeReceipt:(receipt)=>input.receipts.write(scope,receipt),
    },
    transport:{async callTool(call){
      if(call.name!=='nostromo_estado' || Object.keys(call.arguments).length!==0)
        return {status:'UNKNOWN_OUTCOME',reason:'UNSUPPORTED_TOOL'};
      return input.port.call(call.timeoutMs);
    }},
  });
}

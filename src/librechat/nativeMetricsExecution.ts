import { argumentCommitment, type McpToolCallResult } from '../cockpit/governedMcpDispatch';
import { executeNativeAgreedObjective, createNativeAgreementArgumentBinding } from './nativeGovernedExecution';
import type { AgreementScope } from './nativeObjectiveAgreement';
import { NativeObjectiveAgreement } from './nativeObjectiveAgreement';
import { NativeObjectiveReceiptStore } from './nativeObjectiveReceipts';
import { NativeObjectiveDispatchLedger } from './nativeObjectiveDispatchLedger';

export const METRICS_CWD='/home/elkakas314';
export const METRICS_OBJECTIVE='Consultar métricas de NOSTROMO en /home/elkakas314';
export const METRICS_EXPECTED='Obtener lectura R0 de carga, memoria y disco';
const METRICS_ARGS=Object.freeze({cwd:METRICS_CWD});
export const METRICS_ARGUMENT_REF=argumentCommitment(METRICS_ARGS);

interface NativeMetricsPort {
 available():Promise<boolean>;
 call(timeoutMs:number,cwd:string):Promise<McpToolCallResult>;
}

/** A second authenticated read-only lane. The server owns the exact tool and cwd;
 * the browser cannot submit free-form tool names, paths or authorization.
 */
export async function executeNativeMetrics(input:{
 scope:AgreementScope;planVersion:number;planHash:string;
 agreements:NativeObjectiveAgreement;receipts:NativeObjectiveReceiptStore;
 ledger:NativeObjectiveDispatchLedger;port:NativeMetricsPort;
}) {
 const scope=structuredClone(input.scope);
 const handoff=await input.agreements.resolveConfirmed(scope,input.planVersion,input.planHash);
 if(!handoff)return {status:'DENIED' as const,reason:'AGREEMENT_UNAVAILABLE'};
 if(handoff.execution_lane!=='NOSTROMO_LOCAL'||handoff.target_id!=='NOSTROMO_LOCAL'||
    handoff.risk!=='R0'||handoff.objective!==METRICS_OBJECTIVE||
    handoff.expected_result!==METRICS_EXPECTED||handoff.capability_refs.length!==1||
    handoff.capability_refs[0]!=='nostromo_metricas'||handoff.context_refs.length!==1||
    handoff.context_refs[0]!==METRICS_ARGUMENT_REF||
    handoff.acceptance_criteria.length!==1||
    handoff.acceptance_criteria[0]?.predicate_ref!=='nostromo.metrics.read')
   return {status:'DENIED' as const,reason:'UNSUPPORTED_METRICS_PLAN'};
 const entry={targetId:'NOSTROMO_LOCAL',toolId:'nostromo_metricas',capabilityRef:'nostromo_metricas',
   risk:'R0' as const,availability:'LIVE' as const,registryBacked:true,aclAllowed:true,
   adapterLive:true,sourceRevision:'LIBRECHAT_LIVE_MCP_CATALOG_METRICS'};
 const proof=createNativeAgreementArgumentBinding({agreements:input.agreements,scope,
   // The existing native /confirm route is the only way to obtain AGREED.
   // The exact cwd is rendered in the objective, and the confirmed plan holds
   // the host-computed parameter commitment. No model-supplied permission.
   presentationReadback:async(_scope,plan,_tool,hash)=>{
     const current=await input.agreements.current(scope);
     return !!current.ok&&current.phase==='AGREED' &&
       current.plan.plan_hash===plan.plan_hash &&
       current.plan.objective===METRICS_OBJECTIVE &&
       current.plan.context_refs.length===1 &&
       current.plan.context_refs[0]===`nostromo.args.sha256:${hash}`;
   }});
 return executeNativeAgreedObjective({
  handoff,args:METRICS_ARGS,owner:{principalRef:scope.userId,tenantRef:scope.tenantId},
  ledger:input.ledger,
  host:{
   verifyAgreement:plan=>input.agreements.verify(scope,plan),
   async readCapabilities(){return {observedAtMs:Date.now(),entries:await input.port.available()?[entry]:[]};},
   async checkOwnerAuthority(){return input.port.available();},
   async readToolSchema(){return {inputSchema:{type:'object',additionalProperties:false,
      properties:{cwd:{type:'string',minLength:1,maxLength:512}},required:['cwd']},safeRepeatReadback:true};},
   verifyArgumentsBinding:proof,
   async verifyAcceptance(_handoff,_criterion,observation){
    if(!observation||typeof observation!=='object'||Array.isArray(observation))return 'UNKNOWN';
    const v=observation as Record<string,unknown>;
    return v.status==='READ_OK'?'PASS':'FAIL';
   },
   writeReceipt:receipt=>input.receipts.write(scope,receipt),
  },
  transport:{async callTool(call){
   if(call.name!=='nostromo_metricas'||Object.keys(call.arguments).length!==1||
      call.arguments.cwd!==METRICS_CWD) return {status:'UNKNOWN_OUTCOME',reason:'UNSUPPORTED_METRICS_CALL'};
   return input.port.call(call.timeoutMs,METRICS_CWD);
  }},
 });
}

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

type Plan = { plan_version: number; plan_hash: string; objective: string; expected_result: string };
const objective='Consultar el estado del MCP NOSTROMO';
const expected='Comprobar si el MCP NOSTROMO responde';
const METRICS_CWD='/home/elkakas314';
const metricsObjective='Consultar métricas de NOSTROMO en /home/elkakas314';
const metricsExpected='Obtener lectura R0 de carga, memoria y disco';
async function metricsArgumentCommitment():Promise<string> {
  const bytes=new TextEncoder().encode(JSON.stringify({cwd:METRICS_CWD}));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return 'nostromo.args.sha256:'+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
}

/** Uses LibreChat's authenticated axios session. The host owns agreement bindings. */
export default function NostromoObjectiveStatus({conversationId}:{conversationId?:string|null}) {
  const [phase,setPhase]=useState<'IDLE'|'BUSY'|'PREVIEWED'|'AGREED'|'VERIFIED'|'UNKNOWN'|'BLOCKED'>('IDLE');
  const [mode,setMode]=useState<'status'|'metrics'>('status');
  const [plan,setPlan]=useState<Plan|null>(null);
  const [revision,setRevision]=useState(0);
  const [message,setMessage]=useState('');
  const [receipt,setReceipt]=useState('');
  const activeConversation=useRef(conversationId);
  activeConversation.current=conversationId;
  const valid=typeof conversationId==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(conversationId);
  const url=valid?`/api/nostromo/objectives/${conversationId}`:'';
  useEffect(()=>{setPhase('IDLE');setPlan(null);setRevision(0);setMessage('');setReceipt('');setMode('status');},[conversationId]);
  async function prepare(selected:'status'|'metrics') {
    setMode(selected);
    if(!url)return;
    setPhase('BUSY');setMessage('');
    try {
      const current=(await axios.get(url)).data;
      if(activeConversation.current!==conversationId)return;
      if(current.phase!=='NONE') {
        if(current.plan?.objective!==(selected==='metrics'?metricsObjective:objective) || current.plan?.expected_result!==(selected==='metrics'?metricsExpected:expected)) {
          setMessage('Existe otro acuerdo en esta conversación. No se ha sustituido.');setPhase('BLOCKED');return;
        }
        setPlan(current.plan);setRevision(current.revision);
        if(current.phase==='AGREED') {
          const result=(await axios.get(`${url}/execution`,{params:{plan_version:current.plan.plan_version,plan_hash:current.plan.plan_hash}})).data;
          if(activeConversation.current!==conversationId)return;
          if(result.status==='VERIFIED'){setReceipt(result.receiptRef);setPhase('VERIFIED');return;}
          setPhase('AGREED');return;
        }
        setPhase('PREVIEWED');return;
      }
      const proposal={schema:'nostromo.objective.handoff.v1',objective_ref:crypto.randomUUID(),conversation_ref:conversationId,
        agreement_ref:'UNCONFIRMED',plan_hash:'0'.repeat(64),plan_version:1,execution_lane:'NOSTROMO_LOCAL',target_id:'NOSTROMO_LOCAL',
        objective:selected==='metrics'?metricsObjective:objective,
        expected_result:selected==='metrics'?metricsExpected:expected,
        acceptance_criteria:selected==='metrics'?[{criterion_id:'metrics',predicate_ref:'nostromo.metrics.read'}]:
          [{criterion_id:'mcp-live',predicate_ref:'nostromo.mcp.live'}],
        capability_refs:[selected==='metrics'?'nostromo_metricas':'nostromo_estado'],
        context_refs:selected==='metrics'?[await metricsArgumentCommitment()]:[],constraints:{no_paid_fallback:true,max_execution_seconds:20},risk:'R0',
        idempotency_key:'0'.repeat(64),readback_required:true,status:'AGREED',authority:false};
      const result=(await axios.post(`${url}/preview`,{proposal,revision:current.revision})).data;
      if(activeConversation.current!==conversationId)return;
      setPlan(result.preview);setRevision(result.revision);setPhase('PREVIEWED');
    } catch {if(activeConversation.current===conversationId){setMessage('No se pudo recuperar o preparar el acuerdo.');setPhase('UNKNOWN');}}
  }
  async function execute() {
    if(!url||!plan)return;
    setPhase('BUSY');setMessage('');
    try {
      if(phase==='PREVIEWED')await axios.post(`${url}/confirm`,{plan_version:plan.plan_version,plan_hash:plan.plan_hash,revision});
      if(activeConversation.current!==conversationId)return;
      const result=(await axios.post(`${url}/execute-${mode==='metrics'?'metrics':'status'}`,{plan_version:plan.plan_version,plan_hash:plan.plan_hash})).data;
      if(activeConversation.current!==conversationId)return;
      if(result.status==='VERIFIED' && (mode==='metrics'?result.metricsRead===true:result.mcpLive===true) && typeof result.receiptRef==='string'){
        setReceipt(result.receiptRef);setPhase('VERIFIED');
      }else {setMessage('Resultado no verificado. Reabre la consulta para comprobar el estado guardado.');setPhase('UNKNOWN');}
    } catch {if(activeConversation.current===conversationId){setMessage('No se pudo confirmar el resultado. Comprueba el estado guardado antes de repetir.');setPhase('UNKNOWN');}}
  }
  return <section aria-label="Consulta gobernada del MCP">
    <h4>Consulta gobernada del MCP</h4>
    <p>Consulta de lectura, sin ejecutar un modelo. El resultado se guarda en esta conversación.</p>
    {!valid?<p>Abre una conversación guardada para continuar.</p>:null}
    {valid && ['IDLE','UNKNOWN','BLOCKED'].includes(phase)?<div>
      <button type="button" onClick={()=>prepare('status')}>Consultar estado MCP</button>
      <button type="button" onClick={()=>prepare('metrics')}>Consultar métricas R0</button>
    </div>:null}
    {plan && (phase==='PREVIEWED'||phase==='AGREED')?<div><p>{plan.objective}</p><p>Resultado esperado: {plan.expected_result}</p>
      {mode==='metrics'?<p>Parámetros confirmados: <code>cwd={METRICS_CWD}</code>. No se ejecutan comandos ni se modifica el sistema.</p>:null}
      <button type="button" onClick={execute}>{phase==='PREVIEWED'?'Confirmar y consultar':'Consultar MCP'}</button></div>:null}
    {phase==='BUSY'?<p role="status">Comprobando…</p>:null}
    {phase==='VERIFIED'?<p role="status">MCP respondió; resultado verificado y guardado. Receipt: <code>{receipt}</code></p>:null}
    {message?<p role="status">{message}</p>:null}
  </section>;
}

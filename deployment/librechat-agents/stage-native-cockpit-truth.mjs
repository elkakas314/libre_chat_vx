/** Narrow correction of stale claims in the installed E5 cockpit. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const BEFORE='e4457d6b4e2fbf51affb8942c988078177339356def9eab04a6b97b51835f889';
const sha=(x)=>createHash('sha256').update(x).digest('hex');
const replacements=[
 ["import './VXCockpit.css';", "import { useGetAgentByIdQuery } from '~/data-provider';\nimport './VXCockpit.css';"],
 ['  const activity = summarizeVxConversation(activityInput);', `  const activity = summarizeVxConversation(activityInput);
  const agentQuery = useGetAgentByIdQuery(activity.endpoint === 'agents' ? activity.agentId : null);
  const agent = !agentQuery.isError && !agentQuery.isFetching && !agentQuery.isStale &&
    agentQuery.data?.id === activity.agentId ? agentQuery.data : null;`],
 ["            <div><span>Generación</span>", "            <div><span>Modelo configurado del agente</span><strong>{agent?.model ?? 'UNKNOWN'}</strong></div>\n            <div><span>Generación</span>"],
 ["? 'Modo local independiente: agente y MCP propio de terminal.'", "? 'Esta vista no cambia el agente. Selecciónalo en el control nativo de LibreChat.'"],
 ['MCP INSTALADO · CHAT PENDIENTE','LLAMADAS EN MENSAJES CARGADOS'],
 ['El núcleo está listo. Falta el primer chat verificado.','Conversación y ejecución con evidencia'],
 ['NOSTROMO usa Qwen2.5 3B y el MCP local. Los canarios de modelo y herramientas pasaron; aún no consta una llamada desde una conversación de LibreChat.',
  'El modelo configurado se lee del agente seleccionado. Las llamadas mostradas corresponden solo a los mensajes cargados; consulta el resultado guardado para comprobar la consulta MCP.'],
 ['<p><strong>ChatGPT:</strong> pendiente de autorización OAuth; el agente funciona con Ollama local.</p>',
  '<p><strong>ChatGPT:</strong> NO CONFIGURADO o no verificado en esta vista.</p>'],
 ['<p><strong>Terminal:</strong> MCP local LIVE. R0 permite lecturas acotadas; las tareas R2 requieren aprobación local exacta y no se repiten automáticamente tras un resultado incierto.</p>',
  '<p><strong>MCP local:</strong> consulta su estado autenticado en la sección superior. Las tareas R2 requieren autorización local.</p>'],
 ['Esta cabina no inicia procesos ni concede permisos. La ejecución pertenece al agente y su MCP local autenticado.',
  'Esta cabina no concede permisos. El resultado de cada consulta se verifica en su receipt.'],
 ['<TentaculoHub snapshot={nostromoHubSourceSnapshot()} />',
  '<section aria-label="Tentáculo Hub"><h4>Tentáculo Hub</h4><p>MCP local: consulta el último resultado guardado arriba.</p><p>MANOJOS, VX13 y ORÁCULO: UNKNOWN en esta vista.</p></section>'],
];
export function renderTruthPatch(original){
 if(sha(original)!==BEFORE)throw Error('COCKPIT_PREIMAGE_HASH_MISMATCH');
 let next=original;
 for(const [before,after] of replacements){if(next.split(before).length!==2)throw Error('COCKPIT_ANCHOR_MISMATCH');next=next.replace(before,after);}
 return next;
}
export function stageTruth({upstream,stage}){
 if(existsSync(stage))throw Error('STAGE_ALREADY_EXISTS');
 const before=readFileSync(join(upstream,'client/src/components/VX/VXCockpitBridge.tsx'),'utf8'),after=renderTruthPatch(before);
 mkdirSync(stage,{recursive:true});writeFileSync(join(stage,'VXCockpitBridge.tsx'),after);
 const manifest={schema:'nostromo.e5.cockpit-truth-stage.v1',before:sha(before),after:sha(after)};
 writeFileSync(join(stage,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=',2)));
 if(!args.upstream||!args.stage)throw Error('NEED_EXPLICIT_UPSTREAM_STAGE');
 console.log(JSON.stringify(stageTruth(args),null,2));
}

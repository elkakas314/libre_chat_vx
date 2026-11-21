import { createHash } from 'node:crypto';

// The installed server has unique older directory-listing integration. Keep
// that preimage and add only the idempotency surface; do not replace it with
// the different SOURCE server wholesale.
export const INSTALLED_SERVER_SHA256='1a2521893fb8760207ff54eb4e01906e49532d21df24be7a360f0c9454b6d697';
const description="  description:'Inicia una tarea CLI a la vez. R0 permitido; R2 exige aprobación física hash-bound. Persiste estado local privado; tras reinicio un RUNNING pasa a UNKNOWN_OUTCOME sin reintento.',\n  inputSchema\n";
const updated="  description:'Inicia una tarea CLI a la vez. R0 permitido; R2 exige aprobación física hash-bound. Una clave de idempotencia opcional evita repetir una petición y exige persistencia privada. Tras reinicio un RUNNING pasa a UNKNOWN_OUTCOME sin reintento.',\n  inputSchema:{...inputSchema,idempotency_key:z.string().regex(/^[a-f0-9]{64}$/).optional()}\n";
const result="return result(state,state.status!=='RUNNING');";
const updatedResult="return result(state,state.status!=='RUNNING' && !(state.deduplicated && state.status==='EXIT_0'));";

export function patchInstalledServer(source){
 if(createHash('sha256').update(source).digest('hex')!==INSTALLED_SERVER_SHA256)
   throw Error('INSTALLED_MCP_SERVER_PREIMAGE_MISMATCH');
 if(source.split(description).length!==2||source.split(result).length!==2)
   throw Error('INSTALLED_MCP_SERVER_CONTEXT_MISMATCH');
 return source.replace(description,updated).replace(result,updatedResult);
}

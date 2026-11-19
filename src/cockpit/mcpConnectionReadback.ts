export interface McpConnectionReadback {
  receivedAtMs:number;
  servers:readonly {name:string;state:'connected'|'connecting'|'disconnected'|'error'}[];
}

/** Project only the authenticated native status response, never credentials or tool effects. */
export function projectMcpConnectionReadback(input:{
  data:unknown; fetching:boolean; error:boolean; receivedAtMs:number; nowMs:number;
}):McpConnectionReadback|null {
  if(input.fetching||input.error||!Number.isSafeInteger(input.receivedAtMs)||
    input.receivedAtMs<=0||!Number.isSafeInteger(input.nowMs)||input.receivedAtMs>input.nowMs||
    input.nowMs-input.receivedAtMs>300_000)return null;
  const data=input.data;
  if(!data||typeof data!=='object'||Array.isArray(data))return null;
  const response=data as Record<string,unknown>;
  if(response.success!==true||!response.connectionStatus||
    typeof response.connectionStatus!=='object'||Array.isArray(response.connectionStatus))return null;
  const servers:McpConnectionReadback['servers'][number][]=[];
  for(const [name,value] of Object.entries(response.connectionStatus)){
    if(!/^[A-Za-z0-9_.-]{1,100}$/.test(name)||!value||typeof value!=='object'||Array.isArray(value))return null;
    const state=(value as Record<string,unknown>).connectionState;
    if(state!=='connected'&&state!=='connecting'&&state!=='disconnected'&&state!=='error')return null;
    servers.push({name,state});
  }
  return {receivedAtMs:input.receivedAtMs,servers:servers.sort((a,b)=>a.name.localeCompare(b.name))};
}

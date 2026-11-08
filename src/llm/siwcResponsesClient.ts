import { CHATGPT_MODELS, CHATGPT_RESPONSES, siwcResponseBody,
  siwcVisibleModels, type SiwcMessage, type SiwcGrantReadback } from './chatgptAuthorized';
import { siwcAccountPermission, type SiwcAccountCredentials } from './siwcSession';

export interface SiwcTextReply {
  text:string;model:string;completed:true;
  provenance:'CHATGPT_OAUTH_PLAN';materialAuthority:false;
}
function permission(record:SiwcAccountCredentials,nowMs:number):SiwcGrantReadback {
  return {identity:record.identity,scopes:record.scopes,nowMs,
    tokenExpiresAtMs:record.tokenExpiresAtMs,
    pendingNonce:record.identity.expectedNonce,
    expectedClientId:record.clientId};
}
async function bodyLimited(response:Response,max:number):Promise<string> {
  const raw=await response.text();
  if(raw.length>max)throw Error('SIWC_RESPONSE_TOO_LARGE');
  return raw;
}
/** Server-only user-consented OAuth bearer; never use ChatGPT web cookies or API keys. */
export class SiwcResponsesClient {
  constructor(private readonly transport:typeof fetch=fetch,
    private readonly now:()=>number=()=>Date.now()) {}
  private assert(record:SiwcAccountCredentials):string {
    if(siwcAccountPermission(record,this.now())!=='AUTHORIZED'||!record.accessToken)
      throw Error('SIWC_USER_CONSENT_REQUIRED');
    return record.accessToken;
  }
  async listModels(record:SiwcAccountCredentials):Promise<readonly {slug:string;label:string}[]> {
    const bearer=this.assert(record);
    const reply=await this.transport(CHATGPT_MODELS,{
      method:'GET',headers:{Authorization:'Bearer '+bearer,Accept:'application/json'},
      redirect:'error',cache:'no-store'});
    if(!reply.ok)throw Error('SIWC_MODEL_HTTP_'+reply.status);
    let models:unknown;
    try{models=JSON.parse(await bodyLimited(reply,300_000));}
    catch{throw Error('SIWC_MODEL_RESPONSE_INVALID');}
    return siwcVisibleModels(models);
  }
  async textResponse(record:SiwcAccountCredentials,args:{
    model:string;catalog:readonly {slug:string;label:string}[];
    messages:readonly SiwcMessage[];
  }):Promise<SiwcTextReply>{
    const bearer=this.assert(record);
    const body=siwcResponseBody({model:args.model,liveCatalog:args.catalog,messages:args.messages,grant:permission(record,this.now())});
    const reply=await this.transport(CHATGPT_RESPONSES,{
      method:'POST',headers:{
        Authorization:'Bearer '+bearer,
        'Content-Type':'application/json','Accept':'text/event-stream',
      },body:JSON.stringify(body),redirect:'error',cache:'no-store'});
    if(!reply.ok)throw Error('SIWC_RESPONSES_HTTP_'+reply.status);
    if(!reply.body)throw Error('SIWC_STREAM_REQUIRED');
    const reader=reply.body.getReader();
    const decoder=new TextDecoder();
    let buffer='',message='',total=0,events=0,completed=false;
    const parse=(s:string)=>{
      if(s==='[DONE]'||s==='')return;
      let event:Record<string,unknown>;
      try{
        const parsed:unknown=JSON.parse(s);
        if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))
          throw Error('INVALID');
        event=parsed as Record<string,unknown>;
      }catch{throw Error('SIWC_STREAM_EVENT_INVALID');}
      events++;
      if(events>20000)throw Error('SIWC_STREAM_EVENT_LIMIT');
      if(event.type==='response.failed'||event.type==='response.incomplete')
        throw Error('SIWC_RESPONSE_NOT_COMPLETED');
      if(event.type==='response.output_text.delta'){
        if(typeof event.delta!=='string')throw Error('SIWC_STREAM_DELTA_INVALID');
        message+=event.delta;
        if(message.length>1_000_000)throw Error('SIWC_STREAM_OUTPUT_LIMIT');
      }
      if(event.type==='response.completed')completed=true;
    };
    let dataLines:string[]=[];
    const line=(raw:string)=>{
      const text=raw.endsWith('\r')?raw.slice(0,-1):raw;
      if(text===''){
        if(dataLines.length){parse(dataLines.join('\n'));dataLines=[];}
        return;
      }
      if(text.startsWith('data:'))dataLines.push(text.slice(5).trimStart());
    };
    try{
      while(true){
        const {done,value}=await reader.read();
        if(done)break;
        total+=value.byteLength;
        if(total>8_000_000)throw Error('SIWC_STREAM_SIZE_LIMIT');
        buffer+=decoder.decode(value,{stream:true});
        if(buffer.length>3_000_000)throw Error('SIWC_STREAM_BUFFER_LIMIT');
        let idx:number;
        while((idx=buffer.indexOf('\n'))!==-1){
          line(buffer.slice(0,idx));buffer=buffer.slice(idx+1);
        }
      }
      buffer+=decoder.decode();
      if(buffer)line(buffer);
      if(dataLines.length)parse(dataLines.join('\n'));
      if(!completed)throw Error('SIWC_STREAM_UNKNOWN_OUTCOME');
    } finally {await reader.cancel().catch(()=>{});}
    return {text:message,model:args.model,completed:true,
      provenance:'CHATGPT_OAUTH_PLAN',materialAuthority:false};
  }
}

import { createServer, type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { startSiwc, acceptSiwcCallback, type SiwcStart, type SiwcPending } from './chatgptAuthorized';

export interface SiwcCallbackResult {code:string;issuedClientId:string;}
export interface SiwcLoopbackAttempt {
  readonly pending:SiwcPending;
  readonly authorizationURL:string;
  readonly completed:Promise<SiwcCallbackResult>;
  readonly callbackURL:string;
  close():Promise<void>;
}
/**
 * Isolated, single-use *host-side* OAuth callback.
 * Start listening before exposing authorizationURL to the local system browser.
 * Never mount on 0.0.0.0 or send redirect/PKCE to the LibreChat web client.
 */
export async function openSiwcLoopback(input:Omit<SiwcStart,'callback'>&{
  timeoutMs?:number;
}):Promise<SiwcLoopbackAttempt> {
  const timeoutMs=input.timeoutMs??120_000;
  if(!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>300_000)
    throw new Error('SIWC_TIMEOUT_INVALID');
  let pending:SiwcPending|undefined;
  let resolveResult!:(value:SiwcCallbackResult)=>void;
  let rejectResult!:(reason:Error)=>void;
  let done=false;
  const completed=new Promise<SiwcCallbackResult>((resolve,reject)=>{
    resolveResult=resolve;rejectResult=reject;
  });
  const server:Server=createServer((req,res)=>{
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'");
    res.setHeader('Referrer-Policy','no-referrer');
    const host='127.0.0.1:'+((server.address() as AddressInfo|null)?.port??'');
    if(req.method!=='GET'||!pending||req.headers.host!==host||
       req.socket.localAddress!=='127.0.0.1'){
      res.writeHead(404);res.end('Not found');return;
    }
    try{
      const url='http://'+host+(req.url??'');
      const accepted=acceptSiwcCallback(pending,url);
      if(done){res.writeHead(410);res.end('Expired');return;}
      done=true;
      res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});
      res.end('ChatGPT sign-in returned. You may close this tab.');
      resolveResult(accepted);
      server.close();
    }catch{
      // Do not log OAuth authorization code, state or callbacks.
      res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});
      res.end('Authorization could not be completed.');
    }
  });
  try{
    await new Promise<void>((resolve,reject)=>{
      server.once('error',reject);
      server.listen(0,'127.0.0.1',()=>{
        server.off('error',reject);resolve();
      });
    });
  }catch(e){server.close();throw e;}
  const address=server.address() as AddressInfo|null;
  if(!address||address.address!=='127.0.0.1') {
    server.close();throw new Error('SIWC_LOOPBACK_BIND_FAILED');
  }
  const callbackURL='http://127.0.0.1:'+address.port+'/auth/callback';
  pending=startSiwc({...input,callback:callbackURL});
  const timer=setTimeout(()=>{
    if(done)return;
    done=true;
    rejectResult(new Error('SIWC_CALLBACK_TIMEOUT'));
    server.close();
  },timeoutMs);
  timer.unref();
  void completed.finally(()=>clearTimeout(timer)).catch(()=>{});
  const close=async()=>{
    if(!done){done=true;rejectResult(new Error('SIWC_CALLBACK_CANCELLED'));}
    clearTimeout(timer);
    if(server.listening)await new Promise<void>(resolve=>server.close(()=>resolve()));
  };
  return {pending,authorizationURL:pending.url,completed,callbackURL,close};
}

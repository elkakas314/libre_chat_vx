import React, { useCallback, useEffect, useState } from 'react';

type SiwcState = 'UNKNOWN' | 'DISCONNECTED' | 'CONSENT_PENDING' | 'CONNECTED' | 'REAUTH_REQUIRED';
type SiwcReply = {status?:unknown;error?:unknown;authorizationURL?:unknown;models?:unknown};

async function readReply(response:Response):Promise<SiwcReply>{
  let value:unknown;
  try{value=await response.json();}catch{throw Error('SIWC_RESPONSE_INVALID');}
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('SIWC_RESPONSE_INVALID');
  return value as SiwcReply;
}

/** Uses LibreChat's authenticated same-origin SIWC routes; OAuth credentials never enter the UI. */
export function SiwcConnectionControl(){
  const [state,setState]=useState<SiwcState>('UNKNOWN');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string>();

  const refresh=useCallback(async(signal?:AbortSignal)=>{
    setBusy(true);setError(undefined);
    try{
      const response=await fetch('/api/nostromo/siwc/state',{
        method:'GET',credentials:'same-origin',cache:'no-store',signal,
        headers:{Accept:'application/json'},
      });
      const result=await readReply(response);
      if(!response.ok)throw Error(typeof result.error==='string'?result.error:'SIWC_STATE_UNAVAILABLE');
      const next=result.status;
      if(next!=='DISCONNECTED'&&next!=='CONSENT_PENDING'&&next!=='CONNECTED'&&next!=='REAUTH_REQUIRED')
        throw Error('SIWC_STATE_INVALID');
      setState(next);
    }catch(cause){
      if(!(cause instanceof DOMException&&cause.name==='AbortError')){
        setState('UNKNOWN');setError(cause instanceof Error?cause.message:'SIWC_STATE_UNAVAILABLE');
      }
    }finally{setBusy(false);}
  },[]);

  useEffect(()=>{
    const controller=new AbortController();
    void refresh(controller.signal);
    return ()=>controller.abort();
  },[refresh]);

  const connect=async()=>{
    setBusy(true);setError(undefined);
    try{
      const response=await fetch('/api/nostromo/siwc/connect',{
        method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{Accept:'application/json','Content-Type':'application/json'},body:'{}',
      });
      const result=await readReply(response);
      if(!response.ok)throw Error(typeof result.error==='string'?result.error:'SIWC_CONNECT_FAILED');
      if(result.status==='CONNECTED'){setState('CONNECTED');return;}
      if(result.status!=='CONSENT_REQUIRED'||typeof result.authorizationURL!=='string')
        throw Error('SIWC_CONNECT_RESPONSE_INVALID');
      const authorizationURL=new URL(result.authorizationURL);
      if(authorizationURL.origin!=='https://auth.openai.com'||
        authorizationURL.pathname!=='/api/accounts/authorize')throw Error('SIWC_AUTHORIZATION_URL_REJECTED');
      window.location.assign(authorizationURL.toString());
    }catch(cause){
      setError(cause instanceof Error?cause.message:'SIWC_CONNECT_FAILED');
    }finally{setBusy(false);}
  };

  const disconnect=async()=>{
    setBusy(true);setError(undefined);
    try{
      const response=await fetch('/api/nostromo/siwc/disconnect',{
        method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{Accept:'application/json','Content-Type':'application/json'},body:'{}',
      });
      const result=await readReply(response);
      if(!response.ok)throw Error(typeof result.error==='string'?result.error:'SIWC_DISCONNECT_FAILED');
      if(result.status!=='DISCONNECTED')throw Error('SIWC_DISCONNECT_READBACK_FAILED');
      setState('DISCONNECTED');
    }catch(cause){
      setError(cause instanceof Error?cause.message:'SIWC_DISCONNECT_FAILED');
    }finally{setBusy(false);}
  };

  return <section aria-label="Conexión de ChatGPT para NOSTROMO" data-testid="siwc-connection-control">
    <h5>ChatGPT mediante Sign in with ChatGPT</h5>
    <p role="status">Estado: {state}</p>
    <p>El uso autorizado consume la cuota compartida y limitada de tu plan ChatGPT.</p>
    <p>Inicia el consentimiento desde el navegador del Lenovo que aloja LibreChat; la devolución OAuth es local a ese equipo.</p>
    <button type="button" onClick={()=>void connect()} disabled={busy}>
      {state==='CONNECTED'?'Conectado con ChatGPT':'Continuar con ChatGPT'}
    </button>
    <button type="button" onClick={()=>void refresh()} disabled={busy}>Actualizar estado</button>
    {state==='CONNECTED'||state==='REAUTH_REQUIRED'
      ?<>
        <p>Desconectar elimina las credenciales locales guardadas; la revocación de la autorización se gestiona en la cuenta de OpenAI.</p>
        <button type="button" onClick={()=>void disconnect()} disabled={busy}>Desconectar cuenta ChatGPT</button>
      </>
      :null}
    {error?<p role="alert">No se pudo conectar: {error}</p>:null}
  </section>;
}

import type {
  SiwcConnectionStart,
  SiwcPublicConnectionState,
} from './siwcConnectionService';

export interface SiwcAuthenticatedRequest {
  user?:{id?:unknown};
}
export interface SiwcHttpResponse {
  status(code:number):SiwcHttpResponse;
  json(body:unknown):unknown;
}
export type SiwcHttpHandler=(
  request:SiwcAuthenticatedRequest,
  response:SiwcHttpResponse,
  next:(error?:unknown)=>void,
)=>unknown;
export interface SiwcConnectionRouter {
  get(path:string,...handlers:SiwcHttpHandler[]):unknown;
  post(path:string,...handlers:SiwcHttpHandler[]):unknown;
}
export interface SiwcConnectionApiService {
  startForUser(userId:string):Promise<SiwcConnectionStart>;
  publicStateForUser(userId:string):Promise<SiwcPublicConnectionState>;
  cancelForUser(userId:string):Promise<void>;
}

function authenticatedUserId(request:SiwcAuthenticatedRequest):string|null {
  try {
    const id=request.user?.id;
    const value=typeof id==='string'?id:
      id&&typeof (id as {toString?:unknown}).toString==='function'?
        (id as {toString:()=>string}).toString():'';
    return value.length>0&&value.length<=256?value:null;
  } catch { return null; }
}

function publicError(error:unknown):string {
  if(!(error instanceof Error))return 'SIWC_OPERATION_FAILED';
  const allowed=new Set([
    'SIWC_AUTHENTICATED_USER_REQUIRED',
    'SIWC_CONNECTION_ALREADY_PENDING',
    'SIWC_CONNECTION_CAPACITY_REACHED',
    'SIWC_HOST_CONFIGURATION_REQUIRED',
    'SIWC_USER_VAULT_LOOKUP_REQUIRED',
    'SIWC_AUTHORIZATION_URL_REJECTED',
  ]);
  return allowed.has(error.message)?error.message:'SIWC_OPERATION_FAILED';
}

function officialAuthorizationURL(value:string):string {
  try {
    const url=new URL(value);
    if(url.origin!=='https://auth.openai.com'||url.pathname!=='/api/accounts/authorize'||
      url.hash||url.username||url.password)throw Error();
    return url.toString();
  } catch { throw Error('SIWC_AUTHORIZATION_URL_REJECTED'); }
}

/** Mounts session-authenticated routes; account IDs always come from LibreChat auth, never request data. */
export function mountSiwcConnectionApi(input:{
  router:SiwcConnectionRouter;
  service:SiwcConnectionApiService;
  requireAuthenticatedUser:SiwcHttpHandler;
  verifyCsrf:SiwcHttpHandler;
}):void {
  if(typeof input.requireAuthenticatedUser!=='function'||typeof input.verifyCsrf!=='function')
    throw Error('SIWC_AUTH_AND_CSRF_MIDDLEWARE_REQUIRED');

  input.router.get('/state',input.requireAuthenticatedUser,async(request,response)=>{
    const userId=authenticatedUserId(request);
    if(!userId)return response.status(401).json({error:'SIWC_AUTHENTICATED_USER_REQUIRED'});
    try{return response.status(200).json(await input.service.publicStateForUser(userId));}
    catch(error){return response.status(503).json({error:publicError(error)});}
  });

  input.router.post('/connect',input.requireAuthenticatedUser,input.verifyCsrf,
    async(request,response)=>{
      const userId=authenticatedUserId(request);
      if(!userId)return response.status(401).json({error:'SIWC_AUTHENTICATED_USER_REQUIRED'});
      try {
        const result=await input.service.startForUser(userId);
        if(result.status==='CONNECTED')return response.status(200).json({
          status:'CONNECTED',state:result.value.state,models:result.value.models,
        });
        return response.status(202).json({
          status:'CONSENT_REQUIRED',authorizationURL:officialAuthorizationURL(result.authorizationURL),
        });
      } catch(error) {
        const code=publicError(error);
        const status=code==='SIWC_CONNECTION_ALREADY_PENDING'?409:
          code==='SIWC_AUTHENTICATED_USER_REQUIRED'?401:503;
        return response.status(status).json({error:code});
      }
    });

  input.router.post('/cancel',input.requireAuthenticatedUser,input.verifyCsrf,
    async(request,response)=>{
      const userId=authenticatedUserId(request);
      if(!userId)return response.status(401).json({error:'SIWC_AUTHENTICATED_USER_REQUIRED'});
      try {
        await input.service.cancelForUser(userId);
        return response.status(200).json(await input.service.publicStateForUser(userId));
      } catch(error) {
        return response.status(503).json({error:publicError(error)});
      }
    });
}

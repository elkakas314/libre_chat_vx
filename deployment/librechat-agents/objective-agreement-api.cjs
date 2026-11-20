'use strict';

/** Native host HTTP adapter: no model, target grant, or tool dispatch. */
function createObjectiveAgreementRouter({express,requireJwtAuth,serviceFor}) {
  if (!express?.Router || typeof requireJwtAuth!=='function' || typeof serviceFor!=='function')
    throw Error('OBJECTIVE_HOST_DEPENDENCIES_REQUIRED');
  const router=express.Router();
  const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  const shape=(value,keys)=>value!==null && typeof value==='object' && !Array.isArray(value) &&
    Object.keys(value).length===keys.length && keys.every((key)=>Object.hasOwn(value,key));
  const sameOrigin=(req,res,next)=>{
    try {
      const origin=req.get('origin');
      if (!origin || new URL(origin).origin!==`${req.protocol}://${req.get('host')}`)
        return res.status(403).json({error:'ORIGIN_REJECTED'});
      return next();
    } catch { return res.status(403).json({error:'ORIGIN_REJECTED'}); }
  };
  const scopeFor=(req)=>{
    const userId=(req.user?.id ?? req.user?._id)?.toString?.();
    const tenant=req.user?.tenantId;
    if (!userId || !uuid.test(req.params.conversationId) || (tenant!=null && (typeof tenant!=='string'||!tenant))) return null;
    return {userId,tenantId:tenant??null,conversationId:req.params.conversationId};
  };
  const sendFailure=(res,result)=>res.status(result.reason==='CONVERSATION_UNAVAILABLE'?404:
    result.reason==='INVALID_PROPOSAL'||result.reason==='INVALID_CONFIRMATION'||result.reason==='INVALID_SCOPE'?400:409)
    .json({error:result.reason,authority:false});
  router.use(requireJwtAuth);
  router.get('/:conversationId',async(req,res)=>{
    const scope=scopeFor(req);if(!scope)return res.status(400).json({error:'INVALID_SCOPE'});
    try {
      const service=serviceFor(req);if(!service)return res.status(503).json({error:'AGREEMENT_SERVICE_UNAVAILABLE'});
      const result=await service.current(scope);return result.ok?res.json(result):sendFailure(res,result);
    }catch{return res.status(503).json({error:'AGREEMENT_READ_FAILED'});}
  });
  router.post('/:conversationId/preview',sameOrigin,async(req,res)=>{
    const scope=scopeFor(req);if(!scope||!shape(req.body,['proposal','revision']))return res.status(400).json({error:'INVALID_REQUEST'});
    try {
      const service=serviceFor(req);if(!service)return res.status(503).json({error:'AGREEMENT_SERVICE_UNAVAILABLE'});
      const result=await service.preview(scope,req.body.proposal,req.body.revision);
      return result.ok?res.json(result):sendFailure(res,result);
    }catch{return res.status(503).json({error:'AGREEMENT_PREVIEW_FAILED'});}
  });
  router.post('/:conversationId/confirm',sameOrigin,async(req,res)=>{
    const scope=scopeFor(req);if(!scope||!shape(req.body,['plan_version','plan_hash','revision']))return res.status(400).json({error:'INVALID_REQUEST'});
    try {
      const service=serviceFor(req);if(!service)return res.status(503).json({error:'AGREEMENT_SERVICE_UNAVAILABLE'});
      const result=await service.confirm(scope,req.body.plan_version,req.body.plan_hash,req.body.revision);
      if(!result.ok)return sendFailure(res,result);
      // Never return host-only agreement or idempotency bindings to the browser.
      const readback=await service.current(scope);
      if(!readback.ok||readback.phase!=='AGREED'||readback.plan.plan_hash!==req.body.plan_hash)
        return res.status(409).json({error:'AGREEMENT_SUPERSEDED',authority:false});
      return res.json(readback);
    }catch{return res.status(503).json({error:'AGREEMENT_CONFIRM_FAILED'});}
  });
  return router;
}
module.exports={createObjectiveAgreementRouter};

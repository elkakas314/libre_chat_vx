#!/usr/bin/env node
/** Read-only mobile/PWA preflight; no secrets are opened or printed. */
import {lstatSync,readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import path from 'node:path';
const param=process.argv.find(x=>x.startsWith('--upstream='));
const up=path.resolve(param?param.slice('--upstream='.length):path.join(homedir(),'librechat','upstream'));
if(process.argv.includes('--help')){
 console.log('node scripts/audit-nostromo-mobile-readiness.mjs [--upstream=/path] (R0)');
}else if(process.argv.some(x=>x.startsWith('--')&&!x.startsWith('--upstream='))){
 console.log(JSON.stringify({status:'UNKNOWN_FLAG_REFUSED',readOnly:true}));process.exitCode=2;
}else{
 const dist=path.join(up,'client','dist');
 // lstat EVERY parent, not just the manifest file. Never read through a
 // statically symlinked checkout/client/dist into an unintended external tree.
 const realDirectory=dir=>{
  const parsed=path.parse(dir),parts=path.relative(parsed.root,dir).split(path.sep).filter(Boolean);
  let current=parsed.root;
  try{
   for(const part of parts){
    current=path.join(current,part);
    const st=lstatSync(current);
    if(st.isSymbolicLink()||!st.isDirectory())return false;
   }
   return true;
  }catch{return false;}
 };
 const distScopeSafe=realDirectory(dist);
 const file=rel=>{if(!distScopeSafe)return false;
  try{const x=lstatSync(path.join(dist,rel));return x.isFile()&&!x.isSymbolicLink();}
   catch{return false;}};
 const indexHtml=file('index.html'),manifest=file('manifest.webmanifest');
 const worker=file('sw.js'),healingWorker=file('sw-heal.js');
 let summary=null;
 if(manifest){
  try{
   const obj=JSON.parse(readFileSync(path.join(dist,'manifest.webmanifest'),'utf8'));
   summary={namePresent:typeof obj.name==='string'&&obj.name.length>0,
    display:typeof obj.display==='string'?obj.display:null,
    iconCount:Array.isArray(obj.icons)?obj.icons.length:0};
  }catch{summary={invalid:true};}
 }
 const built=!!(indexHtml&&manifest&&worker&&summary?.namePresent&&
   summary?.iconCount>0&&!summary?.invalid);
 const sibling=path.join(homedir(),'upstream');
 const thirdEnv=(()=>{
  try{if(!realDirectory(sibling))return false;
   const x=lstatSync(path.join(sibling,'.env'));return x.isFile()&&!x.isSymbolicLink();}
  catch{return false;}
 })();
 console.log(JSON.stringify({schema:'nostromo.mobile.preflight.r0.v1',readOnly:true,
  mutations:0,upstream:up,thirdCheckout:sibling,thirdCheckoutHasEnv:thirdEnv,
  pwa:{pathScopeSafe:distScopeSafe,indexHtml,manifest,serviceWorker:worker,healingWorker,
    manifestSummary:summary,compiled:built},
  status:built?'PWA_BUILD_PRESENT_NOT_INSTALLED':'PWA_BUILD_INCOMPLETE',
  backendLiveVerified:false,mobileAuthenticated:false,mobileE2EVerified:false,
  tailscaleServeVerified:false,next:'VERIFY_BACKEND_AUTH_AND_PRIVATE_HTTPS_BEFORE_MOBILE_INSTALL'},null,2));
}

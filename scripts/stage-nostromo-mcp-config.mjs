#!/usr/bin/env node
/** Guarded FIRST-TIME CONFIG STAGING for NOSTROMO.
 * PREVIEW default. --apply only creates missing librechat.yaml, with MCP OFF.
 * No overwrite/merge of private configuration, no secrets read, no npm,
 * no agent registration, no restart, no authorization grant.
 */
import {existsSync,lstatSync,realpathSync,readFileSync,openSync,writeSync,fsyncSync,closeSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {renderInitialNostromoYaml} from './nostromo-initial-yaml.mjs';

const vx=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const canonicalVx=path.join(os.homedir(),'librechat','vx');
const up=path.join(os.homedir(),'librechat','upstream');
const apply=process.argv.includes('--apply');
const expected='f10b1d91f1eee3a2c82d5247bf620351486b7c1b';
const dest=path.join(up,'librechat.yaml');
const status=(code,extra={},exitCode=0)=>{
  console.log(JSON.stringify({schema:'nostromo.initial-mcp-yaml.v1',
    mode:apply?'APPLY':'PREVIEW',status:code,
    destination:dest,mutated:code==='DISABLED_CONFIG_CREATED',
    mcpEnabled:false,agentRegistered:false,backendStarted:false,
    ...extra},null,2));
  process.exitCode=exitCode;
};
if(process.argv.includes('--help')){
  console.log('node scripts/stage-nostromo-mcp-config.mjs [--apply] (preview default)');
  process.exit(0);
}
if(process.argv.some(x=>x.startsWith('--')&&!['--apply'].includes(x))){
  status('UNKNOWN_FLAG_REFUSED',{},2);
}else if(apply&&vx!==canonicalVx){
  status('APPLY_ONLY_FROM_CANONICAL_VX_CHECKOUT',{},2);
}else if(!existsSync(up)||lstatSync(up).isSymbolicLink()||realpathSync(up)!==up){
  status('UPSTREAM_PATH_UNSAFE',{},2);
}else if(existsSync(dest)){
  // Existing private config must be merged by an operator with an actual
  // YAML parser, backup and real readback. Never touch or reveal its content.
  status('EXISTING_YAML_NO_AUTOMATED_MERGE',{existingFile:true},0);
}else{
  let gitHead;
  try{
    gitHead=execFileSync('git',['-c','core.fsmonitor=false',
      '-c','core.hooksPath=/dev/null','-C',up,'rev-parse','HEAD'],{
      encoding:'utf8',timeout:8000,stdio:['ignore','pipe','ignore'],
      env:{PATH:'/usr/bin:/bin',GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0',
        GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}
    }).trim();
  }catch{gitHead=null;}
  if(gitHead!==expected){
    status('UPSTREAM_HEAD_MISMATCH',{observedHead:gitHead},2);
  }else{
    try{
      const example=path.join(up,'librechat.example.yaml');
      const fragment=path.join(vx,'deployment/nostromo-mcp/librechat-mcp.fragment.yaml');
      const server=path.join(vx,'deployment/nostromo-mcp/server.mjs');
      for(const p of [example,fragment,server]){
        if(!existsSync(p)||lstatSync(p).isSymbolicLink()||!statSync(p).isFile())
          throw Error('EXPECTED_SOURCE_MISSING_OR_SYMLINK');
      }
      const yaml=renderInitialNostromoYaml({
        example:readFileSync(example,'utf8'),
        fragment:readFileSync(fragment,'utf8')
      });
      const sha256=createHash('sha256').update(yaml).digest('hex');
      if(!apply){
        status('DISABLED_CONFIG_READY_TO_STAGE',{
          yamlSha256:sha256,existingFile:false,
          next:'APPLY_ONLY_AFTER_YAML_POLICY_REVIEW_NO_AGENT_OR_SERVICE_RESTART'
        });
      }else{
        // 'wx' refuses concurrent creation. 0600 means no other local user
        // can read it; source contains no credentials.
        const fd=openSync(dest,'wx',0o600);
        try{writeSync(fd,yaml);fsyncSync(fd);}
        finally{closeSync(fd);}
        const observed=createHash('sha256').update(readFileSync(dest)).digest('hex');
        const st=lstatSync(dest);
        if(observed!==sha256||!st.isFile()||st.isSymbolicLink()||
          (st.mode&0o077)!==0)throw Error('POST_WRITE_READBACK_MISMATCH');
        status('DISABLED_CONFIG_CREATED',{yamlSha256:sha256,
          existingFile:false,
          next:'VALIDATE_YAML_THEN_BACKEND_SETUP_AND_REGISTER_NATIVE_AGENT'});
      }
    }catch(e){
      const reason=String(e?.code||e?.message||'UNKNOWN');
      // Do not delete a partial file: it might have been concurrently
      // written; preserve for manual forensic recovery.
      status('CONFIG_STAGING_BLOCKED',{reason},2);
    }
  }
}

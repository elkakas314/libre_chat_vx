/** Local TypeScript build fallback for an existing npm workspace.
 * Never installs packages or mutates upstream's node_modules/lockfiles.
 * Only creates temporary stage-local symlinks and removes them after tsc.
 */
import {existsSync,mkdirSync,realpathSync,rmSync,symlinkSync} from 'node:fs';
import path from 'node:path';

const TYPES=['react','react-dom'];
function declarations(p){return existsSync(path.join(p,'index.d.ts'));}
export function linkHostTypeDeclarations({stage,upstream,vx}){
  const statuses={};
  for(const name of TYPES){
    const up=path.join(upstream,'node_modules','@types',name);
    const local=path.join(vx,'node_modules','@types',name);
    if(declarations(up)){
      statuses[name]='UPSTREAM_INSTALLED';
    }else if(declarations(local)){
      const tempTypes=path.join(stage,'node_modules','@types');
      mkdirSync(tempTypes,{recursive:true,mode:0o700});
      symlinkSync(realpathSync(local),path.join(tempTypes,name),'dir');
      statuses[name]='VX_FALLBACK_LINKED';
    }else{
      statuses[name]='MISSING';
    }
  }
  if(statuses.react==='MISSING'){
    throw Error('REACT_TYPINGS_MISSING: install VX devDependencies without changing upstream; npm install --ignore-scripts --package-lock=false --no-audit --no-fund --include=dev');
  }
  return statuses;
}
/** Fresh stage only. Symlink removal does not traverse source node_modules. */
export function clearStagedTypeLinks(stage){
  const stageModules=path.join(stage,'node_modules');
  if(existsSync(stageModules))rmSync(stageModules,{recursive:true,force:true});
}

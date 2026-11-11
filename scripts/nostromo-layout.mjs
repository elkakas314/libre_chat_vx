/** Canonical local NOSTROMO data layout; existing Git checkouts are not moved. */
import path from 'node:path';
import {homedir} from 'node:os';
import {lstatSync,mkdirSync,mkdtempSync,chmodSync} from 'node:fs';
const LEAVES=Object.freeze(['worktrees','tools','backups','runtime','reports','handoffs','manifests','staging','cache','tmp','legacy']);
export const LEGACY_BACKUP_NAMES=Object.freeze([
 'nostromo-frontend-deps-backup.fDbtdf','nostromo-backup.ceBhjB8V',
 'nostromo-ui-backup.s5cE3siD','nostromo-workspace-backup.2jGTrK'
]);
export function nostromoLayout(home=homedir()){
 if(typeof home!=='string'||!path.isAbsolute(home))throw Error('NOSTROMO_HOME_INVALID');
 const base=path.join(home,'librechat'),root=path.join(base,'nostromo');
 return Object.freeze({base,root,worktrees:path.join(root,'worktrees'),
  tools:path.join(root,'tools'),backups:path.join(root,'backups'),
  runtime:path.join(root,'runtime'),reports:path.join(root,'reports'),
  handoffs:path.join(root,'handoffs'),manifests:path.join(root,'manifests'),
  staging:path.join(root,'staging'),cache:path.join(root,'cache'),
  tmp:path.join(root,'tmp'),legacy:path.join(root,'legacy'),
  legacyTool:path.join(home,'.local','share','nostromo','tools','npm-11.13.0'),
  pinnedTool:path.join(root,'tools','npm-11.13.0')});
}
function safeDir(p,privateMode=false){
 const st=lstatSync(p);
 if(!st.isDirectory()||st.isSymbolicLink()||
  (typeof process.getuid==='function'&&st.uid!==process.getuid())||
  (privateMode&&(st.mode&0o077)!==0))throw Error('NOSTROMO_UNSAFE_DIRECTORY');
}
export function ensureNostromoDir(name,{home=homedir()}={}){
 if(!LEAVES.includes(name))throw Error('NOSTROMO_INVALID_LEAF');
 const d=nostromoLayout(home);safeDir(d.base);
 for(const p of [d.root,d[name]]){
   try{mkdirSync(p,{mode:0o700});}catch(e){if(e?.code!=='EEXIST')throw e;}
   safeDir(p,true);
 }
 return d[name];
}
export function createNostromoBackupDir(kind,{home=homedir()}={}){
 if(!['frontend-deps','visual','workspace'].includes(kind))
   throw Error('NOSTROMO_BACKUP_KIND_INVALID');
 const dir=ensureNostromoDir('backups',{home});
 const p=mkdtempSync(path.join(dir,'nostromo-'+kind+'-'));
 chmodSync(p,0o700);safeDir(p,true);
 return p;
}

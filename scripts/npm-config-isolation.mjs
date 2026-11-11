/** npm must never load /dev/null twice as user and global config.
 * Isolate global npm config to a new private empty file (0600) while
 * ignoring user npmrc. Caller owns the new directory and its cleanup.
 */
import {lstatSync,writeFileSync} from 'node:fs';
import path from 'node:path';

export const ISOLATED_NPM_CONFIG_FILE='.nostromo-empty-global.npmrc';

export function createNpmConfigIsolation(privateDir){
  if(typeof privateDir!=='string'||!path.isAbsolute(privateDir))
    throw Error('NPM_CONFIG_PRIVATE_DIR_INVALID');
  const st=lstatSync(privateDir);
  if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077)!==0||
     (typeof process.getuid==='function'&&st.uid!==process.getuid()))
    throw Error('NPM_CONFIG_PRIVATE_DIR_UNSAFE');
  const configPath=path.join(privateDir,ISOLATED_NPM_CONFIG_FILE);
  // wx refuses pre-existing files, symlinks and untrusted config injection.
  writeFileSync(configPath,'',{flag:'wx',mode:0o600});
  return Object.freeze({
    npm_config_userconfig:'/dev/null',
    npm_config_globalconfig:configPath
  });
}

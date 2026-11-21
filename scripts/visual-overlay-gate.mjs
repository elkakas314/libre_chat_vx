/** Narrow admission for two native Bridge/CSS files. Preserve unique local work. */
export function visualUpdateDisposition({installed,baseline,desired}){
 if(!Buffer.isBuffer(installed)||!Buffer.isBuffer(baseline)||!Buffer.isBuffer(desired))
  throw Error('VISUAL_BYTES_REQUIRED');
 if(installed.equals(desired))return 'ALREADY_MATCHED';
 if(installed.equals(baseline))return 'READY_TO_SYNC';
 return 'UNIQUE_LOCAL_VISUAL_CHANGES_PRESERVE';
}

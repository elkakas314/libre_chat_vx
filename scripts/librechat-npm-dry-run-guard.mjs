/** Pure fail-closed assessment of npm --dry-run --json.
 * npm may prune/replace packages during npm install; a dry run is evidence
 * about a plan, NOT a guarantee that real mutation will be identical.
 */
export function assessNpmDryRun(stdout) {
  let data;
  try {data=JSON.parse(stdout);}
  catch {return {status:'DRY_RUN_UNREADABLE',allow:false};}
  if(!data||typeof data!=='object'||Array.isArray(data))
    return {status:'DRY_RUN_INVALID',allow:false};
  const fields=['added','removed','changed'];
  if(!fields.every(k=>Number.isSafeInteger(data[k])&&data[k]>=0))
    return {status:'DRY_RUN_COUNTS_MISSING',allow:false};
  const counts=Object.fromEntries(fields.map(k=>[k,data[k]]));
  if(counts.removed!==0||counts.changed!==0)
    return {status:'DRY_RUN_EXISTING_PACKAGES_AT_RISK',allow:false,...counts};
  return {status:'DRY_RUN_ADDITIONS_ONLY',allow:true,...counts};
}

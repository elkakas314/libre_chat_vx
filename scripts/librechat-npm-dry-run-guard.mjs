/** Fail-closed assessment of npm --dry-run --json.
 * npm 11 can emit `add NAME VERSION` action lines before the JSON summary.
 * Accept them only if each line exactly matches one reported add object.
 * A plan does not guarantee an identical real install and is never an install PASS.
 */
export function assessNpmDryRun(stdout) {
  let data;
  let actionLines = null;
  try { data = JSON.parse(stdout); }
  catch {
    if (typeof stdout !== 'string' || stdout.length > 8 * 1024 * 1024)
      return {status:'DRY_RUN_UNREADABLE',allow:false};
    const boundary = stdout.indexOf('\n{');
    if (boundary < 1) return {status:'DRY_RUN_UNREADABLE',allow:false};
    const prelude = stdout.slice(0,boundary).split('\n');
    if (prelude.length > 50000)
      return {status:'DRY_RUN_UNREADABLE',allow:false};
    const actions = prelude.map(line => /^add ([^\s]+) ([^\s]+)$/.exec(line.replace(/\r$/, '')));
    if (actions.some(x=>!x))
      return {status:'DRY_RUN_UNKNOWN_PREFIX',allow:false};
    try { data = JSON.parse(stdout.slice(boundary+1)); }
    catch { return {status:'DRY_RUN_UNREADABLE',allow:false}; }
    actionLines = actions.map(x=>[x[1],x[2]]);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data))
    return {status:'DRY_RUN_INVALID',allow:false};
  const fields=['added','removed','changed'];
  if (!fields.every(k=>Number.isSafeInteger(data[k])&&data[k]>=0))
    return {status:'DRY_RUN_COUNTS_MISSING',allow:false};
  const counts=Object.fromEntries(fields.map(k=>[k,data[k]]));
  if (counts.removed!==0||counts.changed!==0)
    return {status:'DRY_RUN_EXISTING_PACKAGES_AT_RISK',allow:false,...counts};
  for (const [arrayField,countField] of [['add','added'],['remove','removed'],['change','changed']]) {
    if (data[arrayField]!==undefined &&
        (!Array.isArray(data[arrayField])||data[arrayField].length!==counts[countField]))
      return {status:'DRY_RUN_ACTION_COUNTS_MISMATCH',allow:false,...counts};
  }
  if (actionLines !== null) {
    if (!Array.isArray(data.add)||!Array.isArray(data.change)||!Array.isArray(data.remove))
      return {status:'DRY_RUN_ACTIONS_MISSING',allow:false,...counts};
    const fromJSON=[];
    for (const item of data.add) {
      if (!item||typeof item!=='object'||typeof item.name!=='string'||
          typeof item.version!=='string'||!item.name||!item.version)
        return {status:'DRY_RUN_ACTIONS_INVALID',allow:false,...counts};
      fromJSON.push(JSON.stringify([item.name,item.version]));
    }
    const fromLines=actionLines.map(a=>JSON.stringify(a));
    if (fromLines.length!==counts.added||
        JSON.stringify(fromLines.sort())!==JSON.stringify(fromJSON.sort()))
      return {status:'DRY_RUN_ACTIONS_MISMATCH',allow:false,...counts};
  }
  return {status:'DRY_RUN_ADDITIONS_ONLY',allow:true,...counts,
    ...(actionLines===null?{}:{prefixedActionLinesVerified:actionLines.length})};
}

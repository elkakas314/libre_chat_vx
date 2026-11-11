/** Prevent another workspace backup for an exact, already installed package.
 * This is only a narrow no-op admission; it is not a backup deletion policy.
 */
export function isWorkspaceNoop(scan){
  if(!scan||scan.schema!=='nostromo.existing-workspace.v1')return false;
  return scan.ui==='MATCHED'&&
    Number.isSafeInteger(scan.sourceFiles)&&
    Number.isSafeInteger(scan.existingFiles)&&
    scan.sourceFiles===scan.existingFiles&&scan.changedSources===0;
}

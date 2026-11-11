/** Fail-closed npm environment gate for the *pinned* LibreChat frontend.
 * Compare actual npm to the root packageManager contract and lock format.
 * No network, no filesystem access, no mutation.
 */
export function assessNpmEnvironment({declaredPackageManager,actualNpmVersion,lockfileVersion}){
  const expected=/^npm@(\d+)\.(\d+)\.(\d+)$/.exec(String(declaredPackageManager??''));
  const actual=/^(\d+)\.(\d+)\.(\d+)(?:[-+][0-9A-Za-z.-]+)?$/.exec(String(actualNpmVersion??''));
  const blockers=[];
  if(!expected)blockers.push('PACKAGE_MANAGER_DECLARATION_UNSUPPORTED');
  if(!actual)blockers.push('NPM_VERSION_UNREADABLE');
  if(expected&&actual&&Number(expected[1])!==Number(actual[1]))
    blockers.push('NPM_MAJOR_MISMATCH');
  if(lockfileVersion!==3)blockers.push('LOCKFILE_VERSION_NOT_V3');
  return {
    status:blockers.length?'NPM_ENVIRONMENT_BLOCKED':'NPM_ENVIRONMENT_ADMISSIBLE',
    applyAdmissible:blockers.length===0,
    declaredPackageManager:declaredPackageManager??null,
    actualNpmVersion:actualNpmVersion??null,
    lockfileVersion:lockfileVersion??null,
    blockers
  };
}

/** Render only an initially disabled NOSTROMO MCP file for pinned LibreChat.
 * Existing LibreChat yaml files are NEVER merged or overwritten by this helper.
 */
export function renderInitialNostromoYaml({example,fragment}){
  if(typeof example!=='string'||typeof fragment!=='string')
    throw Error('NOSTROMO_YAML_INPUT_INVALID');
  const versions=[...example.matchAll(/^version:\s*([0-9]+\.[0-9]+\.[0-9]+)\s*$/gm)];
  if(versions.length!==1||versions[0][1]!=='1.3.17')
    throw Error('LIBRECHAT_YAML_VERSION_UNEXPECTED');
  const entry=fragment.match(/^mcpServers:\s*\n  nostromo-autonomo:\s*$/gm);
  if(!entry||entry.length!==1||!fragment.includes("NOSTROMO_MCP_ENABLED: '0'"))
    throw Error('MCP_DISABLED_FRAGMENT_REQUIRED');
  const expected='/home/elkakas314/librechat/vx/deployment/nostromo-mcp/server.mjs';
  if(!fragment.includes(expected)||!fragment.includes('type: stdio'))
    throw Error('MCP_FRAGMENT_IDENTITY_MISMATCH');
  // Preserve the current owner-audited single MCP fragment; do not splice into
  // arbitrary YAML text or pretend to validate a preexisting private config.
  return '# NOSTROMO: disabled MCP candidate; NOT authenticated, active or E2E verified.\n'+
    'version: 1.3.17\n\n'+fragment.trimEnd()+'\n';
}

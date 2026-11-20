import { createHash } from 'node:crypto';

// This patch is for the pinned, already overlaid production bundle only.
export const BASE_SHA256 = '261fb74fe9831e208097642d50d1a675a74c6c80accfca9f2332baef028c695f';
const ANCHOR = '\tconst hasFinalAgentTools = (structuredTools?.length ?? 0) > 0 || (toolDefinitions?.length ?? 0) > 0;';
const MARKER = 'NOSTROMO_NATIVE_FILE_DEFERRAL_V1';

// Run after the API's file and skill registrars, which can replace definitions.
// Require existing discovery and complete entries; do not create capabilities.
export const insertion = `\t// ${MARKER}
\tif (agent.id === "agent_9ex2a9buul2cwzyo" && hasDeferredTools && toolRegistry?.has("tool_search") && toolDefinitions?.some((def) => def.name === "tool_search")) {
\t\tconst names = ["read_file", "create_file", "edit_file"];
\t\tif (names.every((name) => toolRegistry.has(name) && toolDefinitions.some((def) => def.name === name))) {
\t\t\tfor (const name of names) toolRegistry.set(name, { ...toolRegistry.get(name), defer_loading: true });
\t\t\ttoolDefinitions = toolDefinitions.map((def) => def.name === "tool_search" ? { ...def, description: (def.description ?? "") + " Search for read_file, create_file, or edit_file when needed." } : def);
\t\t}
\t}
`;

export function patchNativeFileDeferral(source) {
  if (source.includes(MARKER)) throw new Error('NATIVE_FILE_DEFERRAL_ALREADY_PRESENT_OR_PARTIAL');
  if (createHash('sha256').update(source).digest('hex') !== BASE_SHA256) throw new Error('NATIVE_FILE_DEFERRAL_PREIMAGE_MISMATCH');
  if (source.split(ANCHOR).length !== 2) throw new Error('NATIVE_FILE_DEFERRAL_ANCHOR_MISMATCH');
  return source.replace(ANCHOR, insertion + ANCHOR);
}

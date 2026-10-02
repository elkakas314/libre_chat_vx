export type NativeLibreChatSurface =
  | 'AGENTS'
  | 'ARTIFACTS'
  | 'MCP'
  | 'MCP_UI'
  | 'TOOL_APPROVAL'
  | 'SKILLS'
  | 'SUBAGENTS'
  | 'BACKGROUND_TOOL_CALLS'
  | 'FILES'
  | 'FILE_CONTEXT'
  | 'FILE_SEARCH'
  | 'SPEECH'
  | 'RESUMABLE_STREAMS'
  | 'ACL'
  | 'SIDE_PANEL'
  | 'WEB_SEARCH'
  | 'OCR'
  | 'MEMORY'
  | 'CUSTOM_ENDPOINTS';

export interface NativeSurfaceBinding {
  surface: NativeLibreChatSurface;
  vxRole: string;
  reuse: 'REUSE_NATIVE' | 'WRAP_NATIVE' | 'OPTIONAL';
  authority: false;
}

export const NATIVE_SURFACE_BINDINGS: readonly NativeSurfaceBinding[] = [
  { surface:'ARTIFACTS', vxRole:'artifact presentation and local UI intent projection; not TrustedSurfaceHost', reuse:'WRAP_NATIVE', authority:false },
  { surface:'MCP_UI', vxRole:'sandboxed visual-resource base; operational actions still require provenance/schema/policy gates', reuse:'WRAP_NATIVE', authority:false },
  { surface:'TOOL_APPROVAL', vxRole:'approval interaction UI only; target authorization remains owned by Madre or MANOJOS3 Policy', reuse:'WRAP_NATIVE', authority:false },
  { surface:'SKILLS', vxRole:'versioned cockpit instructions; never authority', reuse:'REUSE_NATIVE', authority:false },
  { surface:'SUBAGENTS', vxRole:'cognitive child activity only; never VX13 hijas or material workers', reuse:'REUSE_NATIVE', authority:false },
  { surface:'BACKGROUND_TOOL_CALLS', vxRole:'LibreChat tool-task presentation; distinct from target material runs', reuse:'REUSE_NATIVE', authority:false },
  { surface:'FILES', vxRole:'FilesView presentation', reuse:'WRAP_NATIVE', authority:false },
  { surface:'SPEECH', vxRole:'voice input/presentation only; never voice authorization', reuse:'WRAP_NATIVE', authority:false },
  { surface:'RESUMABLE_STREAMS', vxRole:'conversation/tool stream continuity; never mutation replay', reuse:'REUSE_NATIVE', authority:false },
  { surface:'ACL', vxRole:'access control projection; privacy presentation is separate', reuse:'REUSE_NATIVE', authority:false },
  { surface:'SIDE_PANEL', vxRole:'Nostromo cockpit host', reuse:'WRAP_NATIVE', authority:false },
  { surface:'AGENTS', vxRole:'persona/cognitive capability container; not target authority', reuse:'REUSE_NATIVE', authority:false },
  { surface:'FILE_CONTEXT', vxRole:'temporary/persistent textual file context', reuse:'OPTIONAL', authority:false },
  { surface:'FILE_SEARCH', vxRole:'RAG file retrieval', reuse:'OPTIONAL', authority:false },
  { surface:'WEB_SEARCH', vxRole:'external read research', reuse:'OPTIONAL', authority:false },
  { surface:'OCR', vxRole:'document/image text extraction', reuse:'OPTIONAL', authority:false },
  { surface:'MEMORY', vxRole:'conversation context; never material truth', reuse:'OPTIONAL', authority:false },
  { surface:'CUSTOM_ENDPOINTS', vxRole:'model transport only; not target routing authority', reuse:'OPTIONAL', authority:false },
  { surface:'MCP', vxRole:'tool transport; authority remains target-owned', reuse:'REUSE_NATIVE', authority:false },
];

export function nativeSurfaceRole(surface: NativeLibreChatSurface): NativeSurfaceBinding | undefined {
  return NATIVE_SURFACE_BINDINGS.find((binding) => binding.surface === surface);
}

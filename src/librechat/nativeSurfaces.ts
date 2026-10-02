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
  { surface:'ARTIFACTS', vxRole:'interactive artifact rendering', reuse:'WRAP_NATIVE', authority:false },
  { surface:'MCP_UI', vxRole:'trusted visual resource base', reuse:'WRAP_NATIVE', authority:false },
  { surface:'TOOL_APPROVAL', vxRole:'DecisionInbox owner-issued approval presentation', reuse:'WRAP_NATIVE', authority:false },
  { surface:'SKILLS', vxRole:'versioned cockpit instructions', reuse:'REUSE_NATIVE', authority:false },
  { surface:'SUBAGENTS', vxRole:'cognitive child activity only', reuse:'REUSE_NATIVE', authority:false },
  { surface:'BACKGROUND_TOOL_CALLS', vxRole:'background task projection', reuse:'REUSE_NATIVE', authority:false },
  { surface:'FILES', vxRole:'FilesView', reuse:'WRAP_NATIVE', authority:false },
  { surface:'SPEECH', vxRole:'voice input/presentation', reuse:'WRAP_NATIVE', authority:false },
  { surface:'RESUMABLE_STREAMS', vxRole:'PC/mobile continuation', reuse:'REUSE_NATIVE', authority:false },
  { surface:'ACL', vxRole:'access projection and fail-closed controls', reuse:'REUSE_NATIVE', authority:false },
  { surface:'SIDE_PANEL', vxRole:'Nostromo cockpit host', reuse:'WRAP_NATIVE', authority:false },
  { surface:'AGENTS', vxRole:'persona/capability container', reuse:'REUSE_NATIVE', authority:false },
  { surface:'FILE_CONTEXT', vxRole:'temporary/persistent textual file context', reuse:'OPTIONAL', authority:false },
  { surface:'FILE_SEARCH', vxRole:'RAG file retrieval', reuse:'OPTIONAL', authority:false },
  { surface:'WEB_SEARCH', vxRole:'external read research', reuse:'OPTIONAL', authority:false },
  { surface:'OCR', vxRole:'document/image text extraction', reuse:'OPTIONAL', authority:false },
  { surface:'MEMORY', vxRole:'conversation context, not material truth', reuse:'OPTIONAL', authority:false },
  { surface:'CUSTOM_ENDPOINTS', vxRole:'model endpoint transport only', reuse:'OPTIONAL', authority:false },
  { surface:'MCP', vxRole:'tool transport with target-owned authority', reuse:'REUSE_NATIVE', authority:false },
];

export function nativeSurfaceRole(surface: NativeLibreChatSurface): NativeSurfaceBinding | undefined {
  return NATIVE_SURFACE_BINDINGS.find((binding) => binding.surface === surface);
}

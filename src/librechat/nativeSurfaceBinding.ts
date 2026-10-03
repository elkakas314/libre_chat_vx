export type NativeBindingMode =
  | 'REUSE_NATIVE'
  | 'WRAP_NATIVE'
  | 'EVENT_BRIDGE'
  | 'PROJECTION_ONLY';

export type NativeBindingState =
  | 'SOURCE_PINNED'
  | 'SOURCE_WRAPPER_IMPLEMENTED'
  | 'RUNTIME_UNVERIFIED';

export type NativeSurfaceId =
  | 'SIDE_PANEL'
  | 'ARTIFACTS'
  | 'TOOL_APPROVAL'
  | 'MCP_UI'
  | 'TOOLS_DROPDOWN'
  | 'FILES'
  | 'SUBAGENTS'
  | 'BACKGROUND_TASKS'
  | 'RESUMABLE_STREAMS';

export interface UpstreamSourcePin {
  path: string;
  blobSha: string;
}

export interface NativeSurfaceBindingDescriptor {
  surface: NativeSurfaceId;
  mode: NativeBindingMode;
  state: NativeBindingState;
  sourcePins: readonly UpstreamSourcePin[];
  vxRole: string;
  invariants: readonly string[];
  authority: false;
}

export const NATIVE_LIBRECHAT_BINDING_SOURCE = {
  repository: 'LibreChat-AI/LibreChat',
  commit: 'f10b1d91f1eee3a2c82d5247bf620351486b7c1b',
  tree: 'badb948a90643dfb22332b17549b4c598090c9d7',
} as const;

export const NATIVE_SURFACE_BINDINGS_CURRENT: readonly NativeSurfaceBindingDescriptor[] = [
  {
    surface: 'SIDE_PANEL',
    mode: 'WRAP_NATIVE',
    state: 'SOURCE_WRAPPER_IMPLEMENTED',
    sourcePins: [
      { path:'client/src/components/Chat/Presentation.tsx', blobSha:'46a176099fa1e6ae1afae709c559a42a19c719fa' },
      { path:'client/src/components/SidePanel/SidePanelGroup.tsx', blobSha:'aa611b145289dd5b03381c0dce200e2bcd5da3a5' },
    ],
    vxRole: 'single shared panel host for Artifacts, Subagents and Nostromo; HUD/status may remain outside panel arbitration',
    invariants: [
      'do not create a second frontend',
      'do not create a parallel side panel',
      'preserve native artifact-before-subagent priority',
      'Nostromo must not steal an active native panel',
    ],
    authority:false,
  },
  {
    surface: 'ARTIFACTS',
    mode: 'WRAP_NATIVE',
    state: 'SOURCE_PINNED',
    sourcePins: [
      { path:'client/src/components/Chat/Presentation.tsx', blobSha:'46a176099fa1e6ae1afae709c559a42a19c719fa' },
    ],
    vxRole: 'presentation and interactive UiIntent surface; operational effects remain governed elsewhere',
    invariants:[
      'Artifact is not TrustedSurfaceHost',
      'Artifact controls never directly mutate targets',
    ],
    authority:false,
  },
  {
    surface: 'TOOL_APPROVAL',
    mode: 'EVENT_BRIDGE',
    state: 'SOURCE_WRAPPER_IMPLEMENTED',
    sourcePins: [
      { path:'client/src/components/Chat/Messages/Content/ToolApproval.tsx', blobSha:'a75d05ecdf2e21515ba4a6a7a718fc43efc316c3' },
      { path:'client/src/components/Chat/Messages/Content/ApprovalContext.tsx', blobSha:'ed1bf597ea939a88d72a16e2307952080787506e' },
    ],
    vxRole: 'approval/response interaction and resume surface for owner-issued decisions',
    invariants:[
      'native approve/reject/edit/respond is not target authorization',
      'authorizationRef must come from target authority',
      'batch submit lifecycle remains native',
    ],
    authority:false,
  },
  {
    surface: 'MCP_UI',
    mode: 'WRAP_NATIVE',
    state: 'SOURCE_PINNED',
    sourcePins: [
      { path:'client/src/components/MCPUIResource/Renderer.tsx', blobSha:'f5bc460d19a51a920be50a269771343fda303365' },
    ],
    vxRole: 'sandboxed inline HTML visual-resource base beneath separate TrustedSurfaceHost operational gates',
    invariants:[
      'native renderer accepts sandboxed text/html only at the pinned source',
      'MCP UI rendering does not authorize target effects',
      'schema/provenance/action allowlists remain separate VX gates',
    ],
    authority:false,
  },
  {
    surface: 'TOOLS_DROPDOWN',
    mode: 'PROJECTION_ONLY',
    state: 'SOURCE_WRAPPER_IMPLEMENTED',
    sourcePins: [
      { path:'client/src/components/Chat/Input/ToolsDropdown.tsx', blobSha:'64fc779bba4eb2536a5b16e946a2b79d91409b6c' },
    ],
    vxRole: 'native LibreChat access filter composed with target capability/binding gate',
    invariants:[
      'native permission AND target gate; never OR',
      'tool visibility is not material readiness',
    ],
    authority:false,
  },
  {
    surface: 'FILES',
    mode: 'WRAP_NATIVE',
    state: 'SOURCE_PINNED',
    sourcePins: [
      { path:'client/src/components/SidePanel/Files/Panel.tsx', blobSha:'f3b2dbfd2cd82e58b1f834d401610befde9ece23' },
    ],
    vxRole: 'native file listing/view; external resource operations retain explicit per-operation permission',
    invariants:[
      'file presence does not grant edit/delete/move',
      'external providers remain ExternalResourceRef projections',
    ],
    authority:false,
  },
  {
    surface: 'SUBAGENTS',
    mode: 'EVENT_BRIDGE',
    state: 'SOURCE_PINNED',
    sourcePins: [
      { path:'client/src/components/Chat/Subagents/SubagentThreadPanel.tsx', blobSha:'250d914cc1afa773b5a86d4cad7b7c3521545022' },
    ],
    vxRole: 'cognitive child-task activity and controls; separate from target-owned material workers',
    invariants:[
      'LibreChat subagent is not VX13 hija',
      'LibreChat subagent is not MANOJOS3 Kernel/worker',
      'task receipts remain classified as LibreChat cognitive/tool activity unless target provenance says otherwise',
    ],
    authority:false,
  },
  {
    surface: 'BACKGROUND_TASKS',
    mode: 'EVENT_BRIDGE',
    state: 'SOURCE_PINNED',
    sourcePins: [
      { path:'client/src/components/Chat/BackgroundTasks/Section.tsx', blobSha:'aa8527ed87c645f3e7d2a323999d640cf118778c' },
    ],
    vxRole: 'LibreChat background tool/task presentation distinct from target material run',
    invariants:[
      'background task state is not TargetRun state',
      'task completion is not material verification',
    ],
    authority:false,
  },
  {
    surface: 'RESUMABLE_STREAMS',
    mode: 'EVENT_BRIDGE',
    state: 'SOURCE_WRAPPER_IMPLEMENTED',
    sourcePins: [
      { path:'client/src/hooks/SSE/useResumableSSE.ts', blobSha:'67dc162c2651cb59551060857c1d1e528b2a1bfb' },
    ],
    vxRole: 'conversation/tool/subagent stream continuity and reconnect reconciliation',
    invariants:[
      'stream replay is not target mutation replay',
      'ambiguous material outcome requires target readback before retry',
      'conversation resume never manufactures authorization',
    ],
    authority:false,
  },
] as const;

export function nativeBinding(
  surface: NativeSurfaceId,
): NativeSurfaceBindingDescriptor | undefined {
  return NATIVE_SURFACE_BINDINGS_CURRENT.find((binding) => binding.surface === surface);
}

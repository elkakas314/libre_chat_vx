export const LIBRECHAT_RESUME_SOURCE = {
  repository:'LibreChat-AI/LibreChat',
  commit:'f10b1d91f1eee3a2c82d5247bf620351486b7c1b',
  useResumeOnLoad:{
    path:'client/src/hooks/SSE/useResumeOnLoad.ts',
    blobSha:'4dc45d8bcf756aedb41df9bd60b8c73f76e034dc',
    role:'detect active generation on conversation load and attach a resume submission',
  },
  useResumableSSE:{
    path:'client/src/hooks/SSE/useResumableSSE.ts',
    blobSha:'67dc162c2651cb59551060857c1d1e528b2a1bfb',
    role:'reconnect/resume generation stream and reconcile pending UI/tool state',
  },
} as const;

export const RESUME_BOUNDARY = {
  conversationAndUiStreams:true,
  targetMaterialEffects:false,
  targetAuthorization:false,
  offlineOutboxForEffects:false,
} as const;

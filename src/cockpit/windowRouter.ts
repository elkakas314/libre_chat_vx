export type FocusDomain =
  | 'OVERVIEW'
  | 'FILES'
  | 'AUDIO'
  | 'BROWSER'
  | 'BUILD'
  | 'RUNTIME'
  | 'MODEL'
  | 'EVIDENCE'
  | 'SECURITY'
  | 'PLAN'
  | 'TARGET'
  | 'REPO'
  | 'CONNECTORS'
  | 'THREADS'
  | 'HOST'
  | 'TOOLBUS'
  | 'LIBRECHAT';

export type CockpitWindow =
  | 'STATUS_RAIL'
  | 'MINIMAL_TRUTH'
  | 'CONTEXT_INSPECTOR'
  | 'DECISION_INBOX'
  | 'ARTIFACT_DOCK'
  | 'MODULE_INDEX'
  | 'PLAN_GRAPH'
  | 'ACTIVE_FLOW'
  | 'INTERFLOW_MAP'
  | 'CAPABILITY_LENSES'
  | 'NATIVE_SURFACES'
  | 'EVIDENCE'
  | 'FILES'
  | 'AUDIO'
  | 'BROWSER'
  | 'BUILD'
  | 'BACKGROUND_TASKS'
  | 'TARGET_RUN';

const TOKENS: ReadonlyArray<[FocusDomain, readonly string[]]> = [
  ['EVIDENCE', ['evidencia', 'evidence', 'receipt', 'recibo', 'readback', 'verificación', 'verification']],
  ['AUDIO', ['audio', 'reaper', 'mezcla', 'mastering', 'plugin', 'pedal', 'shub', 'pista']],
  ['BROWSER', ['browser', 'navegador', 'playwright', 'cdp', 'pestaña', 'tab']],
  ['REPO', ['repo', 'git', 'commit', 'branch', 'rama']],
  ['BUILD', ['build', 'constructor', 'construction', 'opencode', 'parche', 'patch', 'blueprint', 'autoconstruction']],
  ['CONNECTORS', ['connector', 'conector', 'drive', 'onedrive', 'sharepoint', 'google', 'outlook', 'whatsapp']],
  ['FILES', ['archivo', 'archivos', 'documento', 'pdf', 'zip', 'file']],
  ['THREADS', ['thread', 'hilo', 'hilos', 'dispatcher']],
  ['HOST', ['host', 'remote desktop', 'desktop commander', 'cli', 'container']],
  ['TOOLBUS', ['toolbus', 'mcp', 'tool bus', 'transport']],
  ['RUNTIME', ['runtime', 'servicio', 'service', 'proceso', 'health', 'readiness', 'estado', 'fallo', 'error', 'stabilization']],
  ['MODEL', ['modelo', 'model', 'llm', 'provider', 'router', 'hermes']],
  ['SECURITY', ['seguridad', 'security', 'permiso', 'acl', 'grant', 'autorización', 'authorization', 'token']],
  ['PLAN', ['plan', 'manifestator', 'dag', 'blueprint', 'evolución', 'evolution', 'composite']],
  ['LIBRECHAT', ['librechat', 'chat', 'artifact', 'skill', 'subagent', 'background task', 'tool approval', 'side panel']],
  ['TARGET', ['vx13', 'manojos3', 'target', 'sistema', 'interflow', 'intent']],
];

export function deriveFocusDomain(text: string, explicit?: FocusDomain): FocusDomain {
  if (explicit) return explicit;
  const normalized = text.toLowerCase();
  for (const [domain, tokens] of TOKENS) {
    if (tokens.some((token) => normalized.includes(token))) return domain;
  }
  return 'OVERVIEW';
}

const BASE: CockpitWindow[] = [
  'STATUS_RAIL',
  'MINIMAL_TRUTH',
  'CONTEXT_INSPECTOR',
  'DECISION_INBOX',
  'ARTIFACT_DOCK',
];

export function windowsForDomain(domain: FocusDomain): CockpitWindow[] {
  const extra: Record<FocusDomain, CockpitWindow[]> = {
    OVERVIEW: ['MODULE_INDEX', 'INTERFLOW_MAP', 'CAPABILITY_LENSES'],
    FILES: ['FILES', 'EVIDENCE'],
    AUDIO: ['AUDIO', 'EVIDENCE'],
    BROWSER: ['BROWSER', 'INTERFLOW_MAP', 'ACTIVE_FLOW'],
    BUILD: ['BUILD', 'INTERFLOW_MAP', 'PLAN_GRAPH', 'ACTIVE_FLOW'],
    RUNTIME: ['TARGET_RUN', 'INTERFLOW_MAP', 'ACTIVE_FLOW', 'CAPABILITY_LENSES'],
    MODEL: ['INTERFLOW_MAP', 'CAPABILITY_LENSES', 'TARGET_RUN'],
    EVIDENCE: ['EVIDENCE', 'ARTIFACT_DOCK'],
    SECURITY: ['INTERFLOW_MAP', 'DECISION_INBOX', 'MINIMAL_TRUTH'],
    PLAN: ['INTERFLOW_MAP', 'PLAN_GRAPH', 'ACTIVE_FLOW'],
    TARGET: ['TARGET_RUN', 'INTERFLOW_MAP', 'CAPABILITY_LENSES'],
    REPO: ['BUILD', 'INTERFLOW_MAP', 'CAPABILITY_LENSES', 'EVIDENCE'],
    CONNECTORS: ['FILES', 'INTERFLOW_MAP', 'CAPABILITY_LENSES'],
    THREADS: ['INTERFLOW_MAP', 'CAPABILITY_LENSES', 'ACTIVE_FLOW'],
    HOST: ['INTERFLOW_MAP', 'CAPABILITY_LENSES', 'TARGET_RUN'],
    TOOLBUS: ['INTERFLOW_MAP', 'CAPABILITY_LENSES', 'ACTIVE_FLOW'],
    LIBRECHAT: ['MODULE_INDEX', 'NATIVE_SURFACES', 'ARTIFACT_DOCK', 'BACKGROUND_TASKS'],
  };

  return [...new Set([...BASE, ...extra[domain]])];
}

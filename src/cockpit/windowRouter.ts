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
  | 'CAPABILITY_LENSES'
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
  ['BUILD', ['build', 'constructor', 'construction', 'opencode', 'parche', 'patch']],
  ['CONNECTORS', ['connector', 'conector', 'drive', 'onedrive', 'sharepoint']],
  ['FILES', ['archivo', 'archivos', 'documento', 'pdf', 'zip', 'file']],
  ['THREADS', ['thread', 'hilo', 'hilos']],
  ['HOST', ['host', 'remote desktop', 'desktop commander']],
  ['TOOLBUS', ['toolbus', 'mcp', 'tool bus']],
  ['RUNTIME', ['runtime', 'servicio', 'service', 'proceso', 'health', 'readiness', 'estado', 'fallo', 'error']],
  ['MODEL', ['modelo', 'model', 'llm', 'provider', 'router', 'hermes']],
  ['SECURITY', ['seguridad', 'security', 'permiso', 'acl', 'grant', 'autorización', 'authorization']],
  ['PLAN', ['plan', 'manifestator', 'dag', 'blueprint', 'evolución', 'evolution']],
  ['LIBRECHAT', ['librechat', 'chat', 'artifact', 'skill', 'subagent']],
  ['TARGET', ['vx13', 'manojos3', 'target', 'sistema']],
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
    OVERVIEW: ['MODULE_INDEX', 'CAPABILITY_LENSES'],
    FILES: ['FILES', 'EVIDENCE'],
    AUDIO: ['AUDIO', 'EVIDENCE'],
    BROWSER: ['BROWSER', 'ACTIVE_FLOW'],
    BUILD: ['BUILD', 'PLAN_GRAPH', 'ACTIVE_FLOW'],
    RUNTIME: ['TARGET_RUN', 'ACTIVE_FLOW', 'CAPABILITY_LENSES'],
    MODEL: ['CAPABILITY_LENSES', 'TARGET_RUN'],
    EVIDENCE: ['EVIDENCE', 'ARTIFACT_DOCK'],
    SECURITY: ['DECISION_INBOX', 'MINIMAL_TRUTH'],
    PLAN: ['PLAN_GRAPH', 'ACTIVE_FLOW'],
    TARGET: ['TARGET_RUN', 'CAPABILITY_LENSES'],
    REPO: ['BUILD', 'CAPABILITY_LENSES', 'EVIDENCE'],
    CONNECTORS: ['FILES', 'CAPABILITY_LENSES'],
    THREADS: ['CAPABILITY_LENSES', 'ACTIVE_FLOW'],
    HOST: ['CAPABILITY_LENSES', 'TARGET_RUN'],
    TOOLBUS: ['CAPABILITY_LENSES', 'ACTIVE_FLOW'],
    LIBRECHAT: ['MODULE_INDEX', 'ARTIFACT_DOCK', 'BACKGROUND_TASKS'],
  };

  return [...new Set([...BASE, ...extra[domain]])];
}

import type { Risk } from '../core/types';

export type InterflowRouterAction =
  | 'IN_ROUTER_14'
  | 'EXTEND_ROUTER'
  | 'STANDALONE_NO_ROUTE'
  | 'DELEGATE_SEMANTIC';

export type InterflowVisibility = 'PRIMARY' | 'CONTEXTUAL' | 'INTERNAL';

export type InterflowLens =
  | 'OBSERVABILITY'
  | 'CAPABILITIES'
  | 'COMMUNICATIONS'
  | 'CONNECTORS'
  | 'BROWSER'
  | 'THREADS'
  | 'REPO'
  | 'CONTINUITY'
  | 'BUILD'
  | 'REPAIR'
  | 'MODELS'
  | 'HOST'
  | 'SCHEDULER'
  | 'SECURITY'
  | 'TOOLBUS'
  | 'SKILLS'
  | 'MAINTENANCE'
  | 'STATE_EVIDENCE'
  | 'COMPOSITE'
  | 'INTERNAL';

export interface Manojos3InterflowDomain {
  domain: string;
  intentCapability?: string;
  provider: string;
  risk: Risk;
  availability: string;
  routerAction: InterflowRouterAction;
  flowFile?: string;
  lens: InterflowLens;
  visibility: InterflowVisibility;
}

export interface Manojos3IntentFlowDocument {
  schema: string;
  domain: string;
  capability?: string;
  mode?: string;
  inputs?: Record<string, unknown>;
  intent_families?: string[];
  drivers?: string[];
  output_fields?: string[];
  downstream_interflows?: Record<string, string>;
  rules?: string[];
  acceptance?: Record<string, unknown>;
}

export interface InterflowDetailProjection {
  domain: string;
  capability?: string;
  mode?: string;
  intentFamilies: string[];
  drivers: string[];
  downstreamInterflows: Record<string, string>;
  rules: string[];
  outputFields: string[];
  acceptance: Record<string, unknown>;
  authority: false;
}

export const MANOJOS3_INTERFLOW_SOURCE = {
  repository: 'elkakas314/manojos3',
  head: 'cb772cca141f7ae5ae03af9655b3c5186f5826f6',
  semanticMatrixBlob: '30a63c9c359e46a2743f711c2d5e1a5bd031a45e',
  semanticMatrixInternalSourceHead: 'e910fce958d9b7660ce0618ae7578a647016ee75',
  operationMatrixBlob: '3bbf760e4b00aadd7716b263ba5b2009dbfdaa8c',
  runtimeAuditBlob: '253ea095dd26a73c1c749eddc7a4deb4d2a350a8',
  executionMatrixBlob: '2637bdbdf746f3d96ee529dc146d5e052c28b930',
} as const;

export const MANOJOS3_INTERFLOW_TARGET_STACK = [
  'Intent Router',
  'Slot Resolver',
  'Operation Compiler',
  'Operation Gateway',
  'Policy/Kernel',
  'Driver Adapters',
  'Verifier/Receipt',
] as const;

export const MANOJOS3_OPERATION_GATEWAYS = [
  'operation.status',
  'operation.catalog',
  'operation.read',
  'operation.canary',
  'operation.act',
  'operation.sync',
] as const;

export const MANOJOS3_INTERFLOW_DOMAINS: readonly Manojos3InterflowDomain[] = [
  {
    "domain": "audit.watch",
    "intentCapability": "audit.watch.intent.plan",
    "provider": "audit_watch",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "lens": "OBSERVABILITY",
    "visibility": "CONTEXTUAL"
  },
  {
    "domain": "capability.audit",
    "intentCapability": "capability.audit.intent.plan",
    "provider": "capability-audit-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "flowFile": "CAPABILITY_AUDIT_INTENT_FLOW_CURRENT.json",
    "lens": "CAPABILITIES",
    "visibility": "PRIMARY"
  },
  {
    "domain": "mail",
    "intentCapability": "mail.intent.plan",
    "provider": "mail-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "MAIL_INTENT_FLOW_CURRENT.json",
    "lens": "COMMUNICATIONS",
    "visibility": "PRIMARY"
  },
  {
    "domain": "graph",
    "intentCapability": "graph.intent.plan",
    "provider": "graph-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "GRAPH_INTENT_FLOW_CURRENT.json",
    "lens": "CONNECTORS",
    "visibility": "PRIMARY"
  },
  {
    "domain": "onedrive",
    "intentCapability": "onedrive.intent.plan",
    "provider": "onedrive-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "ONEDRIVE_INTENT_FLOW_CURRENT.json",
    "lens": "CONNECTORS",
    "visibility": "PRIMARY"
  },
  {
    "domain": "google",
    "intentCapability": "google.intent.plan",
    "provider": "google-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "GOOGLE_INTENT_FLOW_CURRENT.json",
    "lens": "CONNECTORS",
    "visibility": "PRIMARY"
  },
  {
    "domain": "whatsapp",
    "intentCapability": "whatsapp.intent.plan",
    "provider": "whatsapp-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "WHATSAPP_INTENT_FLOW_CURRENT.json",
    "lens": "COMMUNICATIONS",
    "visibility": "PRIMARY"
  },
  {
    "domain": "browser",
    "intentCapability": "browser.intent.plan",
    "provider": "browser-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "BROWSER_INTENT_FLOW_CURRENT.json",
    "lens": "BROWSER",
    "visibility": "PRIMARY"
  },
  {
    "domain": "dispatcher",
    "intentCapability": "dispatcher.intent.plan",
    "provider": "dispatcher-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "DISPATCHER_INTENT_FLOW_CURRENT.json",
    "lens": "THREADS",
    "visibility": "PRIMARY"
  },
  {
    "domain": "repo",
    "intentCapability": "repo.intent.plan",
    "provider": "repo-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "REPO_INTENT_FLOW_CURRENT.json",
    "lens": "REPO",
    "visibility": "PRIMARY"
  },
  {
    "domain": "stabilization",
    "intentCapability": "stabilization.intent.plan",
    "provider": "stabilization-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "STABILIZATION_INTENT_FLOW_CURRENT.json",
    "lens": "CONTINUITY",
    "visibility": "PRIMARY"
  },
  {
    "domain": "context",
    "intentCapability": "context.intent.plan",
    "provider": "context-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "flowFile": "CONTEXT_INTENT_FLOW_CURRENT.json",
    "lens": "CONTINUITY",
    "visibility": "PRIMARY"
  },
  {
    "domain": "construction",
    "intentCapability": "construction.intent.plan",
    "provider": "construction-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "CONSTRUCTION_INTENT_FLOW_CURRENT.json",
    "lens": "BUILD",
    "visibility": "PRIMARY"
  },
  {
    "domain": "blueprint",
    "intentCapability": "blueprint.intent.plan",
    "provider": "blueprint-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "BLUEPRINT_INTENT_FLOW_CURRENT.json",
    "lens": "BUILD",
    "visibility": "PRIMARY"
  },
  {
    "domain": "autoconstruction",
    "intentCapability": "autoconstruction.intent.plan",
    "provider": "autoconstruction-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "AUTOCONSTRUCTION_INTENT_FLOW_CURRENT.json",
    "lens": "BUILD",
    "visibility": "PRIMARY"
  },
  {
    "domain": "repair.advisory",
    "intentCapability": "repair.advisory.intent.plan",
    "provider": "repair-advisory-intent",
    "risk": "R1",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "lens": "REPAIR",
    "visibility": "PRIMARY"
  },
  {
    "domain": "llm.models",
    "intentCapability": "llm.models.intent.plan",
    "provider": "llm-models-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "LLM_MODELS_INTENT_FLOW_CURRENT.json",
    "lens": "MODELS",
    "visibility": "PRIMARY"
  },
  {
    "domain": "host",
    "intentCapability": "host.intent.plan",
    "provider": "host-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "IN_ROUTER_14",
    "flowFile": "HOST_INTENT_FLOW_CURRENT.json",
    "lens": "HOST",
    "visibility": "PRIMARY"
  },
  {
    "domain": "scheduler",
    "intentCapability": "scheduler.intent.plan",
    "provider": "scheduler-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "flowFile": "SCHEDULER_INTENT_FLOW_CURRENT.json",
    "lens": "SCHEDULER",
    "visibility": "PRIMARY"
  },
  {
    "domain": "token",
    "intentCapability": "token.intent.plan",
    "provider": "token-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "STANDALONE_NO_ROUTE",
    "flowFile": "TOKEN_INTENT_FLOW_CURRENT.json",
    "lens": "SECURITY",
    "visibility": "CONTEXTUAL"
  },
  {
    "domain": "mcp",
    "intentCapability": "mcp.intent.plan",
    "provider": "mcp-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "flowFile": "MCP_INTENT_FLOW_CURRENT.json",
    "lens": "TOOLBUS",
    "visibility": "PRIMARY"
  },
  {
    "domain": "cli",
    "intentCapability": "cli.intent.plan",
    "provider": "cli-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "flowFile": "CLI_INTENT_FLOW_CURRENT.json",
    "lens": "HOST",
    "visibility": "CONTEXTUAL"
  },
  {
    "domain": "skills",
    "intentCapability": "skills.intent.plan",
    "provider": "skills-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "STANDALONE_NO_ROUTE",
    "flowFile": "SKILLS_INTENT_FLOW_CURRENT.json",
    "lens": "SKILLS",
    "visibility": "CONTEXTUAL"
  },
  {
    "domain": "module",
    "intentCapability": "module.intent.plan",
    "provider": "module-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "flowFile": "MODULE_INTENT_FLOW_CURRENT.json",
    "lens": "BUILD",
    "visibility": "PRIMARY"
  },
  {
    "domain": "worker",
    "intentCapability": "worker.intent.plan",
    "provider": "worker-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "flowFile": "WORKER_INTENT_FLOW_CURRENT.json",
    "lens": "BUILD",
    "visibility": "PRIMARY"
  },
  {
    "domain": "container",
    "intentCapability": "container.intent.plan",
    "provider": "container-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "flowFile": "CONTAINER_INTENT_FLOW_CURRENT.json",
    "lens": "BUILD",
    "visibility": "PRIMARY"
  },
  {
    "domain": "transport",
    "intentCapability": "transport.intent.plan",
    "provider": "transport-intent",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "flowFile": "TRANSPORT_INTENT_FLOW_CURRENT.json",
    "lens": "TOOLBUS",
    "visibility": "CONTEXTUAL"
  },
  {
    "domain": "cleanup",
    "intentCapability": "cleanup.intent.plan",
    "provider": "semantic-intents",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "EXTEND_ROUTER",
    "lens": "MAINTENANCE",
    "visibility": "CONTEXTUAL"
  },
  {
    "domain": "state",
    "provider": "state_admin",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "STANDALONE_NO_ROUTE",
    "lens": "STATE_EVIDENCE",
    "visibility": "INTERNAL"
  },
  {
    "domain": "calendar_fixture",
    "intentCapability": "calendar_fixture.intent.plan",
    "provider": "semantic-intents",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "STANDALONE_NO_ROUTE",
    "lens": "INTERNAL",
    "visibility": "INTERNAL"
  },
  {
    "domain": "composite",
    "intentCapability": "composite.intent.plan",
    "provider": "semantic-intents",
    "risk": "R0",
    "availability": "AVAILABLE",
    "routerAction": "DELEGATE_SEMANTIC",
    "lens": "COMPOSITE",
    "visibility": "PRIMARY"
  }
] as const;

export function projectIntentFlow(
  document: Manojos3IntentFlowDocument,
): InterflowDetailProjection {
  return {
    domain: document.domain,
    capability: document.capability,
    mode: document.mode,
    intentFamilies: [...(document.intent_families ?? [])],
    drivers: [...(document.drivers ?? [])],
    downstreamInterflows: { ...(document.downstream_interflows ?? {}) },
    rules: [...(document.rules ?? [])],
    outputFields: [...(document.output_fields ?? [])],
    acceptance: { ...(document.acceptance ?? {}) },
    authority: false,
  };
}

export function interflowDomainsForLens(
  lens: InterflowLens,
  domains: readonly Manojos3InterflowDomain[] = MANOJOS3_INTERFLOW_DOMAINS,
): Manojos3InterflowDomain[] {
  return domains.filter((domain) => domain.lens === lens);
}

export function visibleInterflowDomains(
  domains: readonly Manojos3InterflowDomain[] = MANOJOS3_INTERFLOW_DOMAINS,
): Manojos3InterflowDomain[] {
  return domains.filter((domain) => domain.visibility !== 'INTERNAL');
}

export function automaticRouterDomain(
  domain: Manojos3InterflowDomain,
): boolean {
  return domain.routerAction === 'IN_ROUTER_14' || domain.routerAction === 'EXTEND_ROUTER';
}

export function capabilitiesAreInternalDrivers(): true {
  return true;
}

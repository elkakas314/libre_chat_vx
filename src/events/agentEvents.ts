export type ExternalSystemEventSource = 'MANOJOS3' | 'VX13' | 'ORACULO' | 'LIBRECHAT_INTERNAL';
export type EventSeverity = 'INFO' | 'ATTENTION' | 'CRITICAL';

export interface ExternalSystemNotification {
  source: ExternalSystemEventSource;
  eventId: string;
  type: string;
  occurredAtMs: number;
  resourceRef?: string;
  summary: string;
  severity: EventSeverity;
  evidenceRefs?: readonly string[];
}

export interface LibreChatAgentEventDelivery {
  mode: 'fire';
  idempotencyKey: string;
  orderingKey?: string;
  event: {
    id: string;
    type: string;
    occurredAt: number;
    payload: {
      source: ExternalSystemEventSource;
      resourceRef?: string;
      summary: string;
      severity: EventSeverity;
      evidenceRefs: readonly string[];
    };
  };
  input: string;
  authority: false;
}

function safeKey(value:string):string {
  return value.replace(/[^A-Za-z0-9._~:/+=-]/g,'-').slice(0,256);
}

export function buildAgentEventDelivery(
  notification:ExternalSystemNotification,
):LibreChatAgentEventDelivery {
  const orderingKey=notification.resourceRef
    ? safeKey(notification.source+':'+notification.resourceRef)
    : undefined;
  return {
    mode:'fire',
    idempotencyKey:safeKey(notification.source+':'+notification.eventId),
    orderingKey,
    event:{
      id:notification.eventId,
      type:notification.type,
      occurredAt:notification.occurredAtMs,
      payload:{
        source:notification.source,
        resourceRef:notification.resourceRef,
        summary:notification.summary,
        severity:notification.severity,
        evidenceRefs:notification.evidenceRefs ?? [],
      },
    },
    input:'Interpreta este evento, conserva su procedencia y avisa al usuario sólo si requiere atención o aporta información útil.',
    authority:false,
  };
}

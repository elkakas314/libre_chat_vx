export interface ClientTelemetryEvent {
  kind: 'RECONNECT' | 'RENDER_ERROR' | 'LATENCY' | 'RESYNC' | 'VIEW_SUSPEND';
  observedAt: string;
  durationMs?: number;
  rendererId?: string;
  containsPromptOrPii: false;
}

export function telemetryAllowed(event: ClientTelemetryEvent): boolean {
  return event.containsPromptOrPii === false;
}

export type ProjectionClass = 'CRITICAL_TRANSITION' | 'STATE_LATEST' | 'TELEMETRY_SAMPLE';

export interface ProjectionEvent<T = unknown> {
  eventId: string;
  objectRef: string;
  class: ProjectionClass;
  payload: T;
}

export function isLosslessProjection(event: ProjectionEvent): boolean {
  return event.class === 'CRITICAL_TRANSITION';
}

export function coalescingKey(event: ProjectionEvent): string | null {
  if (event.class === 'CRITICAL_TRANSITION') return null;
  return `${event.class}:${event.objectRef}`;
}

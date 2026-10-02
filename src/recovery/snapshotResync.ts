export interface UiSnapshot {
  revision: string;
  cursor: string;
}

export interface UiEvent {
  eventId: string;
  cursor: string;
  revision: string;
}

export class EventDeduper {
  #seen = new Set<string>();
  accept(event: UiEvent): boolean {
    if (this.#seen.has(event.eventId)) return false;
    this.#seen.add(event.eventId);
    return true;
  }
}

export function requiresResync(snapshot: UiSnapshot, event: UiEvent): boolean {
  return snapshot.revision !== event.revision;
}

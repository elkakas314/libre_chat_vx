export type FocusSignal =
  | 'USER_PIN' | 'CRITICAL_ALERT' | 'AUTHORIZATION'
  | 'OPEN_TASK' | 'CONTEXT' | 'OVERVIEW';

const PRIORITY: Record<FocusSignal, number> = {
  USER_PIN: 100,
  CRITICAL_ALERT: 90,
  AUTHORIZATION: 80,
  OPEN_TASK: 70,
  CONTEXT: 60,
  OVERVIEW: 10,
};

export function chooseFocus(signals: FocusSignal[]): FocusSignal | null {
  return [...signals].sort((a,b)=>PRIORITY[b]-PRIORITY[a])[0] ?? null;
}

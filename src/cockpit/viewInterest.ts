export type CoreMinimumField =
  | 'CONNECTION'
  | 'FRESHNESS'
  | 'DECISION_INBOX'
  | 'FOLLOWED_RUN_LIFECYCLE'
  | 'REVOCATIONS'
  | 'MANDATORY_ALERTS';

export const CORE_MINIMUM: ReadonlySet<CoreMinimumField> = new Set([
  'CONNECTION','FRESHNESS','DECISION_INBOX','FOLLOWED_RUN_LIFECYCLE','REVOCATIONS','MANDATORY_ALERTS'
]);

export interface ViewInterest {
  viewId: string;
  active: boolean;
  optionalChannels: string[];
}

// ViewInterest is ephemeral demand only: never ACL, policy, PowerLease, start/stop.

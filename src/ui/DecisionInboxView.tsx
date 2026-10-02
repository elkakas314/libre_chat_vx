import React from 'react';
import type { DecisionCard } from '../cockpit/decisionInbox';

export interface DecisionInboxViewProps {
  decisions: DecisionCard[];
  onOpen?: (decision: DecisionCard) => void;
}

export function DecisionInboxView({ decisions, onOpen }: DecisionInboxViewProps) {
  const pending = decisions.filter((decision) => decision.state === 'PENDING');
  return (
    <section aria-label="Decision inbox" data-testid="vx-decision-inbox">
      <h2>Decision Inbox</h2>
      {pending.length === 0 ? <p>No pending decisions</p> : (
        <ul>
          {pending.map((decision) => (
            <li key={decision.decisionRef}>
              <button type="button" onClick={() => onOpen?.(decision)}>
                {decision.targetRef} · {decision.ownerRef}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

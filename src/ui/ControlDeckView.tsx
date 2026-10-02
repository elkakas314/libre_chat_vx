import React from 'react';
import type { TargetParityTruth } from '../adapters/targetParity';
import type { TargetScope } from '../cockpit/systemTarget';
import { CONTROL_SPECS, controlIntent, type ControlIntent } from '../cockpit/controlDeck';

export function ControlDeckView({
  scope,
  target,
  authorizationRef,
  capabilityRef,
  onIntent,
}: {
  scope: TargetScope;
  target?: TargetParityTruth;
  authorizationRef?: string;
  capabilityRef?: string;
  onIntent?: (intent: ControlIntent) => void;
}) {
  return (
    <section aria-label="Control deck" data-testid="vx-control-deck">
      <h2>Mandos</h2>
      {(['GREEN', 'YELLOW', 'RED'] as const).map((klass) => (
        <fieldset key={klass}>
          <legend>{klass}</legend>
          {CONTROL_SPECS.filter((spec) => spec.class === klass).map((spec) => {
            const intent = controlIntent(spec, scope, target, authorizationRef, capabilityRef);
            return (
              <button
                key={spec.id}
                type="button"
                disabled={!intent.canPrepare}
                aria-description={intent.blockers.join(',')}
                onClick={() => onIntent?.(intent)}
              >
                {spec.id}
              </button>
            );
          })}
        </fieldset>
      ))}
    </section>
  );
}

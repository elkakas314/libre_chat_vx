import React from 'react';
import type { TargetParityTruth } from '../adapters/targetParity';
import { CONTROL_SPECS, controlIntent, type ControlIntent } from '../cockpit/controlDeck';

export function ControlDeckView({
  target,
  authorityRef,
  onIntent,
}: {
  target: TargetParityTruth;
  authorityRef?: string;
  onIntent?: (intent: ControlIntent) => void;
}) {
  return (
    <section aria-label="Control deck" data-testid="vx-control-deck">
      <h2>Mandos</h2>
      {(['GREEN', 'YELLOW', 'RED'] as const).map((klass) => (
        <fieldset key={klass}>
          <legend>{klass}</legend>
          {CONTROL_SPECS.filter((spec) => spec.class === klass).map((spec) => {
            const intent = controlIntent(spec, target, authorityRef);
            return (
              <button
                key={spec.id}
                type="button"
                disabled={!intent.canPrepare}
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

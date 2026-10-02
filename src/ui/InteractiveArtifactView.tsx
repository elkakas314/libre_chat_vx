import React from 'react';
import type { TargetParityTruth } from '../adapters/targetParity';
import type { TargetScope } from '../cockpit/systemTarget';
import {
  artifactCommitIntent,
  artifactPreviewIntent,
  type ArtifactUiIntent,
  type InteractiveArtifactControl,
} from '../artifacts/interactiveArtifact';

export function InteractiveArtifactView({
  controls,
  scope,
  target,
  authorizationRef,
  capabilityRef,
  onIntent,
}: {
  controls: InteractiveArtifactControl[];
  scope: TargetScope;
  target?: TargetParityTruth;
  authorizationRef?: string;
  capabilityRef?: string;
  onIntent?: (intent: ArtifactUiIntent) => void;
}) {
  return (
    <section aria-label="Interactive artifact controls" data-testid="vx-interactive-artifact">
      <h2>Artifact Controls</h2>
      {controls.map((control) => {
        const commit = artifactCommitIntent(
          control,
          scope,
          target,
          authorizationRef,
          capabilityRef,
        );
        return (
          <div key={control.id}>
            <label>
              {control.label}
              {control.kind === 'SLIDER' || control.kind === 'KNOB' ? (
                <input
                  type="range"
                  min={control.min ?? 0}
                  max={control.max ?? 100}
                  step={control.step ?? 1}
                  defaultValue={control.value ?? control.min ?? 0}
                  onChange={(event) => onIntent?.(
                    artifactPreviewIntent(control, scope, Number(event.currentTarget.value)),
                  )}
                />
              ) : null}
            </label>
            <button
              type="button"
              disabled={!commit.canPrepare}
              onClick={() => onIntent?.(commit)}
            >
              {control.class === 'RED' ? 'Preparar solicitud' : 'Aplicar a borrador'}
            </button>
          </div>
        );
      })}
    </section>
  );
}

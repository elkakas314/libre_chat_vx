import React from 'react';
import type { TargetParityTruth } from '../adapters/targetParity';
import {
  artifactCommitIntent,
  artifactPreviewIntent,
  type ArtifactUiIntent,
  type InteractiveArtifactControl,
} from '../artifacts/interactiveArtifact';

export function InteractiveArtifactView({
  controls,
  target,
  authorityRef,
  onIntent,
}: {
  controls: InteractiveArtifactControl[];
  target: TargetParityTruth;
  authorityRef?: string;
  onIntent?: (intent: ArtifactUiIntent) => void;
}) {
  return (
    <section aria-label="Interactive artifact controls" data-testid="vx-interactive-artifact">
      <h2>Artifact Controls</h2>
      {controls.map((control) => (
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
                  artifactPreviewIntent(control, target, Number(event.currentTarget.value)),
                )}
              />
            ) : null}
          </label>
          <button
            type="button"
            disabled={!artifactCommitIntent(control, target, authorityRef).canPrepare}
            onClick={() => onIntent?.(artifactCommitIntent(control, target, authorityRef))}
          >
            {control.class === 'RED' ? 'Preparar solicitud' : 'Aplicar a borrador'}
          </button>
        </div>
      ))}
    </section>
  );
}

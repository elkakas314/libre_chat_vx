import React from 'react';
import type { NativeSurfaceBindingDescriptor } from '../librechat/nativeSurfaceBinding';

export function NativeSurfaceStatusView({
  bindings,
}: {
  bindings: readonly NativeSurfaceBindingDescriptor[];
}) {
  return (
    <section aria-label="Native LibreChat surfaces" data-testid="vx-native-surfaces">
      <h2>Native LibreChat Surfaces</h2>
      <ul>
        {bindings.map((binding) => (
          <li key={binding.surface}>
            <strong>{binding.surface}</strong>
            <span> mode:{binding.mode}</span>
            <span> source:{binding.state}</span>
            <span> runtime:UNVERIFIED</span>
            <span> authority:false</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

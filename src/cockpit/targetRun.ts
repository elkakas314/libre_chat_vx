import type { TargetParityContract } from '../adapters/targetParity';

export interface TargetRunStageObservation {
  stage: string;
  state: 'NOT_OBSERVED' | 'OBSERVED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN_OUTCOME';
  evidenceRef?: string;
}

export interface TargetRunProjection {
  runRef?: string;
  target: TargetParityContract;
  stages: TargetRunStageObservation[];
}

export function executedRunStages(run: TargetRunProjection): TargetRunStageObservation[] {
  return run.stages.filter((stage) => Boolean(stage.evidenceRef));
}

export function runClaimsMaterialCompletion(run: TargetRunProjection): boolean {
  const final = run.stages[run.stages.length - 1];
  return Boolean(
    final &&
    final.state === 'SUCCEEDED' &&
    final.evidenceRef &&
    run.target.receiptRequiredForEffects &&
    run.target.verificationRequiredForEffects,
  );
}

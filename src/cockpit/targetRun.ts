import type { ConcreteTargetId } from './systemTarget';

export interface TargetRunStageObservation {
  stage: string;
  state: 'NOT_OBSERVED' | 'OBSERVED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN_OUTCOME';
  evidenceRef?: string;
}

export interface MaterialCompletionProof {
  readbackRef: string;
  verificationRef: string;
  receiptRef: string;
}

export interface TargetRunProjection {
  runRef?: string;
  targetId: ConcreteTargetId;
  executionChain: readonly string[];
  state: 'NOT_STARTED' | 'QUEUED' | 'RUNNING' | 'WAITING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN_OUTCOME';
  stages: TargetRunStageObservation[];
  proof?: Partial<MaterialCompletionProof>;
}

export function executedRunStages(run: TargetRunProjection): TargetRunStageObservation[] {
  return run.stages.filter((stage) => Boolean(stage.evidenceRef));
}

export function runClaimsMaterialCompletion(run: TargetRunProjection): boolean {
  return Boolean(
    run.state === 'SUCCEEDED' &&
    run.proof?.readbackRef &&
    run.proof.verificationRef &&
    run.proof.receiptRef,
  );
}

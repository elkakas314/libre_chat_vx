export type PlanNodeState = 'PLAN_CREATED' | 'EXECUTION_SCHEDULED' | 'MATERIAL_VERIFIED';

export function isMaterial(state: PlanNodeState): boolean {
  return state === 'MATERIAL_VERIFIED';
}

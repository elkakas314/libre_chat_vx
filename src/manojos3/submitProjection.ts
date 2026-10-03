export type RiskCeiling = 'R0' | 'R1' | 'R2' | 'R3';

export interface Manojos3SubmitArgs {
  objective: string;
  inputs?: Record<string, unknown>;
  success_criteria?: string[];
  risk_ceiling?: RiskCeiling;
  session_id?: string;
  thread_id?: string;
  request_id?: string;
}

export interface Manojos3RunHandle {
  runId: string;
  nextReadTool: 'manojos_run';
}

export function buildManojos3SubmitArgs(
  objective: string,
  options: Omit<Manojos3SubmitArgs,'objective'> = {},
): Manojos3SubmitArgs {
  const normalized=objective.trim();
  if (!normalized) throw new Error('OBJECTIVE_REQUIRED');
  return {
    objective:normalized,
    inputs:{ ...(options.inputs ?? {}) },
    success_criteria:[ ...(options.success_criteria ?? []) ],
    risk_ceiling:options.risk_ceiling ?? 'R1',
    session_id:options.session_id,
    thread_id:options.thread_id,
    request_id:options.request_id,
  };
}

export const MANOJOS3_MCP_LIFECYCLE = [
  'manojos_status',
  'manojos_capabilities',
  'manojos_skills',
  'manojos_attach_optional',
  'manojos_submit',
  'manojos_run',
  'manojos_authorization_requirement_if_any',
  'manojos_resume_or_advance_if_allowed',
  'manojos_receipt',
] as const;

export function libreChatShouldCallControlPlaneDirectly(): false {
  return false;
}

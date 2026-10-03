export type MissingSlotClass =
  | 'TECHNICAL_MISSING_SLOT'
  | 'SEMANTIC_MISSING_SLOT'
  | 'RISK_CONFIRMATION';

export const MANOJOS3_GPT_BOOTSTRAP = [
  'manojos_gpt_migration_profile',
  'manojos_status',
  'manojos_capabilities',
  'manojos_skills',
  'manojos_attach_optional',
] as const;

export const MANOJOS3_OBJECTIVE_LIFECYCLE = [
  'manojos_submit',
  'manojos_run',
  'manojos_authorization_requirement_if_any',
  'manojos_authorization_read_if_any',
  'manojos_resume_or_advance_if_allowed',
  'manojos_run',
  'manojos_receipt',
] as const;

export const MANOJOS3_GPT_SEMANTIC_RULES = [
  'BOOTSTRAP_IS_READ_ONLY_NO_SUBMIT_FOR_CONTEXT',
  'NATURAL_OBJECTIVE_IS_PRIMARY_INPUT',
  'CAPABILITIES_ARE_INTERNAL_DRIVERS',
  'TECHNICAL_SLOTS_MUST_BE_INFERRED_OR_RESOLVED_WHEN_POSSIBLE',
  'ASK_USER_ONLY_FOR_TRUE_SEMANTIC_GAP_RISK_GATE_OR_IRRECOVERABLE_DECISION',
  'MCP_TRANSPORT_HAS_NO_AUTHORITY',
  'READ_LIVE_GRANT_INTERFACE_BEFORE_AUTHORIZATION_ASSUMPTIONS',
  'SUCCESS_REQUIRES_VERIFIED_RECEIPT_AND_CURRENT_EVIDENCE',
  'UNKNOWN_OR_AMBIGUOUS_EFFECT_REQUIRES_READBACK_BEFORE_RETRY',
  'LIVE_OWNER_BLOCKS_ONLY_ITS_SCOPE_NOT_THE_WHOLE_PROJECT',
  'DO_NOT_REBUILD_KERNEL_GOVERNOR_TOOLBUS_MCP_OR_SEMANTIC_CORE',
] as const;

export function shouldAskUserForMissingSlot(kind: MissingSlotClass): boolean {
  return kind === 'SEMANTIC_MISSING_SLOT' || kind === 'RISK_CONFIRMATION';
}

export function shouldSubmitObjectiveForContextOnly(): false {
  return false;
}

export function capabilityIdIsHumanFacingPrimaryRoute(): false {
  return false;
}

export function acceptMaterialSuccess(
  verifiedReceipt: boolean,
  currentEvidence: boolean,
  readbackPresent: boolean,
): boolean {
  return verifiedReceipt && currentEvidence && readbackPresent;
}

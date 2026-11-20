import {
  dispatchGovernedObjective,
  type GovernedExecutionInput,
  type GovernedExecutionResult,
} from '../cockpit/governedMcpDispatch';

/**
 * Native host entry for an already agreed contract.
 * The host binds `transport` to the existing MCP connection; this module
 * never creates a second MCP, queue or task manager.
 */
export function executeNativeAgreedObjective(
  input: GovernedExecutionInput,
): Promise<GovernedExecutionResult> {
  return dispatchGovernedObjective(input);
}
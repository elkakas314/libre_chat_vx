import type { ToolProjection } from '../cockpit/targetToolGate';
import { exposeTool } from '../cockpit/targetToolGate';

export interface NativeAccessProjection {
  nativeAllowed: boolean;
  targetTool?: ToolProjection;
}

export function nativeSurfaceVisible(access: NativeAccessProjection): boolean {
  return access.nativeAllowed;
}

export function targetToolActionEnabled(access: NativeAccessProjection): boolean {
  return Boolean(
    access.nativeAllowed &&
    access.targetTool &&
    exposeTool(access.targetTool),
  );
}

// Native LibreChat ACL and target capability/ACL/binding are conjunctive.
// A native permission never bypasses the target gate.

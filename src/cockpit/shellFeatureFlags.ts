export interface ShellFeatureFlags {
  hudEnabled: boolean;
  cockpitEnabled: boolean;
  domainViewsEnabled: boolean;
}

export function effectiveShell(flags: ShellFeatureFlags): 'UPSTREAM_CHAT' | 'LIBRECHAT_VX_COCKPIT' {
  return flags.hudEnabled || flags.cockpitEnabled || flags.domainViewsEnabled
    ? 'LIBRECHAT_VX_COCKPIT'
    : 'UPSTREAM_CHAT';
}

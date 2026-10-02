# LibreChat VX overlay

The overlay uses the existing LibreChat application. It does not create a second frontend.

Rules:
- reuse native approval, MCP UI, files, speech and permission surfaces;
- use a feature-flagged shared side-panel insertion;
- keep the default upstream UI unchanged when the feature flag is off;
- never put target secrets or authority in the browser;
- fail closed when the upstream commit or known blob does not match.

Commands:
- npm run verify:upstream
- npm run overlay:install
- npm run overlay:uninstall

The install command copies this package into the pinned upstream workspace and applies only the guarded bridge patch. It does not enable target mutations.

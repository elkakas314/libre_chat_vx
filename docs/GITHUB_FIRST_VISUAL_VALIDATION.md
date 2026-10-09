# GitHub-first: visual SOURCE gate

Objective: prepare and test LibreChat VX on GitHub; defer host installation and LIVE canaries to a separate MANOJOS3-governed deployment phase.

The source-check workflow runs a dedicated Chromium browser smoke test using real React SOURCE components, bundled in a synthetic isolated page (not a deployed LibreChat instance).

Checks:
- Desktop 1280x900 and mobile 390x844 screenshots.
- SOURCE_ONLY is visible; two target identities remain distinct.
- Scope buttons interact: AUTO to BOTH. This is only a read/view selection.
- No material EXECUTE action can be prepared for BOTH.
- Tentaculo authority=false, no uncaught browser exceptions, and no page horizontal overflow.
- Evidence: visual-proof.json plus desktop.png and mobile.png, attached to GitHub Actions.

A PASS in this workflow establishes only SOURCE React browser rendering and interaction of the fixture. It does not establish production LibreChat frontend E2E, upstream native panel priority in runtime, accessibility conformance, native login/ACL, target binding, inference, chat, mobile reconnect, host CPU/RAM, or visual design acceptance by a human.

The screenshot fixture has simple test-only CSS; this is NOT the final product skin. Review the screenshots before considering the UX design approved. Remaining visual closure needs actual upstream-mounted interactive E2E on CI, accessibility audit, design review and mobile behavior. Avoid claims of full visual product completion.

No active_live gate in SPEC.json is closed by this test. No host, credentials, accounts, MANOJOS3, or VX13 accessed or modified.

Product styling: overlay/upstream/VXCockpit.css is imported by VXCockpitBridge and copied into upstream by the reversible overlay installer. The fixture loads this same scoped CSS for visual-regression inspection. The synthetic page wrapper remains test-only; actual upstream panel integration E2E and user UX sign-off are still separate gates.

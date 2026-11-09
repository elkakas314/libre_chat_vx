# LibreChat VX — Tailscale Serve profile

Status: SOURCE TEMPLATE / NOT APPLIED.

Purpose: private access to the LibreChat VX web service from devices/users allowed by the tailnet ACL.

Target:

```text
http://127.0.0.1:3080
```

Intended command shape, after checking the installed Tailscale version and current Serve syntax:

```bash
tailscale serve --bg http://127.0.0.1:3080
```

Rules:

- use **Serve**, not Funnel, for the baseline private path;
- do not reuse any existing MANOJOS3 Serve/Funnel configuration;
- inspect current Serve state before applying;
- if the host already has unrelated Serve config, use an isolated service/config strategy rather than resetting it;
- ACLs remain authoritative for tailnet access;
- Funnel stays OFF for the LibreChat VX baseline;
- this transport has no execution authority.

No command in this document has been executed.

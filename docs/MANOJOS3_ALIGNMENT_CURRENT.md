# LibreChat VX alignment with MANOJOS3 — CURRENT

Observed MANOJOS3 source reference: `elkakas314/manojos3@5e13e29772b5eee97376ddfba7b9bd2ba2dadff2`.

Observed current capability matrix: 134 capabilities.

Category counts observed from `docs/MANOJOS3_CAPABILITY_MATRIX_CURRENT.json`:

- browser 18
- process 4
- cli_registry 2
- observability 13
- networking 4
- connectors 30
- construction 7
- git 10
- librechat 2
- models 6
- system 10
- mcp 2
- mcp_toolbus 2
- openai_plugin 1
- coding 2
- external_advisory 4
- remote_desktop 2
- filesystem 2
- service 2
- state 4
- threads 7

Risk distribution observed: R0=78, R1=16, R2=34, R3=6.

LibreChat does not render 134 raw actions. It projects bounded lenses:

`BROWSER | RUNTIME | CONNECTORS_FILES | BUILD | REPO | LIBRECHAT | MODELS | TOOLBUS_MCP | THREADS | HOST | STATE_EVIDENCE`

A concrete tool/action is exposed only if live registry, ACL and target binding admit it.

MANOJOS3 authority remains:

`Governor → Policy → Kernel → Adapter → Readback → Verifier → Receipt`

LibreChat/Tentáculo is presentation/control intent only.

MANOJOS3 already defines a LibreChat adapter with:

- `librechat.thread.read` R0
- `librechat.message.send` R2

and deliberately keeps it UNCONFIGURED without a real binding. LibreChat follows the same fail-closed rule in the opposite direction.

## Shared HUD

The same visual HUD can move to VX13 or MANOJOS3 because it consumes the TargetParityContract, not target internals. Each target retains its own execution chain and authority owner.

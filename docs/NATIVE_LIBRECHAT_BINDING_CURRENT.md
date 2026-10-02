# Native LibreChat binding plan — CURRENT

The VX cockpit must be attached to existing LibreChat surfaces, not rebuilt as another application.

## Native reuse map

- Agent Builder / Model Specs → persona and capability container.
- Artifacts → React/HTML/SVG/Markdown/Mermaid interactive view.
- MCP UI Resource renderer → trusted visual resource base.
- Tool Approval / ApprovalContext → DecisionInbox integration.
- SidePanel / Chat Presentation → Nostromo host.
- Skills → read-only cockpit behavior packages.
- Subagents → cognitive child activity only; never Spawner/hijas.
- Background Tool Calls → background task presentation.
- Files panel / File Context / File Search → FilesView and knowledge.
- Speech → voice input/presentation only.
- Resumable Streams → device/tab/reconnect continuity.
- ACL → access truth; privacy display never replaces it.

## Overlay rule

The feature flag must leave standard LibreChat usable when disabled.

`localStorage['librechat-vx-cockpit'] = '1'` is currently only a source-level development toggle. Production admission must use a server-owned/configurable feature gate, not client localStorage as authority.

## Skills

Three deployment skills are now provided:

- `vx13-nostromo`
- `manojos3-nostromo`
- `cross-target-read`

They are instruction bundles and grant no capability or authority.

## Agent Plugin

`plugins/vx-nostromo` is an experimental package skeleton containing read-only skills only. MCP and command hooks are deliberately absent until a real binding and policy are admitted.

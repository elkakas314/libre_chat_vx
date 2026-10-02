# Official LibreChat reuse/download catalog — CURRENT

Research date: 2026-10-03.

## Built into LibreChat upstream — reuse, do not duplicate

- Agents and Agent Builder.
- Artifacts / Generative UI: React, HTML, SVG, Markdown, Mermaid; agent modes Normal, shadcn/ui and Custom.
- MCP plus runtime MCP Settings.
- MCP UI resources / sandboxed HTML renderer.
- Tool Approval / human approval flow.
- Skills with SKILL.md; deployment skills can come from filesystem and can be mirrored from GitHub.
- Subagents and detached child task activity.
- Background tool calls.
- Resumable streams for reconnect/tab/device continuation.
- Files, File Context, File Search and RAG integration.
- Speech/STT/TTS surfaces.
- ACL/permissions and authentication.
- Web Search, OCR, Memory and Custom Endpoints.

## Official downloadable companion repositories

| Repository | Purpose | LibreChat VX decision |
|---|---|---|
| `LibreChat-AI/LibreChat` | Main web application | PINNED upstream; integrate by minimal overlay |
| `LibreChat-AI/rag-api` | FastAPI + PostgreSQL/pgvector document RAG | CANDIDATE; optional Files/knowledge backend |
| `LibreChat-AI/code-interpreter` | Sandboxed code execution API | CANDIDATE; keep separate from MANOJOS3/OpenCode authority |
| `LibreChat-AI/admin-panel` | Standalone config/permissions administration | CANDIDATE; admin-only, not cockpit authority |
| `LibreChat-AI/librechat-config-yaml` | Example/config collection | REFERENCE_ONLY; borrow config patterns, never secrets |

All five were confirmed as public, non-archived repositories in the official LibreChat-AI GitHub organization on 2026-10-03.

## Official extension/package mechanisms

### Agent Plugins (experimental)

A startup-loaded package can bundle:
- read-only deployment Skills;
- MCP servers;
- optional trusted command hooks.

Decision for VX: useful packaging format for read-only Skills + MCP descriptors. Command hooks remain disabled by default and are not a replacement for Madre or MANOJOS3 Policy/Kernel.

### Deployment Skills

Use `DEPLOYMENT_SKILLS_DIR` for read-only, versioned VX/MANOJOS3 skills. A Skill is instruction/data, not authority.

### MCP

Use MCP Settings or `librechat.yaml` to register governed read/action surfaces. Third-party MCP catalogs such as Smithery are discovery sources only; no server is admitted automatically.

## External services bundled/expected by common LibreChat deployments

- MongoDB: application persistence.
- Meilisearch: conversation/message search.
- RAG API + PostgreSQL/pgvector: optional file retrieval.
- Redis: optional resumable-stream backend for scaled deployments.
- Sandpack bundler: Artifacts rendering dependency; may be self-hosted for privacy.

These are infrastructure, not VX13/MANOJOS3 authority modules.

## Rule

Before creating any new LibreChat VX component, check in this order:

1. native LibreChat surface;
2. official companion repository;
3. Agent Plugin / Skill / MCP extension;
4. minimal feature-flagged overlay;
5. only then a new custom component.

No downloaded component becomes LIVE or authorized merely by being installed.

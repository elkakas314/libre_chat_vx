# LIBRECHAT INSTALLATION AND OPTIONS — CURRENT

## Purpose

Document the options LibreChat already provides before adding custom infrastructure. This file is a decision catalog, not a mandate to install everything.

## Installation methods

### Docker Compose — official default candidate

LibreChat recommends Docker Compose for most local installs.

Typical bundled stack:
- LibreChat API/web;
- MongoDB;
- MeiliSearch;
- RAG API;
- vector storage dependencies.

VX decision:
- primary reproducible deployment candidate;
- must be benchmarked on the Lenovo before final promotion because convenience is not the same as low resource use.

### npm — low-overhead candidate

Runs LibreChat directly on Node.js and requires external MongoDB and any other services that are needed.

VX decision:
- candidate for the single-host Lenovo if measurements show lower RAM/CPU and acceptable maintenance;
- not promoted merely because it has fewer containers.

### Helm — documented, not baseline

For Kubernetes.
Not justified for the current single Lenovo unless the deployment topology changes.

### Remote hosting — documented, not baseline

LibreChat documents remote hosts. VX currently prefers local ownership/zero-cost where possible.

## Native capabilities to configure before building

- Agents / Agent Builder.
- Agent Chains when useful.
- Subagents.
- Skills.
- GitHub Skill Sync.
- Agent Plugins (experimental).
- MCP / MCP UI.
- Actions / OpenAPI.
- Files / File Context / RAG.
- Artifacts.
- Web Search.
- Speech.
- Resumable streams.
- ACL/Admin configuration.
- SidePanel.
- Model Specs.
- Remote Agents / Agents API / Agent Events.
- Custom Endpoints.
- Memory.
- Code Interpreter as an optional LibreChat feature, not target authority.

## Resumable streams

Single LibreChat instance:
- built-in in-memory resumable stream backend is sufficient;
- Redis is not required only to move between PC and mobile.

Multiple replicas / horizontal scale:
- shared Redis-backed streams become relevant.

## Official companion repositories already catalogued

- LibreChat-AI/LibreChat — main application.
- LibreChat-AI/rag-api — optional document RAG backend.
- LibreChat-AI/code-interpreter — optional sandboxed code execution.
- LibreChat-AI/admin-panel — optional administration surface.
- LibreChat-AI/librechat-config-yaml — reference configuration.

Installing a companion repository does not make it part of NOSTROMO automatically. It must pass extension/admission rules and its own gates.

## Deployment decision still open

Final host shape remains a measured choice:
- Docker Compose baseline candidate;
- npm single-process alternative;
- no Helm/cluster unless topology requires it.

Closeout requires actual Lenovo measurements: idle RAM/CPU, active conversation, streaming, Files/RAG, mobile reconnect and optional services.

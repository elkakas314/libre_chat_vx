# LibreChat AgentContext compatibility patch

The installed `@librechat/agents@4.0.1` event-driven binding path appends instance tools even when the registry marks them deferred. This overcounts their schemas in context preflight and can bind deferred instances directly. The patch routes registered instances through the existing caller/defer/discovery filter; unregistered native tools remain intact, and the full registry remains available for discovery.

`deferred-instance-filter.mjs` is dependency-free, version-guarded, exact-context, idempotent, and supports read-only preflight by omitting `--apply`. It patches the installed CJS and ESM runtime files and their TypeScript source. It fails closed if package identity or source context changes. Before applying to a live package, preserve exact preimages and verify rollback.

```sh
node deployment/librechat-agents/deferred-instance-filter.mjs --package-root /path/to/node_modules/@librechat/agents
node deployment/librechat-agents/deferred-instance-filter.mjs --apply --package-root /path/to/node_modules/@librechat/agents
```

The exact installed package patch must be applied before backend startup; no catalog entries are removed from the persisted agent. The regression test uses isolated fixtures and no added dependencies.

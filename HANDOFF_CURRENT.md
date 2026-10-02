# HANDOFF CURRENT

## Estado
`NOSTROMO_NATIVE_BINDING_SOURCE_COMPLETE`

## Implementado en source

- TargetParity VX13 ↔ MANOJOS3.
- Tentáculo HUD portable VX13/MANOJOS3/BOTH/AUTO.
- foco automático + ventanas vivas.
- MinimalTruth + ContextInspector.
- mandos GREEN/YELLOW/RED sin efecto directo.
- Artifacts interactivos gobernados.
- capability lenses alineadas con 134 capabilities MANOJOS3.
- TargetRun común.
- Files, SHUB Audio, Browser, Build, BackgroundTasks.
- native LibreChat surface map.
- model-spec/config example.
- deployment Skills: VX13, MANOJOS3, cross-target-read.
- experimental Agent Plugin skeleton read-only.
- upstream bridge now renders NostromoCockpit instead of SourceOnlyCockpit.

## Materialidad

Último commit probado en Lenovo: `94c632762f7afee7d9fa9d0f0c23c80d7494d2d2` con 26 tests PASS.

Los commits posteriores se han desarrollado sólo en GitHub por instrucción explícita de no tocar local:
- source tests = NOT_RUN;
- overlay runtime = NO_VERIFICADO;
- VX13 runtime = DESIGN_CONSOLIDATION;
- MANOJOS3 LibreChat binding = PREPARED_UNCONFIGURED.

## Reutilizar antes de crear

Agents, Artifacts, MCP/MCP UI, ToolApproval, Skills, Subagents, Background Tool Calls, Files/RAG, Speech, resumable streams, ACL and SidePanel are native LibreChat surfaces.

Official companion repos catalogued:
LibreChat, rag-api, code-interpreter, admin-panel, librechat-config-yaml.

## Siguiente

Sync Drive, then continue source-only refinement of native adapters/contracts without local mutation.

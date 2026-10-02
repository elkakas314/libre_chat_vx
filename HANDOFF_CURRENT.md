# HANDOFF CURRENT

## Estado
`NOSTROMO_SOURCE_IMPLEMENTED_TARGET_PARITY_ALIGNED`

## Implementado en source

- 120 requisitos canónicos y cobertura semántica completa.
- TargetParity VX13 ↔ MANOJOS3 con autoridad separada.
- Tentáculo HUD portable entre VX13/MANOJOS3/BOTH/AUTO.
- foco automático y ventanas vivas.
- MinimalTruth + ContextInspector.
- mandos GREEN/YELLOW/RED sin efecto directo.
- Artifacts interactivos: buttons/sliders/knobs/decision/authorization → UiIntent gobernado.
- capability lenses alineadas con las 134 capabilities observadas de MANOJOS3.
- TargetRun común con cadenas internas distintas.
- Files, SHUB Audio, Browser, Build y BackgroundTasks panels.
- catálogo de reutilización nativa y repos oficiales LibreChat.

## Materialidad

Último commit probado materialmente en Lenovo: `94c632762f7afee7d9fa9d0f0c23c80d7494d2d2` con 26 tests PASS.

Los cambios posteriores de este HEAD son GitHub-only por instrucción del usuario de no tocar local. Por tanto:
- current source tests = NOT_RUN;
- LibreChat runtime = NO_VERIFICADO;
- VX13 runtime = DESIGN_CONSOLIDATION;
- MANOJOS3 LibreChat binding = PREPARED_UNCONFIGURED.

## Reutilizar antes de crear

Agents, Artifacts, MCP/MCP UI, ToolApproval, Skills, Subagents, Background Tool Calls, Files/RAG, Speech, resumable streams, ACL and SidePanel are native LibreChat surfaces.

## Próximo bloque

Refinar el overlay para enchufar Nostromo a superficies nativas sin instalar nada local; después revisión/source tests cuando el usuario vuelva a permitir ejecución local.

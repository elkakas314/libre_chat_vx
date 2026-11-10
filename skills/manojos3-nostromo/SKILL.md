---
name: manojos3-nostromo
description: MANOJOS3 cockpit behavior for LibreChat, aligned to its live capability registry, Policy/Kernel authority, receipts and evidence.
---

# MANOJOS3 Nostromo

## Purpose

Project MANOJOS3 through the same cockpit grammar used by VX13 while preserving its own runtime and authority.

## Rules

- Authority chain: Governor → Policy → Kernel → Adapter → Readback → Verifier → Receipt.
- LibreChat is not Policy, Kernel, Adapter or Verifier.
- Bootstrap context through read-only health/readiness/self/capabilities/skills.
- Group the capability catalog into bounded lenses instead of exposing raw tool sprawl.
- A capability is actionable only when live registry + ACL + binding admit it.
- R2/R3 risk remains visible even when operator-mode policy permits execution.
- Receipt/evidence state is distinct from conversation text and task animation.
- ORÁCULO remains advisory/non-authoritative unless separately admitted by MANOJOS3 policy.


## Operación gobernada del host — NOSTROMO 2026-11-10

Cuando el usuario pida «conéctate a MANOJOS», «diagnostica el Lenovo» o
«repara MANOJOS», distinguir dos MCP **ya existentes**; no abrir un tercero:

1. **MANOJOS3** por `MANOJOS3_MCP_URL`: `manojos_status`,
   `manojos_capabilities`, `manojos_skills`, `manojos_run`,
   `manojos_authorization_requirement`, `manojos_receipt`;
   `manojos_submit` sólo si hay una operación real, con riesgo gobernado
   en Policy/Kernel. No crear run para adquirir contexto.
2. **HOST_CONTROL** por `HOST_CONTROL_MCP_URL`, independiente de
   SQLite/Kernel y normalmente en 127.0.0.1:8791/mcp.
   Usar `host_status`, `host_listener_status`,
   `host_service_status` y `host_git_status` (R0) sólo tras
   autenticar origen local o mTLS y validar rutas/unidades en allowlist
   de configuración del servidor LibreChat.

**Recuperación R2**: el único efecto inicialmente visible por el adaptador
de NOSTROMO es `host_service_restart` para una unidad admitida.
Antes de invocarlo se exige un grant local preexistente de HOST_CONTROL,
exacto para `host_service_restart`, unidad/riesgo/solicitud y tiempo,
consumible una vez. No crear grants desde el agente ni sustituirlos con
ToolApproval, mensaje del usuario, operador automático u OAuth ChatGPT.
La propia operación HOST_CONTROL debe validar y consumir el grant.

**Después**: lectura fresca de `host_service_status` y comprobaciones
MANOJOS3 health/readiness/self/Registry/recibos. El adaptador retorna
`RECONCILE_REQUIRED`, nunca inventa `MATERIAL_VERIFIED` por HTTP 200,
`ActiveState=active` o por una respuesta del servidor. Si hay error después
de posible efecto, `UNKNOWN_OUTCOME` y lectura, **sin reintento automático**.

**No exponer al modelo**: `host_exec` arbitrario, scripts, kill, delete,
secretos, token, grants, operaciones R3, credenciales de mTLS, acceso a
portapapeles/teclado, Remote Desktop, instalación ni cambios de reglas de red.
Para tareas host más amplias, solicitar una extensión auditada y acceso
local del operador; HOST_CONTROL no es un Remote Desktop gráfico.

El servidor LibreChat y el host pueden estar apagados o desconectados.
Una Skill instalada no es una conexión real; `CONFIGURED`, `LIVE`
y `VERIFIED` requieren estado del MCP y recibos. Usar el puente
`src/host/hostControlBridge.ts` **sólo en backend confiable**, nunca
importarlo en React/Artifact. Configuración candidata:
`config/host_recovery.current.json` (disabled por defecto).

# Crosswalk SOURCE — LibreChat VX ↔ MANOJOS3

**Estado:** propuesta técnica; lectura de SOURCE, **NO_DEPLOYMENT_EVIDENCE**, sin binding LIVE ni autoridad de LibreChat sobre MANOJOS3. **Canon independiente:** los hallazgos de MANOJOS3 no se importan como `SPEC.json#/discrepancias_abiertas` de LibreChat.
**MANOJOS3:** `elkakas314/manojos3`, `main`, git_commit_sha `87444678ad4de2f197039ae989f058f87a02cc0e`. **LibreChat VX (base analizada):** `elkakas314/libre_chat_vx`, git_commit_sha `20c3fe2f1a127a6673234c09d2c0a47e338f4450`. El documento se versiona en la rama `vx-block1-manojos3-binding` (PR #4), por lo que todavía **no pertenece a la rama base**. Todos los hashes de archivos de este anexo son **git_blob_sha**, no SHA-256.

## 1. Crosswalk B — seis filas

| # / Qué espera LibreChat VX (JSON Pointer y contrato cuando aplica) | Qué expone MANOJOS3 (ruta SOURCE + git_blob_sha) | Coincidencia | Tratamiento y alcance |
|---|---|---|---|
| **1. Binding R0.** `SPEC.json#/integraciones/10`, `SPEC.json#/backlog/target_later/0`, `contracts/manojos3-entrypoint.schema.json#/properties/kind`. Self, capabilities, run, receipt sin apropiarse de autoridad. | `src/manojos3/server.py` — `e3ffa9ae2eef4b1914c45db84de52c7654b5b18e`: GET `/v1/self`, `/v1/capability-index`, `/v1/runs/{run_id}`, `/v1/receipts/{execution_id}`. `src/manojos3/mcp_gateway.py` — `ac1950197d647a9f2191da5a68417cfe6d83f79b`: `manojos_status`, `manojos_capabilities`, `manojos_run`, `manojos_receipt`. | **PARCIAL** | **Adaptar LibreChat**: desempaquetar `data`, convertir índice de IDs a proyección solo cuando exista metadato suficiente. **bloqueante: sí** (binding R0 completo); **entra_en_block1: sí** (revisión contrato); **entra_en_block_binding: sí**. `LC-M3-GAP-002`. |
| **2. Eventos.** `SPEC.json#/requisitos/funcionales/7` (**FR-08**), `SPEC.json#/backend/eventos/0`, `SPEC.json#/backlog/active_live/4` (**LC-AGENT-EVENTS-LIVE**). | `src/manojos3/state.py` — `704a2ecb918c6c416fcdd2af43a480f72e86e9fe`: `event()`, `events_by_kind()`, almacenamiento SQLite; `src/manojos3/runtime.py` — `24690c6e855837fa81134c7594681ac06c92445c`: emite eventos. `src/manojos3/server.py` — `e3ffa9ae2eef4b1914c45db84de52c7654b5b18e` y `src/manojos3/mcp_gateway.py` — `ac1950197d647a9f2191da5a68417cfe6d83f79b`: **no exponen** `/v1/events` ni suscripción específica en las interfaces examinadas. | **AUSENTE** (entrega externa SOURCE) | **Esperar MANOJOS3** o mecanismo equivalente y **adaptar LibreChat** en una fase posterior. Sin inventar endpoint. **bloqueante: sí** (FR-08 para MANOJOS3); **entra_en_block1: no**; **entra_en_block_binding: sí**. `LC-M3-GAP-001`. |
| **3. Autenticación.** `SPEC.json#/seguridad/auth`, `SPEC.json#/seguridad/autorizacion`, `SPEC.json#/configuracion/env` (entrada `MANOJOS3_MCP_URL`), `SPEC.json#/integraciones/10`. | `src/manojos3/server.py` — `e3ffa9ae2eef4b1914c45db84de52c7654b5b18e` lee `X-Manojos-Token` como valor crudo para rutas protegidas; `src/manojos3/mcp_gateway.py` — `ac1950197d647a9f2191da5a68417cfe6d83f79b` líneas 45–65 envía el header en llamadas MCP→Control Plane con `auth=True`. Autenticación **externa MCP** no documentada de forma completa en esas fuentes. | **PARCIAL** | **Adaptar LibreChat** con conexión de confianza/secretos runtime, sin confundir auth de usuario, token HTTP ni autorización material. **bloqueante: sí** para R0 protegido; **entra_en_block1: no**; **entra_en_block_binding: sí**. `LC-M3-GAP-003`. |
| **4. Skills.** `SPEC.json#/integraciones/7`, Skill Sync GitHub de LibreChat (fuente `config/librechat-vx.example.yaml` git_blob_sha `a5738a3bf2da5db54beae370145691adf80784f7`). | GET `/v1/skills` en `src/manojos3/server.py` — `e3ffa9ae2eef4b1914c45db84de52c7654b5b18e`; `src/manojos3/runtime.py` — `24690c6e855837fa81134c7594681ac06c92445c`, `skill_index()` líneas 675–681; herramienta `manojos_skills` en `src/manojos3/mcp_gateway.py` — `ac1950197d647a9f2191da5a68417cfe6d83f79b`. | **PARCIAL** (funciones diferentes, compatibles) | **Adaptar LibreChat** para mostrar catálogo target sin sincronizarlo como Skills propias ni transferir autoridad. **bloqueante: no**; **entra_en_block1: no**; **entra_en_block_binding: sí** (catálogo de lectura). No es gap independiente. |
| **5. MCP attach + run.** `SPEC.json#/integraciones/10`, `contracts/manojos3-entrypoint.schema.json#/properties/kind` (`ACTION_MCP`; clasificación, no contrato de payload). | `manojos_attach` y `manojos_run` en `src/manojos3/mcp_gateway.py` — `ac1950197d647a9f2191da5a68417cfe6d83f79b`; `attach` usa POST `/v1/controller/attach`, que llama `threads.handoff.read` mediante Kernel en `src/manojos3/runtime.py` — `24690c6e855837fa81134c7594681ac06c92445c` líneas 630–671. `run` lee GET `/v1/runs/{run_id}`. | **PARCIAL** | **Adaptar LibreChat** separando una lectura de run de un attach administrativo gobernado; preservar readback. **bloqueante: no** para GET run; **entra_en_block1: sí** (contrato); **entra_en_block_binding: sí**. `LC-M3-GAP-004`. |
| **6. Control.** `SPEC.json#/seguridad/autorizacion`, `SPEC.json#/integraciones/10`. Mutaciones solo por target concreto y autorización target-owned; LibreChat no ejecuta materialmente por sí mismo. | `manojos_prepare`, `manojos_submit`, `manojos_resume`, `manojos_advance`, `manojos_pause`, `manojos_cancel` en `src/manojos3/mcp_gateway.py` — `ac1950197d647a9f2191da5a68417cfe6d83f79b`; rutas POST en `src/manojos3/server.py` — `e3ffa9ae2eef4b1914c45db84de52c7654b5b18e`. | **PARCIAL** (expuestas en SOURCE, integración material no iniciada) | **Esperar fase material MANOJOS3**; declaración `NO_USADO_EN_SOURCE`. **bloqueante: no** para SOURCE/R0; **entra_en_block1: sí** solo delimitación contractual; **entra_en_block_binding: no** (binding R0). No usar `prepare` como lectura inocua: persiste run/plan. |

**Clasificación del crosswalk:** 5 × `PARCIAL`, 1 × `AUSENTE`. Es una clasificación de contrato SOURCE, **no** de disponibilidad de despliegue.

## 2. Gaps concretos: LC-M3-GAP-001 a 004

| ID | Ubicación principal | Hecho | Impacto R0 / material | Responsable | Estado | Bloqueante |
|---|---|---|---|---|---|---|
| **LC-M3-GAP-001** | `SPEC.json#/backend/eventos/0`, `SPEC.json#/requisitos/funcionales/7`, `SPEC.json#/backlog/active_live/4` | Eventos persistidos internamente, sin entrega externa identificada (`/v1/events` o equivalente). Fuentes: `src/manojos3/state.py` blob `704a2ecb918c6c416fcdd2af43a480f72e86e9fe`; `server.py` blob `e3ffa9ae2eef4b1914c45db84de52c7654b5b18e`; `mcp_gateway.py` blob `ac1950197d647a9f2191da5a68417cfe6d83f79b`. | R0: no; FR-08 y `LC-AGENT-EVENTS-LIVE`: **sí**, bloqueados; material: no. | **Ambos**: MANOJOS3 confirmar mecanismo; LibreChat consumirlo. | **BLOQUEADO** | Sí |
| **LC-M3-GAP-002** | `SPEC.json#/integraciones/10`, `SPEC.json#/backlog/target_later/0`, `src/adapters/manojos3McpAdapter.ts#discoverCapabilities` | MCP envuelve un índice `groups` de IDs, no `TargetCapabilityProjection[]`; falta transformación y metadatos completos. Fuentes: `src/manojos3/registry.py` blob `de367c8e4b3fb8fce1d67e4f7c77804cca9398a9`, `src/manojos3/mcp_gateway.py` blob `ac1950197d647a9f2191da5a68417cfe6d83f79b`. | R0: sí, descubrimiento completo; material: no se habilita por transformación. | **LibreChat VX**; no modificar contratos MANOJOS3. | **PROPUESTA** (ADR-09) | Sí |
| **LC-M3-GAP-003** | `SPEC.json#/seguridad/auth`, `SPEC.json#/integraciones/10`, `SPEC.json#/configuracion/env` | Token crudo en HTTP interno; frontera de autenticación MCP externo y binding seguro de LibreChat pendientes de pruebas. Fuentes: `src/manojos3/server.py` blob `e3ffa9ae2eef4b1914c45db84de52c7654b5b18e`; `src/manojos3/mcp_gateway.py` blob `ac1950197d647a9f2191da5a68417cfe6d83f79b`. | R0 protegido: **sí**; material: autoridad sigue exclusivamente en MANOJOS3, no depende de suplantar grants. | **Ambos**, MANOJOS3 confirmar autenticación del perímetro; LibreChat enlazar de forma segura. | **PENDIENTE** | Sí |
| **LC-M3-GAP-004** | `SPEC.json#/integraciones/10`, `contracts/manojos3-entrypoint.schema.json#/properties/kind` | `attach` declarado read-only a nivel herramienta usa POST y Kernel para `threads.handoff.read`; `run` es lectura GET. Fuentes: `src/manojos3/mcp_gateway.py` blob `ac1950197d647a9f2191da5a68417cfe6d83f79b`; `src/manojos3/runtime.py` blob `24690c6e855837fa81134c7594681ac06c92445c`. | R0 directo: no; clasificación de attach: pendiente; material: no delegar. | **LibreChat VX** para semántica del adaptador; MANOJOS3 conserva autoridad. | **PROPUESTA** | No |

**Recuento:** **3 bloqueantes**, **1 no bloqueante**; son gaps del *binding/crosswalk*, **no** nuevas discrepancias bloqueantes del Bloque 1 de los doce esquemas.

**Persistencia del registro:** `SPEC.json#/backlog/deferred_external`. Los casos NO van a `SPEC.json#/discrepancias_abiertas`. No se crean gates LIVE nuevos. El anexo de deuda de MANOJOS3 está separado en `docs/observaciones-externas/OBSERVACIONES_MANOJOS3.md`.

## 3. Fixture SOURCE de respuesta MCP y normalización propuesta

El siguiente fixture es **SINTÉTICO** y se deriva de `src/manojos3/adapters/control_plane.py` (git_blob_sha `e8c7f5cd4cae5986382ec38a99662f0aced62e03`) y `src/manojos3/registry.py` (`de367c8e4b3fb8fce1d67e4f7c77804cca9398a9`). **No procede de GET/MCP LIVE**, no incluye revisión instalada ni observación verificable. El envoltorio `ok/http_status/data/authority/transport_is_authority` deriva de `src/manojos3/mcp_gateway.py` (`ac1950197d647a9f2191da5a68417cfe6d83f79b`).

```json
{
  "ok": true,
  "http_status": 200,
  "data": {
    "schema": "manojos3.capability-index.v1",
    "groups": {
      "by_provider": {"control_plane": ["control_plane.canary.full", "control_plane.status.full"]},
      "by_risk": {"R0": ["control_plane.status.full"], "R1": ["control_plane.canary.full"]},
      "by_effect": {"READ_ONLY": ["control_plane.status.full"], "EPHEMERAL": ["control_plane.canary.full"]},
      "by_availability": {"AVAILABLE": ["control_plane.status.full", "control_plane.canary.full"]}
    },
    "planning_candidates": ["control_plane.status.full", "control_plane.canary.full"],
    "inventory_only": []
  },
  "authority": false,
  "transport_is_authority": false
}
```

**Nota crítica sobre el fixture:** `by_availability`, `planning_candidates` e `inventory_only` están presentes por estructura del método; los **valores de esos arrays son supuestos del fixture**, no observaciones de un Registry real. `AVAILABLE` de la especificación no garantiza pertenencia a `planning_candidates`, ya que `_effective_available()` verifica requisitos adicionales (`src/manojos3/registry.py`, git_blob_sha `de367c8e4b3fb8fce1d67e4f7c77804cca9398a9`).

**Construcción exacta de grupos:** `src/manojos3/registry.py` líneas **117–120** declara `by_provider/by_risk/by_effect/by_availability`, líneas **128–131** inserta `spec.provider/spec.risk/effect/spec.availability` y línea **160** devuelve `groups`.

### Mapping campo por campo a `TargetCapabilityProjection`

Destino: `src/core/types.ts`, git_blob_sha `b8036c4f35fcae157d60a3ff4e898ae998e27829`. Transformador propuesto: `src/adapters/manojos3McpAdapter.ts#discoverCapabilities`, git_blob_sha `fb08050d12562fb909f255e0d5dbb803aac67848`.

| Campo destino | Regla de transformación SOURCE y requisito de evidencia |
|---|---|
| `targetId` | Constante de identidad del adaptador `MANOJOS3`, no un permiso. |
| `capabilityId` | ID literal del índice `data.groups`; rechazar inconsistencias entre grupos. |
| `risk` | Pertenencia única a `groups.by_risk`: R0/R1/R2/R3. |
| `effectClass` | Pertenencia única a `groups.by_effect`: READ_ONLY/EPHEMERAL/MATERIAL/DESTRUCTIVE, sin inventar efectos. |
| `availability` | `groups.by_availability`: AVAILABLE/UNCONFIGURED/BLOCKED, **no** evidencia de binding LIVE. |
| `policyAuthorityRef` | Referencia explícita a Policy de MANOJOS3 con procedencia de SOURCE; **no** autoridad concedida. Si no puede demostrarse, **no publicar** proyección completa. |
| `executionAuthorityRef` | Referencia a Kernel del target si está respaldada; opcional, sin ejecución. |
| `verificationAuthorityRef` | Referencia a Verifier del target si está respaldada; opcional, sin PASS implícito. |
| `requiredScopes` | Campos detallados de `CapabilitySpec` (p. ej., `write_scopes` y `coordination_scopes`) obtenidos de `GET /v1/capabilities` y verificados; **no inventar array vacío cuando se desconozcan**. `src/manojos3/models.py`, git_blob_sha `f2becc0e183e2844c20d88ec502169ab685068f4`. |
| `sourceRevision` | Revisión instalada/observada que venga de fuente válida; **no reemplazarla por HEAD remoto SOURCE**. |
| `observedAt` | Instante auténtico de observación del readback; **no inventar fecha al transformar una fixture**. |
| `evidenceRefs` | Referencias auténticas de lectura y recibos; no sintetizar recibos ni convertir `ok=true` en VERIFIED. |

### Test propuesto (PR #5 futura, no implementado)

**Archivos:** `src/adapters/manojos3McpAdapter.ts`, `tests/target-parity.test.ts`; alternativa: test específico si mejora aislamiento.

Fixture estático como el anterior, más `GET /v1/capabilities` simulada con metadatos detallados. Aserciones:

```ts
assert.equal(result.capabilityId, 'control_plane.status.full');
assert.equal(result.targetId, 'MANOJOS3');
assert.equal(result.risk, 'R0');
assert.equal(result.effectClass, 'READ_ONLY');
assert.equal(result.availability, 'AVAILABLE');
// Además: duplicados, grupos contradictorios, ausencia de scopes,
// sourceRevision, observedAt o evidenceRefs => fail-closed.
// Nunca convertir el resultado SOURCE sintético en truthClass LIVE/VERIFIED.
```

**No se debe afirmar que estas aserciones hayan pasado:** son especificación de una prueba futura. `ADR-09` está `PROPUESTA`.

## 4. Secuencia de PR y gates para merge

1. **PR #2 — Bootstrap**: revisar `vx-block1-operating-bootstrap`; CI `37830105804` SUCCESS en git_commit_sha `ce351d0f8d09c6e99c277e5cdde5202a718a2b11`. **Solo el usuario aprueba el merge**. Tras fusionarlo, readback del nuevo HEAD de `handoff_current_bootstrps` y repetir CI de ese HEAD; no dar por PASS el CI histórico sin comprobar base integrada.
2. **PR #3 — Hybrid**: reconciliar/rebasar sin force-push sobre nuevo HEAD tras #2; validar el contrato `nostromo-hybrid`, `authority=false`, las siete rutas, suite y overlay; después aprobación humana y merge.
3. **PR #4 — ADR-09 + anexo + gaps**: reconciliar/rebasar sobre nuevo HEAD tras #2/#3, conservar los tres commits de contenido y los nuevos registros de GAP-002/003/004; verificar CI; sin cierre de gates LIVE. Si se exige una intención por PR, dividir en PRs sin pérdida de evidencia antes de merge.
4. **PR #5 — adapter**, **solo después de #2 integrado y validado** y de la aceptación de ADR-09: implementar normalización + fixtures en rama propia y revisión/CI; no reutilizar `vx-block1-manojos3-binding` mientras esté ocupada por PR #4.

**Estado actual sin integración:** PR #2/#3/#4 sin merge; `LC-M3-R0-BINDING=BLOCKED_DEPENDENCY`; `LC-AGENT-EVENTS-LIVE=OPEN`. No modificar MANOJOS3, no realizar pruebas LIVE y no usar `manojos_prepare/submit/resume` en SOURCE.

## 5. Observaciones de propiedad y límites

- **Fuente externa independiente:** `docs/observaciones-externas/OBSERVACIONES_MANOJOS3.md` preserva `OBS-M3-001` (OpenAPI vs server en auth) y `OBS-M3-002` (eventos internos) sin importar deuda del target al canon de LibreChat.
- **Puerto:** 8790 MCP MANOJOS3 y 8791 HOST_CONTROL son **coincidencia de reservas, no colisión**; `plugins/manojos3/mcp.json` git_blob_sha `0c1be847a232399032a0e61c27d237d289e452a1`.
- **Sin LIVE:** todo el material corresponde a SOURCE, fixtures o propuestas. No hay lectura autenticada de servicios/host, ni prueba de acceso R0 desplegado.

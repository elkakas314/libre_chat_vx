# NOSTROMO — gobernanza de MANOJOS3 y recuperación del host

Estado: SOURCE / NOT_INSTALLED / HOST_LIVE_NO_VERIFICADO.
No crea otro MCP ni un segundo Kernel, daemon, proxy, túnel o base de datos.

## Arquitectura sin duplicación

- Ruta normal: LibreChat Agent (nativo) + Skill `manojos3-nostromo`
  → NostromoTargetGateway → Manojos3McpTargetAdapter
  → **MANOJOS3 MCP existente** (normalmente `127.0.0.1:8790/mcp`)
  → Governor/Policy/Kernel/Verifier/Receipt.
- Ruta independiente de recuperación: LibreChat backend autorizado
  → `NostromoHostControlBridge` server-only
  → **HOST_CONTROL MCP existente** (normalmente `127.0.0.1:8791/mcp`)
  → grant local exacto R2/R3 bajo contrato host
  → readback/journal host. Su resultado **no** es un MANOJOS3 Receipt.
- El primer despliegue solo habilita R0; R2 se activa posteriormente
  por servicio exacto una vez probadas las rutas de autorización local.
- Si LibreChat está caído, la recuperación del host sigue siendo
  independiente mediante la interfaz host local ya existente.

## Bootstrapping seguro (no aplicado automáticamente)

1. Inspeccionar host R0: procesos/puertos, rutas Git, dirty/untracked,
   logs y versionado de HOST_CONTROL. No reiniciar ni sobrescribir.
2. Confirmar HELLO/listTools del MCP autenticado desde el **backend**
   LibreChat, y compararlo con el contrato vivo de MANOJOS3/HOST_CONTROL.
   `127.0.0.1` dentro de un contenedor no implica localhost del Lenovo.
3. Para ingreso externo a HOST_CONTROL exigir mTLS cliente en el borde
   y que la prueba de peer real llegue **server-side** al adaptador.
   No aceptar cabeceras fabricadas `x-trusted`, texto de chat ni
   variables de frontend como certificados.
4. Resolver credenciales exclusivamente con SecretRefs en backend.
   No colocar certificados, grants, tokens o claves en Git/Drive/Skill.
5. Configurar únicamente servicios y rutas de repo existentes en
   `allowedServices` y `allowedRepositories`, comprobados por readback.
   Mantener `enabled=false` hasta canario autenticado.
6. Registrar el agente candidato desde la administración nativa LibreChat
   con RBAC y visibilidad por usuario. Evitar exponer `host_exec` arbitrario
   en el catálogo del agente. La Skill aporta selección y evidencia,
   **no** ejecuta ni concede autorización.
7. Canario R0: host_status, listener, service y git status. Comparar el
   resultado con la misma lectura desde HOST_CONTROL; verificar freshness,
   scope y aislamiento de inquilinos.
8. R2 únicamente con unidad explícitamente aprobada, grant local
   preexistente de un solo uso y permiso de operador; test primero con
   servicio de prueba no crítico. El adaptador envía exactamente
   `{unit,grant_id}`, NO usa `host_exec` y NUNCA reintenta después
   de posible efecto. Estado final no PASA sin readback independiente.
9. Deshabilitar configuración y desconectar MCP como rollback.
   No editar MANOJOS3/HOST_CONTROL, ni sus servicios, por esta propuesta.

## Superficie propuesta de agente

| Acción visible | Tool existente | Riesgo | Estado |
| --- | --- | --- | --- |
| Estado MANOJOS3, capacidades, receipts | `manojos_*` | gobernado por target | SOURCE adapter existente |
| Estado host, sockets | `host_status`, `host_listener_status` | R0 | SOURCE candidato |
| Estado servicio específico | `host_service_status` | R0 | SOURCE candidato |
| Estado Git de ruta permitida | `host_git_status` | R0 | SOURCE candidato |
| Reinicio servicio R2 | `host_service_restart` | R2 | LOCAL_GRANT_REQUIRED |
| Consola arbitraria, señales, borrado, GUI | **NO EXPUESTO** | R2/R3 | OUT_OF_SCOPE |

Controles: permiso nativo ToolApproval nunca sustituye grant local;
un LLM no presenta `verified=true` creíble, no solicita R2 a través
de texto del modelo, no reusa tokens ChatGPT/SIWC para host.

## Pruebas

`tests/nostromo-host-control.test.ts` cubre 8 casos de rechazo por
ausencia de enlace/grant, proof caducado, allowlist, no reintento, R0
y R2 con readback. CI SOURCE no acredita un MCP instalado ni un
servicio reparado. Falta prueba de integración E2E sobre HOST_CONTROL
real, mTLS y control de estado local. El estado permanece NO_VERIFICADO.

Fuente host: `elkakas314/manojos3/docs/HOST_CONTROL.md` (dos planos).
Fuente LibreChat: `src/adapters/manojos3McpAdapter.ts`,
`src/host/hostControlBridge.ts`, `config/host_recovery.current.json`.

# NOSTROMO — cierre de cableado nativo: R0 y configuración inicial (2026-11-11)

## Hechos y verdad

- GitHub SOURCE actual: \`elkakas314/libre_chat_vx\`, separado de MANOJOS3, ORÁCULO y VX13.
- \`~/librechat/vx\`: paquete TypeScript VX instalado mediante reconciliación protegida en
  \`~/librechat/upstream/packages/librechat-vx\`; readback previo PASS con backup único.
- MCP \`nostromo-autonomo\` v0.3: 28/28 pruebas PASS sobre la rama \`main\` del Lenovo,
  incluyendo protocolo stdio, R0, R2 denegado, async jobId y cancelación.
- \`~/librechat/upstream\`: upstream LibreChat v0.8.8 HEAD exacto
  \`f10b1d91f1eee3a2c82d5247bf620351486b7c1b\`, con cambios locales únicos.
  No re-clonar, limpiar ni sobrescribir.
- Frontend \`npm run frontend:ci\`: NO PASS, faltan \`rimraf\`, \`tsdown\`, \`vite\`;
  npm del host reportado \`10.9.8\` frente al \`packageManager: npm@11.13.0\` upstream.
  PR #34 trabaja la reparación protegida. Hasta su cierre no hay compilación UI LIVE.
- Según auditor local previo, \`librechat.yaml\` y \`.env\` están ausentes en el upstream integrado.
  **Releer antes de actuar**; un archivo CURRENT no acredita el host en tiempo real.
- El agente \`agents/nostromo-autonomo/agent.candidate.json\` está \`enabled:false\`,
  \`model:null\`: candidato, NO registrado/activado en el Agent Builder.
- \`VXCockpitBridge.tsx\` y \`TentaculoHub\` son fuente UI montada parcialmente.
  El Hub es un inventario estático, no un detector de herramientas/permiso LIVE.
- SIWC OAuth ChatGPT tiene módulos server-only para flujo/credenciales/respuestas,
  pero no está unido a una sesión/modelo real de LibreChat; sólo consentimiento
  oficial si es soportado y efectivamente admitido. No sustituir por un token GitHub.

## Auditoría del cableado

| Enlace | SOURCE | INSTALLED | CONFIGURED | LIVE | VERIFIED |
|---|---|---|---|---|---|
| VX → frontend LibreChat | Sí | Workspace VX sí | Bridge SOURCE sí | No probado | Sólo TypeScript VX PASS |
| Agente nativo → MCP | Sí | Agente no registrado | Sin \`librechat.yaml\` probado | No | No |
| MCP stdio → CLI | Sí | Servidor disponible localmente | Sólo pruebas aisladas | Test MCP stdio real | 28/28 TEST PASS, no E2E chat |
| ChatGPT OAuth → LLM | Sí | No acreditado | Consentimiento/modelo pendiente | No | No |
| Cabina/Hub → eventos reales | Sí | Bridge parcial | Fuente estática | No | No |
| LibreChat backend → Mongo | SOURCE upstream | No acreditado | \`.env\` ausente anteriormente | No probado | No |
| Agent Builder → registro persistido | Candidato JSON | No | Modelo nulo | No | No |

La ruta final será:
\`Usuario → LibreChat autenticado → Agent Builder NOSTROMO → tool MCP stdio → policy R0/R2 → async jobId → poll/cancel → readback externo → UI\`.

## Código nuevo: R0 antes de cualquier mutación

\`\`\`bash
cd ~/librechat/vx
npm run nostromo:wiring:test
npm run nostromo:wiring:inspect
npm run nostromo:wiring:config:preview
\`\`\`

\`audit-nostromo-native-wiring.mjs\` NO lee valores de \`.env\` o \`librechat.yaml\`,
no instala, arranca, habilita ni modifica servicios, ni invoca MCP.
Distingue un socket TCP escuchando de la salud/authenticación LibreChat.
Devuelve JSON con ruta, identificación SOURCE, wiring del Bridge, binarios
frontend, existencia del YAML, candidato de agente y bloqueos E2E.

\`stage-nostromo-mcp-config.mjs\` PREVIEW sólo si no existe
\`~/librechat/upstream/librechat.yaml\`. Prepara exactamente una entrada
\`mcpServers.nostromo-autonomo\`, usando el fragmento ya mantenido en VX.
Valida \`version:1.3.17\` en \`librechat.example.yaml\` del commit upstream fijado.
No ejecuta npm, ni servicio, ni registrador de agentes.

**\`npm run nostromo:wiring:config:stage\` es escritura material opt-in:**
sólo cuando el YAML esté ausente y HEAD coincida. Crea archivo 0600
con \`NOSTROMO_MCP_ENABLED:'0'\`; no fusiona configuración existente,
no copia \`.env\`, no monta Docker y **NO activa terminal**. Si ya existe
un YAML válido, devuelve \`EXISTING_YAML_NO_AUTOMATED_MERGE\` y se conserva
sin tocarlo. No ejecutar esta fase antes de revisar el resultado de
PREVIEW y comprobar que LibreChat es una instalación local (no Docker).
Para Docker la entrada stdio requiere otro namespace/montaje explícito.

## Gates que faltan para cierre real

1. **Dependencias**: npm 11 aislado del sistema o ruta compatible protegida,
   preflight + pruebas de la PR #34; instalación de dependencias con SHA
   de manifests/lock y readback, sin \`npm ci\` ciego ni podas.
2. **Frontend**: \`npm run frontend:ci\` PASS en el upstream integrado con
   límites RAM; verificar la cabina visual sobre el build real, no fixture.
3. **Backend**: configurar \`.env\` **sólo mediante autoridad legítima**,
   comprobar MongoDB/backend, servicios y respuesta autenticada;
   \`port3080=LISTENING\` por sí solo no basta.
4. **MCP real**: configurar una sola entrada local (no administrada desde UI);
   validación del YAML, UID/ACL y directorios admitidos; arrancar LibreChat
   explícitamente; \`nostromo_estado\` y \`nostromo_herramientas\`
   desde sesión autenticada, sin registrar estados falsos.
5. **Agente**: registrar el candidato en Agent Builder existente, asignar
   modelo ACTUAL y las herramientas \`nostromo_terminal_preparar\`,
   \`nostromo_tarea_iniciar\`, \`nostromo_tarea_estado\`,
   \`nostromo_tarea_cancelar\`; conservar \`nostromo_terminal_ejecutar\`
   desactivado si se opta por modo async.
6. **OAuth**: autorizar el usuario por flujo oficial cuando esté disponible,
   comprobar scopes, catálogo real y cuota; no afirmar conexión por SOURCE.
7. **E2E**: ejecutar \`pwd\` R0 desde una conversación de NOSTROMO:
   START → jobId → STATUS/EXIT_0 → stdout → readback en el directorio
   permitido, con receipts. E2E R2 denegado, BUSY, cancelación,
   caída MCP y reinicio; sin afirmar persistencia de tareas en memoria.
8. **UI**: PR #31, cabina/Hub en responsive, Artifacts/Subagents preservados,
   estado sólo tras lectura autenticada, sin activar servicios desde JSX.

No crear un segundo MCP, Kernel, Worker, Scheduler, puerto ni Actions.
Mantener \`~/upstream\` independiente y no usar sus secretos.

## Handoff

\`NEXT_ELIGIBLE\`: ejecutar R0 wiring y npm preview en Lenovo, corregir
config gap npm, compilar frontend, preparar YAML desactivado mediante
gate local y registrar agente una vez que exista backend real.
Ningún test SOURCE equivale a \`LIVE\` o \`PRODUCT_FINISHED\`.

## Seguridad del servidor MCP dentro de LibreChat

El fragmento SOURCE para primera activación incluye
`chatMenu:false` y `NOSTROMO_TOOL_SET` con exclusivamente
`nostromo_terminal_preparar` + trío asíncrono
`nostromo_tarea_iniciar/estado/cancelar`. El ejecutor directo
`nostromo_terminal_ejecutar` NO aparece en esa selección.
`NOSTROMO_MCP_ENABLED: '0'` se conserva: ninguna terminal arranca
por el hecho de instalar el YAML.

**Ojo:** `chatMenu:false` oculta el MCP del compositor general,
pero NO equivale a RBAC ni aislamiento de otro usuario. Un MCP stdio
definido en YAML pertenece al operador LibreChat. Antes de activar,
verificar single-user/ACL/admin role, mismo UID/namespace, carpeta
de aprobaciones sin acceso del agente y límites de rutas; no usar
este MCP local en LibreChat multiusuario sin un aislamiento real.


## Trabajo en worktree de prueba

El preparador YAML toma su fragmento de la **revisión SOURCE donde se
ejecuta**, aunque sea un worktree de pruebas. Su fase `--apply` se
rechaza si la fuente no es exactamente la carpeta canónica
`~/librechat/vx`. Con ello se puede ejecutar el PREVIEW de una
rama aislada y comparar SHA/catálogo sin que genere por error
configuración desde una revisión antigua de `main`.

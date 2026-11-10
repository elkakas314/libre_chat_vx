# NOSTROMO — auditoría cruzada cabina, Tentáculo Hub y dos upstream (2026-11-10)

## Alcance y regla de evidencia

Auditoría de repositorio privado `elkakas314/libre_chat_vx` y readback R0
de los tres worktrees del Lenovo mediante MANOJOS5, más capturas históricas
de upstream LibreChat. **No se ejecutaron GitHub Actions nuevos** ni se
consultó contenido de secretos. El código en GitHub y el frontend LIVE son
estados distintos.

## 1. Evidencia MATERIAL Lenovo

MANOJOS5 `construction.repo.inspect`, 2026-11-10T22:20:11Z:

| Árbol exacto | HEAD observado | Dirty (entradas Git) |
|---|---|---:|
| `/home/elkakas314/librechat/vx` | `9463ff8a5116601d8d25dff1a9117ab12d7689ad` | 2 |
| `/home/elkakas314/librechat/upstream` | `f10b1d91f1eee3a2c82d5247bf620351486b7c1b` | 6 |
| `/home/elkakas314/upstream` | `f10b1d91f1eee3a2c82d5247bf620351486b7c1b` | 1 |

Los recuentos no son un diff de contenidos. `local.fs.list` devolvió
`TYPED_PLAN_SCHEMA_INVALID`; otro intento se enrutó a un inventario de
repositorios y **no devolvió nombres de archivos**. Por tanto no se declara
inventario local completo. Se entrega
`node scripts/audit-local-three-trees.mjs`, sólo R0 sin red ni escritura:
contrasta existencia, estados Git (40 rutas máx. con nombres sensibles
redactados), dos versiones de `Presentation.tsx`, Bridge/CSS, raíz VX,
paquete instalado, lockfiles, configuración por **presencia** (no contenido),
puertos 3080/27017 y tipo de package.json.
`GIT_OPTIONAL_LOCKS=0` protege el índice del Git consultado.

Readback anterior del operador:
- `~/librechat/upstream`: `client/package.json`,
  `client/src/components/Chat/Presentation.tsx`, `package-lock.json`
  modificados; `packages/librechat-vx` y `client/src/components/VX`
  con trabajo sin seguimiento. UI Bridge/CSS copiados y comprobados.
  Respaldo: `/home/elkakas314/nostromo-ui-backup.s5cE3siD`.
- `~/librechat/upstream/.env` y `librechat.yaml` ausentes;
  hay un `.env` en `~/upstream`, **distinto checkout**: no copiar.
- `:3080` y `:27017` no escuchaban; Docker daemon/socket no disponible
  en esa comprobación. No inferir que servicios no puedan arrancarse.
- `npm run nostromo:workspace:diagnose` sobre `9463ff8`
  encontró TS7016/TS7026 por tipos React ausentes en staging.
  En GitHub `a4f5f2e` figura un fallback de tipos React temporal,
  **no aplicado ni verificado localmente**.
- No se fusiona ni elimina ninguno de los dos checkouts: HEAD igual no
  significa contenido o finalidad igual.

## 2. Cabina visual — SOURCE

El punto de integración real en LibreChat es:
`overlay/upstream/VXCockpitBridge.tsx` → wrapper en el
`client/src/components/Chat/Presentation.tsx` **modificado**.
Reutiliza el panel nativo con prioridad Artifacts > Subagents > NOSTROMO,
solicitud explícita y cierre. Pese al código fuente, faltan arranque,
compilación y smoke E2E del Lenovo.

Existe además `src/ui/NostromoCockpit.tsx`, una cabina avanzada con
StatusRail, DecisionInbox, ResourceTree, InterflowLens, ControlDeck,
Browser/Audio/Build/Tasks, etc. **No está montada en
`VXCockpitBridge.tsx`**. Se usa en `tests/visual/fixture-entry.tsx`,
que es una fixture SOURCE con datos artificiales. No presentar su
captura como interfaz LIVE instalada ni duplicarla en un segundo panel.

En el Bridge sólo están enlazados `TentaculoHud` y
`TentaculoHub`; se pasan `projectTentaculoHud([])` y
`nostromoHubSourceSnapshot()`: **no hay llamadas a endpoints runtime
ni descubrimiento MCP**. El selector actual tiene cuatro focos manuales
(AUTONOMO/MANOJOS/VX13/ORACULO), mientras la skill de visualización
propone foco orgánico automático. Mantener el selector como navegación
manual de respaldo; la selección contextual debe derivar de eventos
verificados y no abrir panel sin petición.

## 3. Capturas visuales recuperadas, SIN nueva ejecución

GitHub Actions histórico `41999106407`, artefacto `13402026570`,
screenshot de LibreChat upstream + mock LLM (5 nov 2026).
Capturas desktop 1280x900, móvil 390x844, light/dark; revisión
`a8df4c35...` de esa ronda anterior. Valores del JSON:

- desktop panel cerrado: chat main `920px`; abierto `459.5px`;
  `documentWidth=1280`; contextCount 0→1→0.
- móvil: main `390px`, `documentWidth=390`, sin overflow.
- `page errors=[]`; las capturas muestran **la cabina anterior a
  los cuatro modos y Tentáculo Hub**. No prueban su diseño actual.
- Falta E2E material de coexistencia con Artifacts/Subagents ACTIVOS,
  navegación del Hub nuevo, lector real y retorno tras actualización.

## 4. Hallazgos priorizados

**P0 — producto no operativo**: :3080 cerrado, .env/librechat.yaml
ausentes en checkout activo según readback; paquete VX obsoleto. Agente
candidato SOURCE `enabled:false`, `model:null`; MCP probado por
stdio (19/19 previo), pero no enlazado/registrado en LibreChat.
Router de modelos = reglas de selección, **sin rutas LIVE**; ChatGPT
SIWC = contratos OAuth, **sin consentimiento/grant**. Graph y GitHub
fine-grained requieren configurar credenciales bajo su propia autoridad;
nunca extraer secretos MANOJOS3 hacia YAML/JS/repositorio.

**P1 — duplicidad/deriva**: dos upstream con mismo HEAD distinto dirty,
overlay y paquete con rutas exclusivas. Nunca ejecutar instalador
destructivo ni limpiar checkout alterno antes del readback por archivo.

**P1 — verdad visual engañosa**: el Hub decía literalmente
`MCP no instalado`, afirmación que una vista estática no podía conocer;
la cabina decía `SOURCE · SIN ACTIVAR` aunque el MCP pasó pruebas en
host, que tampoco equivalen a un binding LIVE. Reparado en esta rama
a `sin lectura LIVE desde LibreChat` y `ENLACE NO VERIFICADO`.

**P1 — inventario incompleto**: Hub omitía las nuevas herramientas
R0 (archivo/Git/métricas), voz, background tasks, Graph y mock 4GB.
Ampliado en esta rama, manteniendo cada nodo en `SOURCE`. No finge
VRAM física. Usuario afirma mock verificado como simulación; queda
registrado como atestación, no como prueba hardware.

**P1 — árbol visual muy largo**: árbol siempre expandido, penaliza
móvil. Incorporadas ramas `details/summary` nativas, foco por teclado,
contraste claro/oscuro; abierto sólo nivel raíz.
Actualizar pruebas estáticas y Playwright en código fuente,
pero **sin ejecutar Actions**.

**P1 — cabina avanzada no conectada**: el componente
`NostromoCockpit` contiene módulos SOURCE útiles pero sin consumidor
en el wrapper actual. Reutilizar selectivamente bajo petición y con
datos reales, no renderizar masivamente con placeholders.

**P2 — motor visual contextual**: `interpretIntent`,
`choosePresentationMode` y `windowsForDomain` existen,
pero no reciben hoy el ciclo de eventos del chat nativo de LibreChat.
No hay evidencia de visualización orgánica LIVE ni render de
Mermaid/timeline/cabina avanzados en el puente.

## 5. Orden de reparación en Lenovo

1. `git pull --ff-only origin main` sólo VX con revisión esperada.
2. `npm run nostromo:local:trees:audit`, leer comparaciones de los dos
   upstream y no mostrar ficheros confidenciales. Auditar sus cambios
   únicos y decidir explícitamente cuál provee runtime activo.
3. Validar tipos React con `npm run nostromo:workspace:diagnose`;
   si `DIAGNOSE_COMPILE_PASS`, respaldar y reconciliar paquete;
   de otro modo reparar dependencia concreta primero. No instalar
   desde cero ni usar GitHub Actions.
4. Aplicar **sólo Bridge/CSS** actualizados con respaldo y cmp;
   compilar frontend limitado por RAM.
5. Configurar un backend LibreChat + MongoDB locales sin copiar
   `.env` del checkout alternativo; confirmar :3080.
6. Registrar agente nativo y su MCP local; capturar readback de
   catálogo, una acción R0, cierre/retorno móvil, Artifacts/Subagents,
   hub y overlay OFF, sin efectos no autorizados.
7. Sólo con OAuth realmente concedido conectar ChatGPT SIWC;
   SecretRefs de MANOJOS3 deben permanecer allí. GitHub remoto
   por MCP separado o puente tipado gobernado, Microsoft Graph
   por OAuth delegado. Router OpenRouter/Hugging Face:
   verificar provider/quota LIVE sin publicar secretos.

## 6. Criterios de aceptación

- PR estrecha sin workflows automáticos, `main` readback SHA.
- Script local: enumera y compara tres rutas exactas sin escribir,
  sin imprimir secretos, sin alterar servicios.
- Código UI mantiene Artifacts/Subagents nativos por delante,
  source-only explícito, y responsive 390px.
- NOSTROMO/Tentáculo Hub muestran estado LIVE sólo tras datos
  autenticados, fechados y frescos; sin claims de VRAM física.
- Sólo el Lenovo puede cerrar LOCAL/LIVE/VERIFIED del producto.

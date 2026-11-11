# NOSTROMO — handoff técnico del Director
Fecha: 2026-11-11. Evidencia: SOURCE readback, sin instalación ni ejecución en Lenovo.
Base revisada: integration/nostromo-pr31-34-35-36-20261111 @ 38948eb5d91439b432f19c2ce3362a7b3e309e89.
Encargo E2: issue #37 (F1-L1), pendiente del hilo manual del usuario.

## Hallazgo operativo

Readback directo de deployment/nostromo-mcp/tools.mjs (fef3a20), policy.mjs (3833bd5), server.mjs (91bf8cd), agent.candidate.json (178b6d2), UPSTREAM.json y librechat-mcp.fragment.yaml:

- Agente: SOURCE_CANDIDATE_NOT_INSTALLED, enabled=false, model=null; creación mediante Agent Builder.
- MCP: un solo servidor stdio, desactivado con NOSTROMO_MCP_ENABLED=0. Toolset del fragmento selecciona preparación y el trío asíncrono; máximo 1 tarea y 120 s, estado no persistente. El modo async excluye CLI síncrono.
- Política: lectura R0 limitada a comandos enumerados; todo lo demás es R2, con aprobación física one-shot ligada al hash. spawn sin shell. Exit 0 no verifica efecto material.
- Root mismatch: YAML sólo permite /home/elkakas314/librechat/vx y /home/elkakas314/librechat/upstream; excluye librechat/nostromo, por lo que no habilita lectura de reports/handoffs/backups canónicos. Mantener cerrado hasta definir scope mínimo y ACL; no abrir todo sin revisión.
- LibreChat pin SOURCE: v0.8.8, commit f10b1d91f1eee3a2c82d5247bf620351486b7c1b; runtime no verificado. Node 24.16/npm 11.13 según la referencia fijada. El documento de integración cita verificaciones estáticas de a2acfbc, antiguas respecto de base 38948eb; no cuentan como pruebas de esa base.
- No se cambió LIVE ni se ejecutaron herramientas MANOJOS3. El acceso host no quedó acreditado.

## Ruta crítica y lotes E2

### N-B0 — preflight backend (sólo lectura, una tarea pesada máxima)
Primero resolver issue #37 sin repetir el inventario completo. En el Lenovo: HEAD/dirty de VX y upstream, servicios/procesos/puertos, Node/npm, recursos, CPU AVX, servicio Mongo actual, rutas de datos y manager de procesos. Leer estado de config redactado; nunca imprimir .env, credenciales o URI. Salida: clasificar SOURCE/INSTALLED/CONFIGURED/LIVE, identificar una sola ruta de backend/DB, datos persistentes, backup/rollback y NEXT_ACTION. Si no hay acceso local, dejar recibo tipado y continuar SOURCE.

### N-B1 — backend y base persistentes
Sólo tras N-B0. Reutilizar servicio sano; si falta DB, comparar recursos y compatibilidad antes de instalar una sola. La guía LibreChat actual indica que Compose predeterminado incluye MongoDB, Meilisearch, RAG API y vector DB; modo npm requiere servicios externos. No levantar opcionales por defecto. Validar AVX y SO: MongoDB 5+ requiere AVX en x86_64. Alinear instalación con LibreChat fijado. Aceptación: un backend, una DB, autenticación, conversación real, escritura/readback persistente tras reinicio, backup restaurable, puertos/servicios sin duplicados. Rollback desde backup comprobado, sin reset/clean.

### N-A1 — proveedor y agente
Tras N-B1, verificar binding OAuth real si existe; de lo contrario probar proveedor gratuito/local configurado. Crear agente nativo manualmente en Builder, asignar modelo real, autenticar y readback de conversación. API de pago no es requisito.

### N-M1 — MCP
Tras N-A1 y tests SOURCE del MCP: backup del YAML real; una entrada stdio; revisar namespace host/container, root scope mínimo, toolset y ACL. Canario R0 de archivo no sensible; operación R2 pequeña sólo con aprobación física exacta; verificación independiente. Documentar approval dir como excepción privada del SO. Verificar rollback YAML y backend sano.

### N-UI1 / N-MOB1
Después de B1/A1/M1: interfaz HUD con datos LIVE; luego PWA bajo HTTPS privado, autenticación, continuidad/reconexión y pruebas E2E móvil/escritorio con reinicio.

## Bloqueos

- E2: EXTERNAL_BOUNDARY puntual. El usuario abrirá un hilo único y proporcionará el prompt completo; no crear otro.
- Lenovo desde este hilo: UNAVAILABLE_TOOL/CONFIG_GAP. No repetir esquemas fallidos; E2 descubre contratos admitidos y registra recibos.
- DeepSeek: no se obtuvo sesión web controlable ni readback en este turno; asesoría no consultada, no bloquea lotes.
- No mover /home/elkakas314/upstream ni borrar backups hasta comparación, referencias, plan reversible, readback y pruebas.
- Issue #37 permanece como contrato inicial. Al existir E2, compartir este handoff y asignar N-B0; no cerrar #37 por este análisis.

Referencias oficiales actuales: https://www.librechat.ai/docs/local ; https://www.librechat.ai/docs/local/docker ; https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/mcp_servers ; https://www.mongodb.com/docs/manual/administration/production-notes/ . Contrastar con la revisión v0.8.8 y hardware/OS reales.

NEXT_ACTION: entregar issue #37 + este handoff a E2; ejecutar N-B0 primero; aceptar recibo antes de N-B1. Raíz requerida: /home/elkakas314/librechat/.
# NOSTROMO — GitHub sin consumo automático de Actions (2026-11-10)

Decisión explícita del operador: no usar GitHub Actions para construir/verificar NOSTROMO; consume cuota y el conector de GitHub posee permisos de escritura sobre elkakas314/libre_chat_vx.

Los tres workflows versionados se mantienen únicamente con `workflow_dispatch`. No se lanzan por push ni pull_request. Ninguno se ha disparado automáticamente desde esta modificación por diseño; comprobar en readback de GitHub las fechas de los nuevos runs, no inferir ejecución.

Verificación de cambios: usar GitHub como control de versiones y revisión por SHA, con `git pull --ff-only` en el Lenovo. Ejecutar tests y builds locales con memoria limitada, readback y receipts. No añadir nuevos workflows con disparadores automáticos.

Token GitHub fine-grained: sirve para autenticarse en GitHub, no para ChatGPT/OAuth SIWC ni para proporcionar modelos. No exponer valores ni almacenarlos en el repositorio.

Cierre pendiente: resolver dependencia de tipos React del compilador local, reconciliar VX, iniciar Mongo/LibreChat existente y enlazar el agente nativo/MCP con evidencia real. ChatGPT SIWC requiere autorización expresa propia.

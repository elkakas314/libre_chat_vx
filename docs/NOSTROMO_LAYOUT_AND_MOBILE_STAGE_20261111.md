# NOSTROMO — Layout canónico y ruta móvil (11-11-2026)
- Evidencia Lenovo: npm 11.13.0 instalado aislado, 14/14 tests PASS, 2984 paquetes añadidos con removed=0/changed=0, `frontend:ci` PASS y lock SHA preservado. **No prueba backend/MCP/agent/móvil LIVE.**
- Rutas existentes protegidas: `~/librechat/vx` (Git NOSTROMO), `~/librechat/upstream` (LibreChat integrado), `~/upstream` (tercer checkout independiente con `.env` propio; no copiar secretos ni borrar).
- Nueva raíz para datos: `~/librechat/nostromo/{backups,tools,runtime,worktrees,reports}`. No crear otro kernel o segundo checkout. Los cuatro respaldos históricos en `~/nostromo-*.***` se mantienen hasta inventario y reubicación verificable; no borrado automático.
- El cambio en la ruta de futuras copias de seguridad está separado de la migración de respaldos anteriores. No ejecutar instaladores destructivos de legado.
- `nostromo:mobile:preflight` valida sólo archivos del bundle PWA y la presencia (no contenido) del `.env` del tercer checkout. PWA compilada no equivale a backend ni móvil autenticado.
- Ruta de instalación móvil fácil: LibreChat autenticado tras Tailscale Serve HTTPS privado, navegador móvil -> «Añadir a pantalla de inicio». En iPhone usar Safari → Compartir → Añadir a pantalla de inicio; en Android Chrome → menú → Instalar. No es app nativa ni se ha probado sesión/reconexión/voz. Priorizar VPN privada y ACL; no exponer MCP, Mongo ni CLI.
- DeepSeek previo: aportación M1–M3 auditada en `docs/NOSTROMO_DEEPSEEK_M1_M2_M3_REVIEW_20261111.md`. El consejo de un modelo no sustituye pruebas/receipts.
- Próximos gates: tests SOURCE de nuevo layout y móvil, lectura R0 de cuatro backups, migración reversible autorizada y verificada, reconstrucción visual + configuración backend/Agente/MCP, prueba móvil real.

# NOSTROMO · Módulo de teléfono y tareas — SOURCE 2026-11-18

**Estado:** SOURCE implementado en rama de revisión PR #54. No implica instalación iOS, Tailscale Serve LIVE, token OAuth, control del iPhone ni canario físico exitoso.

## Alcance material

- Un solo backend LibreChat y su Mongo: acceso remoto web autenticado, historial y reanudación de flujos nativos, sin replicación del servidor.
- `src/mobile/phoneModule.ts` compone señales autenticadas de Tailscale/Cloudflare Access, estado de sesión, evidencia, tareas y elegibilidad de acciones de Apple Shortcuts. **No ejecuta Atajos ni comandos ni modifica la configuración del dispositivo.**
- `src/ui/PhoneModuleView.tsx` muestra estado SOURCE/LIVE separado, rutas, tareas y límites de control. Integrado en `src/ui/NostromoCockpit.tsx` y en el panel nativo existente `overlay/upstream/VXCockpitBridge.tsx` como vista bajo demanda, sin segundo cockpit.
- `src/cockpit/windowRouter.ts` detecta intención «iPhone», «móvil», «Tailscale», «Atajos», seleccionando PHONE + tareas de fondo.
- `config/mobile_access.current.json` corrige un error crítico: **127.0.0.1 es el propio iPhone y no es una URL válida para alcanzar el Lenovo desde el móvil**. La ruta LAN requiere lectura de origen real y autenticación; preferir Tailscale Serve HTTPS privado, no abrir :3080 a Internet.
- El adaptador puro de acciones admite `READ_ONLY`, `PREPARE_CONSENT` o `DENIED`; Atajos requieren puente verificado, sesión fresca y consentimiento del dispositivo; **control remoto general de iOS permanece NO SOPORTADO**.
- `tests/phone-module.test.ts` comprueba cierre por defecto, contexto de sesión, continuidad, sin replay, consentimiento y enrutamiento natural. CI prueba SOURCE, no usuario en iPhone.

## Pasos LIVE exigidos al Work

1. Identificar versión y compatibilidad iPhone SIN asumir el modelo; comparar Switchboard/TestFlight vs acceso Safari; si iOS<16 no ofrecer el cliente Switchboard como instalable.
2. R0: `tailscale status --json`, `tailscale serve status --json` y `tailscale funnel status --json` de la instancia real. Confirmar ACL, HTTPS privado, identidad y dueño de :3080; no tocar MANOJOS3.
3. Tras R2 exacto (si la configuración material lo requiere), publicar solo `http://127.0.0.1:3080` detrás de Tailscale Serve, Funnel OFF. Verificar usuario autenticado y readback del cliente.
4. Pruebas de continuidad escritorio ↔ iPhone, WiFi ↔ datos, recarga durante streaming, OAuth/ACL, revocación, salida y login. No reenviar efectos materiales tras reconexión.
5. Proponer Atajos desde el propio iPhone solo para acciones admitidas por iOS y con consentimiento. Nunca prometer control de otras apps, pantalla o sistema iOS por una API inexistente.
6. Integrar readback de señales autenticadas en la vista PHONE del cockpit en runtime; `createPhoneModuleSnapshot()` sin entradas es deliberadamente SOURCE/NO_VERIFICADO.

## Archivos y pruebas

- `src/mobile/phoneModule.ts`
- `src/ui/PhoneModuleView.tsx`
- `src/cockpit/windowRouter.ts`
- `src/ui/NostromoCockpit.tsx`
- `overlay/upstream/VXCockpitBridge.tsx`
- `tests/phone-module.test.ts`
- `config/mobile_access.current.json`
- `canaries/tailscale-mobile-live/README.md`

No habilita pagadores, no añade worker, daemon, Base de datos, MCP ni Kernel.

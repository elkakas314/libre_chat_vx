# NOSTROMO — ChatGPT con autorización oficial (SIWC OSS), SOURCE R2
Fecha: 2026-11-07. Estado: SOURCE_SERVER_MODULES_TESTED_NOT_BOUND. No OAuth consentido, no proveedor LIVE.

## Decisión
Usar la vía oficial Sign in with ChatGPT para aplicaciones OSS/locales o self-hosted. Identidad y permiso de consumir cuota del plan son decisiones separadas. No necesita clave API personal, pero el token OAuth autorizado llama al endpoint público Responses API, no a la web ChatGPT. No acceso a historial, memoria ni datos de ChatGPT. No cookies, scraping o proxy no autorizado.

Referencias oficiales: https://developers.openai.com/siwc/token-sharing-open-source ; https://developers.openai.com/siwc/token-sharing-open-source/sign-in ; https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference ; https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations ; https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites

## Entregable SOURCE
src/llm/chatgptAuthorized.ts genera OAuth PKCE/state/nonce, valida el callback exacto, construye intercambio y contratos de permiso, catálogo de modelos y solicitud Responses HTTP; exige response.completed terminal. tests/chatgpt-authorized.test.ts cubre rechazos de callback, identidad, scope, caducidad, catálogo y stream. Es código SERVER ONLY; no exportarlo desde src/index.ts que se compila también para React.
Se añaden listener de callback loopback one-shot (src/llm/siwcLoopback.ts), validación criptográfica JWKS/issuer/aud/nonce/exp (siwcIdentity.ts), grant y refresh por cuenta (siwcSession.ts), bóveda host Linux owner-only 0700/0600 con CAS y readback (siwcProtectedVault.ts) y cliente Responses SSE con modelos por cuenta y terminación response.completed (siwcResponsesClient.ts). Incluye pruebas negativas sin credenciales reales. Nada se publica como endpoint ni modifica el router; el código sigue SERVER ONLY y deshabilitado hasta el binding LibreChat.

## Binding host necesario antes de autenticar
1. Instancia local segura y usuario de aplicación autenticado; hostId persistente y opaco por host (urn:uuid o thumbprint), clientId emitido por cuenta/workspace.
2. Usuario inicia Continuar con ChatGPT en el PC local. Listener one-shot creado antes de abrir el navegador, atado a 127.0.0.1 con StateStore TTL y callback exacto http://127.0.0.1:<port>/auth/callback. En móvil remoto el loopback no puede apuntar al Lenovo; configurar desde PC o emplear la guía oficial de transferencia segura para un VM.
3. Primera autorización con dynamic_agent_client, nombre real LibreChat VX NOSTROMO y consentimiento explícito de scopes offline_access resource.invoke chatgpt.tokens.use.direct. El callback entrega issued clientId oaiapp_*; validar state/URI y hacer exchange con PKCE.
4. Verificador OIDC REAL JWKS firmado: iss, aud al clientId emitido, expiración y nonce; vincular subject, clientId y cuenta/workspace. No basta con parsear JWT. El verificador criptográfico y los contratos de ciclo de vida están implementados como SOURCE; todavía falta conectarlos al middleware de autenticación de LibreChat y al JWKS real, con pruebas de integración y flujo consentido. No activar login.
5. SecretStore backend por cuenta: access+refresh+ID tokens con protección 0600/rotación atómica, nunca browser storage, logs, Git, Drive o Chat. Renovación y revocación oficiales; no reutilizar secretos de MANOJOS3/ORÁCULO.
6. GET https://api.openai.com/v1/models con OAuth token cuenta; elegir sólo modelos visibles. POST /v1/responses con store:false y stream:true, input con historial necesario, sin system message ni previous_response_id, ni campos de preview no admitidos. Procesar hasta response.completed; error/incomplete es fallo, no PASS ni retry ciego.
7. Admitir la ruta ChatGPT como opción voluntaria sólo con grant, tokens, modelo, cuota y privacidad verificados. Cloudflare AI Gateway sigue independiente con cero coste propio; no confundir tokens de plan ChatGPT con VERIFED_ZERO_COST de terceros. No fallback automático de pago.

## Gates / límites
- Usuario debe consentir OAuth y acceso opcional al plan. No simular esa decisión en CI.
- Implementación SOURCE con pruebas de callback, firma, nonce, scope, renovación y vault; revisión de seguridad, protección del usuario de LibreChat, disponibilidad de JWKS, intercambio y revocación HTTP y auditoría del host aún pendientes antes del primer uso.
- La documentación oficial restringe herramientas hosted, streaming y campos de la ruta Responses; las herramientas materiales siguen en la autoridad de MANOJOS3, VX13 o proveedor destino.
- El uso del plan está sujeto a límites compartidos y ChatGPT Settings → Usage. No acceso a conversaciones ni memoria de ChatGPT.
- SOURCE compilado no implica integración en LibreChat ni despliegue LOCAL ni endpoint LIVE.

## R2: clasificación precisa de gates
- IMPLEMENTED_SOURCE: PKCE/state/nonce, listener sólo 127.0.0.1 one-shot, verificación de JWT firmado con clave JWKS inyectada, scopes OAuth separados, rotación de tokens, vault Linux owner-only CAS, cliente GET /models y POST /responses SSE (sin retry ni fallback).
- TEST: fixtures efímeras y HTTP local; no autoridad sobre cuentas ni prueba de cuotas reales.
- CONFIGURED/LIVE: NO. No hay ruta HTTP de LibreChat ni disparador de consentimiento conectado, hostId persistente ni directorio vault provisionado, ni JWKS real leído bajo OIDC discovery, ni solicitud remota autorizada. No crear credenciales por la UI.
- EXTERNAL: la aprobación del usuario y uso de plan en ChatGPT son acciones explícitas ajenas al código. Si la app no participa en el flujo OSS correspondiente, no marcar ACTIVE.
- FORBIDDEN: API key personal implícita, cookies/scraping, caché browser de tokens, compras o créditos automáticos, reintentos de stream tras resultado ambiguo, acceso a historial ChatGPT o autoridad material a NOSTROMO.

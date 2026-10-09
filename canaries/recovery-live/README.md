# LC-RECOVERY-LIVE — canario SOURCE / un reinicio controlado (HOST opt-in)

**Gate: OPEN.** SOURCE no demuestra despliegue ni Tailscale SSH efectivo. Referencias: `SPEC.json#/despliegue/procedimientos`, `SPEC.json#/backlog/active_live` (`LC-RECOVERY-LIVE`), `TOPOLOGY.json#/recursos` (`lc-recovery-ssh`). El SPEC **no fija** todavía la unidad systemd del host ni la política SSH de la cuenta.

## Propósito y fronteras

Probar que el servicio LibreChat puede reiniciarse y recuperar `HTTP 200`, que una sesión **Tailscale SSH independiente** permanece utilizable mientras LibreChat está caído, y que trabajos previamente registrados **no se duplican**. Ni disponibilidad HTTP, ni un PID nuevo, ni ACL declarada son evidencia suficiente de las tres propiedades. No tocar MANOJOS3 ni su política/puertos/rutas.

## Archivos y efectos

| Script | Tipo | Resultado |
|---|---|---|
| `00-source-sanity.sh` | SOURCE offline | Sintaxis Bash, JSON, estado y opt-in; ninguna acción material. |
| `01-read-host-service-state.sh` | Solo lectura | `systemctl status` y `systemctl show` de unidad dedicada; `ps` de nombre de comando como fallback, insuficiente para autorizar restart. |
| `02-read-tailscale-ssh-policy.sh` | Solo lectura | `tailscale status --json` más **export JSON auténtico** de política SSH por el administrador. Exige autorización exacta de operador/destino/usuario; `tailscale status` por sí solo no prueba SSH. |
| `03-canary-service-restart.sh` | **ÚNICO efecto controlado** | **Una** orden `systemctl restart` de la unidad LibreChat autorizada, solo con `RECOVERY_CANARY_ALLOW_RESTART=YES`, estado activo, SSH externa previa comprobada con readback, snapshot de rollback y health 200 previo; comprueba retorno del servicio y health. No reintenta reinicio material; usa lock local. |
| `04-evidence-freshness.sh` | Solo lectura | Evidencias de 01/02/03 + OOB externa con timestamp estrictamente <15 min; evidencia antigua/futura ⇒ `FAIL`. Corrobora estructura de SSH durante caída y ausencia de trabajos duplicados. |
| `05-rollback.md` | Documentación | Recuperación manual limitada al servicio LibreChat. |

**Limitación importante:** 03 observa una recuperación exitosa, pero no prueba por sí solo que SSH siguiera funcionando durante el intervalo de caída ni que no se duplicaran trabajos. Para eso 04 exige prueba de dispositivo independiente y readbacks de los trabajos del sistema propietario. El JSON aportado se valida estructuralmente; el origen/autenticidad debe corroborarse externamente para cerrar el gate.

## Variables de entorno (en host autorizado)

| Variable | Descripción |
|---|---|
| `RECOVERY_EVIDENCE_DIR` | Directorio privado 700 fuera de Git, archivos 600, default `${XDG_RUNTIME_DIR:-/tmp}/lc-recovery-$(id -u)`. |
| `RECOVERY_SERVICE_UNIT` | Nombre **exacto** de la unidad LibreChat dedicada, p. ej. `librechat-vx.service` (ejemplo, no afirmar despliegue). Ningún servicio MANOJOS3 aceptado. |
| `RECOVERY_CANARY_ALLOW_RESTART` | Solo el valor literal `YES` autoriza el **único** `systemctl restart` de 03. Sin él, `SKIP`. El usuario que ejecute necesita autorización systemd real. |
| `RECOVERY_HEALTH_URL` | URL local de health, solo `http://127.0.0.1:3080/api/health` (default) o `http://127.0.0.1:3080/`; exige HTTP 200, no sigue redirecciones. Confirmar ruta en host antes de activar. |
| `RECOVERY_TAILSCALE_SSH_POLICY_FILE` | Export JSON de política SSH real del tailnet en ubicación privada. No es un dump de `tailscale status`. |
| `RECOVERY_OPERATOR_PRINCIPAL` | Identidad del operador en la política, solo en entorno privado. |
| `RECOVERY_SSH_DESTINATION` | Identificador de destino tal como figura en la política real (host/tag), no adivinado. |
| `RECOVERY_SSH_OS_USER` | Usuario Unix permitido por la política exportada, en entorno privado. |
| `RECOVERY_SSH_POLICY_READBACK_REF` | Referencia opaca a la lectura autenticada del administrador de tailnet; no token. |
| `RECOVERY_SSH_POLICY_CAPTURED_AT_UTC` | Momento real de captura de la política, ISO 8601 UTC; no sustituir por el momento de ejecutar 02. |
| `RECOVERY_SSH_PREFLIGHT_PROOF_FILE` | JSON privado de prueba SSH autenticada desde otro cliente, permiso del operador y referencia al snapshot de rollback, **antes** de reiniciar. |
| `RECOVERY_OOB_PROOF_FILE` | Prueba privada recopilada desde **otro dispositivo** durante caída LibreChat, más evidencia de no duplicación de trabajos. Plantilla en `expected-outputs/recovery-proof.template.json`. |

## Orden de ejecución

```bash
bash canaries/recovery-live/00-source-sanity.sh
# En HOST autorizado y sin tokens en SOURCE:
bash canaries/recovery-live/01-read-host-service-state.sh
bash canaries/recovery-live/02-read-tailscale-ssh-policy.sh
# Aportar preflight SSH autenticado desde otro dispositivo y snapshot de rollback.
# Disponer de observador independiente y readback de trabajos.
# ÚNICA acción material, tras aceptación explícita del riesgo de caída:
RECOVERY_CANARY_ALLOW_RESTART=YES bash canaries/recovery-live/03-canary-service-restart.sh
bash canaries/recovery-live/04-evidence-freshness.sh
```

03 usa `flock` para impedir solapamiento **entre invocaciones de este canario**, no como prueba de no duplicación de trabajos de LibreChat. Si restart falla o queda indeterminado, exige intervención del operador según `05-rollback.md`, nunca reintenta automáticamente. El reinicio puede interrumpir conversaciones; no ejecutar en producción sin ventana de mantenimiento y snapshot previamente aprobado.

04 exige `observed_at_utc` menor de 15 minutos y prohíbe fechas futuras. Si no existen pruebas, `SKIP`; si hay pruebas caducadas, `FAIL`. La verificación estructural de readbacks no equivale a evidencia LIVE autenticada.

**Ningún script instala dependencias, modifica Tailscale ACL o toca MANOJOS3.** SOURCE/CI solo ejecuta 00 (sin reinicio ni red). El gate sigue OPEN hasta verificación independiente con permisos y pruebas reales.

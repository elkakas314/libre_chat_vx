# Procedimiento de rollback — LC-CF-AIG-BINDING

## Regla

Los scripts `01`, `02` y `04` hacen **solo GET**. `03` hace **únicamente** siete POST de inferencia; no crea/edita/despliega/elimina rutas. Por ello un fallo **no autoriza** cambios en Cloudflare. Lo consumido de cuota en un POST no es reversible.

## Si un canario falla

1. **Detener** el siguiente script y guardar el código de error, hora UTC, nombre de ruta, versión y comprobación concreta en evidencia privada.
2. Si ocurrió en `03`, no reintentar automáticamente (podría consumir más cuota). Comprobar logs, panel de cuota, facturación y política BYOK.
3. Leer de nuevo cuenta, gateway, ruta, deployments y versions con `01` y `02`; comparar sus IDs y versiones desplegadas con las capturas anteriores. Los scripts no han cambiado la configuración.
4. Si la configuración real hubiera sido alterada *por otro proceso*, no ejecutar ningún mutador desde este paquete. Identificar la última versión buena en la evidencia autenticada, exigir autorización operativa y usar **otro procedimiento gobernado** para restaurarla. Comprobar versión activa mediante GET y hacer nuevo canario seguro.
5. Si no existe versión previa verificable, mantener `LC-CF-AIG-BINDING=OPEN` y bloquear el despliegue. No inventar versión ni proveedor de fallback.
6. Documentar revocación de cualquier credencial comprometida **fuera** de este repositorio, siguiendo control del proveedor.

## Readback GET (sin mutaciones)

```bash
# Tras cargar las tres variables de entorno, ejecutar:
bash canaries/cf-aig-binding/01-read-account-and-routes.sh
bash canaries/cf-aig-binding/02-verify-routes-content.sh
```

**Nunca** usar POST de deployments, PATCH, PUT, DELETE o comandos de infraestructura en esta carpeta.

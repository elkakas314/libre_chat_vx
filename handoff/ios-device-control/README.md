# NOSTROMO iPhone — Control, métricas y sonda externa (DEFERRED SOURCE)
Fecha: 2026-11-17 · Estado: **fuente diferida, no integrada ni instalada**.
Rama aislada de `elkakas314/libre_chat_vx`; el cliente nativo final vive en el fork independiente `elkakas314/Librechat-Mobile` PR #1. **NO** fusionar esta rama ni modificar Work actual hasta que su compilación y P0 estén cerrados.

## Diseño de producto
La app iPhone será un **sensor y panel táctil del único backend NOSTROMO en Lenovo**, nunca un Kernel/worker/host-control paralelo. Los datos externos solo llegan al backend por HTTPS privado autenticado (p.ej., Tailscale), con opt-in y minimización. MANOJOS3, ORÁCULO y VX13 se integran después mediante adaptadores autorizados del backend: no se les concede autoridad sobre el iPhone por aparecer en un panel.

### Factible con API pública de Apple
- **Métricas en vivo R0:** porcentaje y carga de batería (`UIDevice`), Low Power (`ProcessInfo`), presión térmica por categorías (no temperatura °C), red Wi‑Fi/celular/coste (`NWPathMonitor`), volumen disponible para almacenamiento importante (`URLResourceValues`).
- **Sonda BLE R1:** búsqueda de periféricos Bluetooth **Low Energy** por botón, máximo 15 s, primer plano y permiso `NSBluetoothAlwaysUsageDescription`. Sin apareamiento, rastreo pasivo permanente ni exportar identificadores.
- **Sonda de red R0/R1:** alcance y latencia de **servidor NOSTROMO explícitamente configurado**; HTTPS y permisos de red local. No escaneo de puertos, captura de paquetes, inventario Wi‑Fi general ni SSID vecino.
- **Sensores R1:** CoreMotion/CoreLocation/altitud/brújula según hardware y consentimiento; retención local y duración acotadas.
- **Fotos/vídeos R1→R2:** PhotoKit con biblioteca limitada, sugerencia local de duplicados/grandes; borrar solo selección revisada con confirmación del sistema.
- **Mantenimiento R0→R2:** inventario de documentos/cachés **de la propia app**, vista previa de ahorro y lista de exclusiones; ninguna limpieza sin confirmación por recurso. No borrar datos de otras apps.
- **Copia R2:** exportación verificada de archivos **de NOSTROMO**, cifrado/manifest/hash/restore antes de PASS, con destino elegido por usuario (Archivos, iCloud Drive, Drive o Lenovo autenticado); imposible controlar el backup completo del sistema desde una app normal.
- **Atajos/App Intents:** acciones propias declaradas y autorización del usuario; no ejecución general de comandos en iOS ni instalación arbitraria de IPA.
- **Diagnóstico/soporte:** sugerencias basadas en estados medibles, botón para abrir Ajustes cuando exista ruta oficial, sin venderlas como reparación física.

### Límites materiales (no prometer)
No salud máxima de batería, ciclos internos, reparación de iOS, desinstalar otras apps, limpiar WhatsApp/Instagram, instalar apps arbitrarias sin distribución autorizada, escanear redes Wi‑Fi cercanas ni extraer tráfico de red. Apple Wi‑Fi Aware iOS 26+ necesita entitlement y hardware iPhone 12+; **no suponerlo** en un iPhone SE por tener iOS 27.

## Contrato de seguridad
- Flujo `INVENTORY_R0 → PREVIEW → USER_CONSENT → exact-scoped action → READBACK → RECEIPT`.
- Ningún `ALLOW` de UI/LLM autoriza borrados; el ejecutor vincula recurso+hash+consentimiento+identidad.
- Sin operaciones destructivas en cola offline, sin repetir después de reconexión; posible efecto -> `UNKNOWN_OUTCOME`.
- No servicios ni operadores autónomos residentes en iPhone; BLE en foreground y bajo demanda.
- No subir lista de dispositivos BLE, SSID, ubicación, fotos o nombres de archivos sin opt-in por dato y destino.
- Métricas del dispositivo ≠ salud física diagnosticada; telemetría caduca y lleva fecha.
- Para specialist targets: `iPhone → NOSTROMO backend (auth) → target` con readback y política del target.

## Integración posterior (dejar a Work para después)
1. Terminar PR móvil #1 y su CI. Tomar **HEAD fresco** del fork; no cherry-pick de paths desde este repo backend como si fueran ejecutables.
2. Migrar solo los archivos `source/` a rutas equivalentes del fork móvil; ejecutar Kotlin commonTest y Android build.
3. Vincular adaptadores Swift al target Xcode e incorporar PrivacyInfo/Info.plist de forma acotada (Bluetooth Usage, capacity reason). Compilar con runner macOS, probar en simulador e iPhone real.
4. Añadir panel Compose táctil `Diagnóstico · Sonda · Mantenimiento · Copias · Conexiones`. Arranque en **solo lectura**, sin peticiones de permisos automáticas.
5. Implementar iterativamente backup/export y limpieza con confirmaciones reales. Cada cambio por PR separado, sin tocar kernel/MCP de MANOJOS3.
6. Registrar `SOURCE/INSTALLED/CONFIGURED/LIVE/VERIFIED`, test y receipt; no dar 100% por una pantalla o CI mock.

## Evidencia
La rama contiene contratos y código SOURCE sin conexión a la app en marcha. No hay compilación Xcode, uso de Bluetooth real, grabación de fotos, instalación IPA ni cambios al Lenovo.

## Documentación Apple
- Wi-Fi: https://developer.apple.com/documentation/technotes/tn3111-ios-wifi-api-overview
- Bluetooth LE: https://developer.apple.com/documentation/corebluetooth
- Batería: https://developer.apple.com/documentation/uikit/uidevice/batterylevel
- Térmica: https://developer.apple.com/documentation/foundation/processinfo
- Espacio: https://developer.apple.com/documentation/foundation/checking-volume-storage-capacity
- Sensores: https://developer.apple.com/documentation/coremotion
- Fotos: https://developer.apple.com/documentation/photokit
- Atajos: https://developer.apple.com/documentation/appintents
- Wi-Fi Aware: https://developer.apple.com/documentation/wifiaware (iPhone 12+ y entitlement)

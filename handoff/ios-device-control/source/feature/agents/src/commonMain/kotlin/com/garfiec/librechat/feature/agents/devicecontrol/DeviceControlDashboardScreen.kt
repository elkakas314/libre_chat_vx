package com.garfiec.librechat.feature.agents.devicecontrol

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** Presentation-only; all UNKNOWN fields stay UNKNOWN until an iOS native readback. */
internal data class DeviceDashboardState(
    val sampledAt: String? = null,
    val batteryPercent: Int? = null,
    val chargingState: String = "UNKNOWN",
    val lowPowerMode: Boolean? = null,
    val thermalPressure: String = "UNKNOWN",
    val availableCapacityBytes: Long? = null,
    val networkPath: String = "UNKNOWN",
    val bleStatus: String = "NOT_SCANNED",
    val serverStatus: String = "NOT_CHECKED",
    val isActualDeviceReadback: Boolean = false,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun DeviceControlDashboardScreen(
    state: DeviceDashboardState,
    onBack: () -> Unit,
    onRefreshDevice: () -> Unit,
    onStartBoundedBluetoothScan: (() -> Unit)? = null,
    onPreviewAppCache: (() -> Unit)? = null,
    onPreviewAppBackup: (() -> Unit)? = null,
) {
    Scaffold(topBar = {
        TopAppBar(
            title = { Text("NOSTROMO · iPhone") },
            navigationIcon = {
                TextButton(onClick = onBack, modifier = Modifier.heightIn(min = 48.dp)) {
                    Text("Volver")
                }
            },
        )
    }) { insets ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(insets).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Text("Centro de control del dispositivo", style = MaterialTheme.typography.headlineSmall)
                Text(
                    if (state.isActualDeviceReadback)
                        "Lectura local · " + (state.sampledAt ?: "fecha desconocida")
                    else "NO VERIFICADO: esperando lectura nativa en el iPhone",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            item {
                OutlinedButton(onClick = onRefreshDevice, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
                    Text("Actualizar métricas locales")
                }
            }
            item {
                MetricCard(
                    "Batería y energía",
                    "Carga: " + (state.batteryPercent?.toString()?.plus("%") ?: "UNKNOWN") +
                        " · " + state.chargingState + " · Ahorro: " + (state.lowPowerMode?.toString() ?: "UNKNOWN")
                )
            }
            item { MetricCard("Estado térmico", state.thermalPressure + " (categoría, no °C)") }
            item {
                MetricCard(
                    "Almacenamiento",
                    state.availableCapacityBytes?.toString()?.plus(" bytes disponibles (aproximados)") ?: "UNKNOWN"
                )
            }
            item { MetricCard("Conectividad", state.networkPath + " · Backend: " + state.serverStatus) }
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text("Sonda Bluetooth LE", style = MaterialTheme.typography.titleMedium)
                        Text("Estado: " + state.bleStatus)
                        Text("Escaneo BLE solo con permiso y durante 15 segundos. Botón desactivado hasta conectar el adaptador.")
                        Button(
                            onClick = { onStartBoundedBluetoothScan?.invoke() },
                            enabled = onStartBoundedBluetoothScan != null,
                            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                        ) { Text("Buscar dispositivos BLE cercanos") }
                    }
                }
            }
            item {
                Text("Mantenimiento y copias", style = MaterialTheme.typography.titleLarge)
                Text("El inventario se habilitará tras conectar las acciones nativas. Ninguna operación se ejecuta automáticamente.")
                OutlinedButton(onClick = { onPreviewAppCache?.invoke() },
                    enabled = onPreviewAppCache != null, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
                    Text("Revisar cachés de NOSTROMO")
                }
                OutlinedButton(onClick = { onPreviewAppBackup?.invoke() },
                    enabled = onPreviewAppBackup != null, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
                    Text("Preparar inventario para copia de NOSTROMO")
                }
            }
            item {
                Text("MANOJOS3 · ORÁCULO · VX13", style = MaterialTheme.typography.titleMedium)
                Text("Conexiones futuras solo mediante NOSTROMO autenticado. Sin acceso directo ni ejecución material.")
            }
        }
    }
}

@Composable
private fun MetricCard(title: String, value: String) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(value, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

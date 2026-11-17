package com.garfiec.librechat.feature.agents.devicecontrol

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue

/**
 * One drop-in Compose screen. It can be reached from the current NostromoHub
 * without touching the existing AgentRepository or any active job.
 * Only local telemetry is wired; BLE, cleanup and backup buttons are DISABLED
 * until their iOS adapters have integration/permission/readback tests.
 */
@Composable
internal fun NostromoDeviceControlRoute(onBack: () -> Unit) {
    var state by remember { mutableStateOf(DeviceDashboardState()) }
    DeviceControlDashboardScreen(
        state = state,
        onBack = onBack,
        onRefreshDevice = {
            state = readDeviceTelemetry().toDashboard()
        },
    )
}

private fun DeviceTelemetry.toDashboard(): DeviceDashboardState = DeviceDashboardState(
    sampledAt = observedAtEpochMillis?.toString(),
    batteryPercent = batteryPercent,
    chargingState = chargingState,
    lowPowerMode = lowPowerMode,
    thermalPressure = thermalPressure,
    availableCapacityBytes = availableCapacityBytes,
    networkPath = networkPath,
    isActualDeviceReadback = isActualDeviceReadback,
)

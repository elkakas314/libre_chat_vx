package com.garfiec.librechat.feature.agents.devicecontrol

/**
 * All measurements are device-local. UNKNOWN is an allowed result, not a failure or a
 * fabricated value. This contract has no network access and cannot mutate device data.
 */
internal data class DeviceTelemetry(
    val observedAtEpochMillis: Long? = null,
    val batteryPercent: Int? = null,
    val chargingState: String = "UNKNOWN",
    val lowPowerMode: Boolean? = null,
    val thermalPressure: String = "UNKNOWN",
    val availableCapacityBytes: Long? = null,
    val totalCapacityBytes: Long? = null,
    val networkPath: String = "UNKNOWN",
    val isActualDeviceReadback: Boolean = false,
)

/** Fresh synchronous, on-demand snapshot. No background polling or permissions prompt. */
internal expect fun readDeviceTelemetry(): DeviceTelemetry

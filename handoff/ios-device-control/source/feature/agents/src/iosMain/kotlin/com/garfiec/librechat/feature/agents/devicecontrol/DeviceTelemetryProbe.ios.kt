package com.garfiec.librechat.feature.agents.devicecontrol

import platform.Foundation.NSDate
import platform.Foundation.NSFileManager
import platform.Foundation.NSFileSystemFreeSize
import platform.Foundation.NSFileSystemSize
import platform.Foundation.NSHomeDirectory
import platform.Foundation.NSNumber
import platform.Foundation.NSProcessInfo
import platform.Foundation.isLowPowerModeEnabled
import platform.UIKit.UIDevice
import platform.UIKit.UIDeviceBatteryStateCharging
import platform.UIKit.UIDeviceBatteryStateFull
import platform.UIKit.UIDeviceBatteryStateUnplugged

/**
 * On-demand iOS metrics from public native APIs.
 * No Bluetooth permission, no background service, no file mutation or transmission.
 * Network state remains UNKNOWN until the existing IosConnectivityObserver is wired.
 */
internal actual fun readDeviceTelemetry(): DeviceTelemetry {
    val device = UIDevice.currentDevice
    val previousMonitoring = device.batteryMonitoringEnabled
    device.batteryMonitoringEnabled = true
    val level = device.batteryLevel
    val battery = if (level >= 0f && level <= 1f) (level * 100).toInt() else null
    val charging = when (device.batteryState) {
        UIDeviceBatteryStateCharging -> "charging"
        UIDeviceBatteryStateFull -> "full"
        UIDeviceBatteryStateUnplugged -> "unplugged"
        else -> "unknown"
    }
    device.batteryMonitoringEnabled = previousMonitoring

    val process = NSProcessInfo.processInfo
    val thermal = when (process.thermalState.toInt()) {
        0 -> "nominal"
        1 -> "fair"
        2 -> "serious"
        3 -> "critical"
        else -> "unknown"
    }
    val capacity = NSFileManager.defaultManager
        .attributesOfFileSystemForPath(NSHomeDirectory(), error = null)
    val free = (capacity?.get(NSFileSystemFreeSize) as? NSNumber)?.longLongValue
    val total = (capacity?.get(NSFileSystemSize) as? NSNumber)?.longLongValue

    return DeviceTelemetry(
        observedAtEpochMillis = (NSDate().timeIntervalSince1970 * 1000.0).toLong(),
        batteryPercent = battery,
        chargingState = charging,
        lowPowerMode = process.isLowPowerModeEnabled(),
        thermalPressure = thermal,
        availableCapacityBytes = free,
        totalCapacityBytes = total,
        networkPath = "UNKNOWN_USE_EXISTING_IOS_CONNECTIVITY_OBSERVER",
        isActualDeviceReadback = true,
    )
}

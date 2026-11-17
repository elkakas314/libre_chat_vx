package com.garfiec.librechat.feature.agents.devicecontrol

/** JVM-only no-dependency gate; compile next to DeviceControlPolicy.kt with kotlinc. */
fun main() {
    var passed = 0
    fun verify(value: Boolean, message: String) { check(value) { message }; passed++ }
    verify(IOSDeviceCatalog.entries.size == DeviceCapability.entries.size, "catalogue")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.BATTERY_PERCENT)) == ControlDecision.ALLOW_R0_LOCAL, "battery R0")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.WIFI_ALL_NETWORKS)) == ControlDecision.DENY, "wifi scan")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.OTHER_APP_CACHE_DELETE)) == ControlDecision.DENY, "other app cache")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.REPAIR_IOS)) == ControlDecision.DENY, "repair iOS")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.BLE_DISCOVERY)) == ControlDecision.DENY, "BLE opt-in")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.BLE_DISCOVERY, userInitiated = true)) == ControlDecision.REQUIRE_LOCAL_PERMISSION, "BLE permission")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.BLE_DISCOVERY, userInitiated = true, nativePermissionGranted = true)) == ControlDecision.ALLOW_R0_LOCAL, "BLE granted eligible")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.APP_CACHE_CLEAN, userInitiated = true, nativePermissionGranted = true)) == ControlDecision.REQUIRE_EXPLICIT_APPROVAL, "cache write not executable")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.NETWORK_PATH, target = TargetSystem.VX13, deviceOnline = true, destinationIsAuthenticatedNostromoBackend = true)) == ControlDecision.DENY, "remote sharing opt-in")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.NETWORK_PATH, target = TargetSystem.VX13, deviceOnline = true, destinationIsAuthenticatedNostromoBackend = true, outboundTelemetryConsent = true)) == ControlDecision.ALLOW_R0_LOCAL, "remote opt-in")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.VOLUME_CAPACITY, transmitsTelemetryOffDevice = true, deviceOnline = true, destinationIsAuthenticatedNostromoBackend = true, outboundTelemetryConsent = true)) == ControlDecision.DENY, "Apple diskspace off-device prohibition")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.BATTERY_PERCENT, transmitsTelemetryOffDevice = true, deviceOnline = true, destinationIsAuthenticatedNostromoBackend = true)) == ControlDecision.DENY, "battery sharing without opt-in")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.BATTERY_PERCENT, transmitsTelemetryOffDevice = true, deviceOnline = true, destinationIsAuthenticatedNostromoBackend = true, outboundTelemetryConsent = true)) == ControlDecision.ALLOW_R0_LOCAL, "battery sharing with opt-in")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.BLE_DISCOVERY, appForeground = false, nativePermissionGranted = true, userInitiated = true)) == ControlDecision.DENY, "background BLE")
    verify(IOSDevicePolicy.decide(DeviceActionRequest(DeviceCapability.BATTERY_PERCENT, attemptsMaterialEffectOnRemoteSystem = true)) == ControlDecision.DENY, "remote material writes")
    println("PASS $passed/$passed policy assertions; SOURCE/JVM only")
}

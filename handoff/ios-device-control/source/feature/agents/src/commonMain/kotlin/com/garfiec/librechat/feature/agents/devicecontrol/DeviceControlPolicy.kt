package com.garfiec.librechat.feature.agents.devicecontrol

/** iPhone is a read-only sensor/client by default; it cannot authorize target execution. */
internal enum class DeviceCapability {
    BATTERY_PERCENT, CHARGING_STATE, LOW_POWER_MODE, THERMAL_PRESSURE,
    VOLUME_CAPACITY, APP_CACHE_USAGE, NETWORK_PATH, SERVER_REACHABILITY,
    BLE_DISCOVERY, MOTION_SENSOR, LOCATION_SAMPLE, PHOTO_INVENTORY,
    APP_DOCUMENT_EXPORT, APP_BACKUP, APP_CACHE_CLEAN, PHOTO_DELETE,
    SHORTCUT_LAUNCH, WIFI_CURRENT_SSID,
    BATTERY_HEALTH, WIFI_ALL_NETWORKS, OTHER_APP_CACHE_DELETE,
    INSTALL_OTHER_APPS, REPAIR_IOS, SYSTEM_BACKUP
}
internal enum class DeviceOperationRisk { READ_ONLY, USER_CONSENT, MATERIAL_WRITE, UNSUPPORTED }
internal enum class DataBoundary { APP_OWNED, DEVICE_SUMMARY, USER_SELECTED, PUBLIC_BEACONS, SYSTEM_RESTRICTED }
internal enum class FeatureState { SUPPORTED_BY_PUBLIC_API, PERMISSION_REQUIRED, PROPOSED, NOT_AVAILABLE_TO_APP }

internal data class CapabilityContract(
    val capability: DeviceCapability,
    val risk: DeviceOperationRisk,
    val boundary: DataBoundary,
    val state: FeatureState,
    val platformApi: String,
    val description: String,
    val foregroundOnly: Boolean = true,
)

/** Public API capability catalogue, NOT evidence of implementation or installation. */
internal object IOSDeviceCatalog {
    val entries: List<CapabilityContract> = listOf(
        c(DeviceCapability.BATTERY_PERCENT, DeviceOperationRisk.READ_ONLY, DataBoundary.DEVICE_SUMMARY,
            FeatureState.SUPPORTED_BY_PUBLIC_API, "UIDevice.batteryLevel", "Charge estimate, not battery health"),
        c(DeviceCapability.CHARGING_STATE, DeviceOperationRisk.READ_ONLY, DataBoundary.DEVICE_SUMMARY,
            FeatureState.SUPPORTED_BY_PUBLIC_API, "UIDevice.batteryState", "Charging state"),
        c(DeviceCapability.LOW_POWER_MODE, DeviceOperationRisk.READ_ONLY, DataBoundary.DEVICE_SUMMARY,
            FeatureState.SUPPORTED_BY_PUBLIC_API, "ProcessInfo.isLowPowerModeEnabled", "Low power mode"),
        c(DeviceCapability.THERMAL_PRESSURE, DeviceOperationRisk.READ_ONLY, DataBoundary.DEVICE_SUMMARY,
            FeatureState.SUPPORTED_BY_PUBLIC_API, "ProcessInfo.thermalState", "Categorical thermal pressure, not temperature"),
        c(DeviceCapability.VOLUME_CAPACITY, DeviceOperationRisk.READ_ONLY, DataBoundary.DEVICE_SUMMARY,
            FeatureState.SUPPORTED_BY_PUBLIC_API, "URLResourceValues.volumeAvailableCapacityForImportantUsage", "Free capacity estimate"),
        c(DeviceCapability.APP_CACHE_USAGE, DeviceOperationRisk.READ_ONLY, DataBoundary.APP_OWNED,
            FeatureState.PROPOSED, "FileManager sandbox/Caches", "App-only cache inventory"),
        c(DeviceCapability.NETWORK_PATH, DeviceOperationRisk.READ_ONLY, DataBoundary.DEVICE_SUMMARY,
            FeatureState.SUPPORTED_BY_PUBLIC_API, "NWPathMonitor", "Wi-Fi/cellular/cost/reachability"),
        c(DeviceCapability.SERVER_REACHABILITY, DeviceOperationRisk.READ_ONLY, DataBoundary.DEVICE_SUMMARY,
            FeatureState.PROPOSED, "URLSession pinned HTTPS", "Only preconfigured private backend"),
        c(DeviceCapability.BLE_DISCOVERY, DeviceOperationRisk.USER_CONSENT, DataBoundary.PUBLIC_BEACONS,
            FeatureState.PERMISSION_REQUIRED, "CoreBluetooth", "Short user-started foreground BLE scan"),
        c(DeviceCapability.MOTION_SENSOR, DeviceOperationRisk.USER_CONSENT, DataBoundary.DEVICE_SUMMARY,
            FeatureState.PROPOSED, "CoreMotion", "Short sensor sample, hardware-dependent"),
        c(DeviceCapability.LOCATION_SAMPLE, DeviceOperationRisk.USER_CONSENT, DataBoundary.USER_SELECTED,
            FeatureState.PERMISSION_REQUIRED, "CoreLocation", "One-time location permission"),
        c(DeviceCapability.PHOTO_INVENTORY, DeviceOperationRisk.USER_CONSENT, DataBoundary.USER_SELECTED,
            FeatureState.PERMISSION_REQUIRED, "PhotoKit", "Limited library local duplicate preview"),
        c(DeviceCapability.APP_DOCUMENT_EXPORT, DeviceOperationRisk.USER_CONSENT, DataBoundary.APP_OWNED,
            FeatureState.PROPOSED, "UIDocumentPicker", "User-selected app document export"),
        c(DeviceCapability.APP_BACKUP, DeviceOperationRisk.MATERIAL_WRITE, DataBoundary.APP_OWNED,
            FeatureState.PROPOSED, "CryptoKit/FileProvider", "App-only encrypted backup with restore proof"),
        c(DeviceCapability.APP_CACHE_CLEAN, DeviceOperationRisk.MATERIAL_WRITE, DataBoundary.APP_OWNED,
            FeatureState.PROPOSED, "FileManager app sandbox", "Explicit disposable allowlist only"),
        c(DeviceCapability.PHOTO_DELETE, DeviceOperationRisk.MATERIAL_WRITE, DataBoundary.USER_SELECTED,
            FeatureState.PERMISSION_REQUIRED, "PhotoKit performChanges", "Only selected reviewed photos"),
        c(DeviceCapability.SHORTCUT_LAUNCH, DeviceOperationRisk.USER_CONSENT, DataBoundary.USER_SELECTED,
            FeatureState.PROPOSED, "AppIntents", "Allowlisted user action"),
        c(DeviceCapability.WIFI_CURRENT_SSID, DeviceOperationRisk.USER_CONSENT, DataBoundary.DEVICE_SUMMARY,
            FeatureState.PERMISSION_REQUIRED, "NEHotspotNetwork.fetchCurrent", "Requires entitlement and eligibility"),
        unavailable(DeviceCapability.BATTERY_HEALTH, "Battery maximum health not available to ordinary apps"),
        unavailable(DeviceCapability.WIFI_ALL_NETWORKS, "No general-purpose Wi-Fi environment scan API"),
        unavailable(DeviceCapability.OTHER_APP_CACHE_DELETE, "Other apps' sandbox inaccessible"),
        unavailable(DeviceCapability.INSTALL_OTHER_APPS, "Arbitrary unattended installs require approved distribution/MDM"),
        unavailable(DeviceCapability.REPAIR_IOS, "No OS/hardware repair through app sandbox"),
        unavailable(DeviceCapability.SYSTEM_BACKUP, "Cannot start full iCloud/Finder backup through ordinary app"),
    )

    init { require(entries.map { it.capability }.toSet().size == DeviceCapability.entries.size) }
    fun get(capability: DeviceCapability): CapabilityContract = entries.first { it.capability == capability }
    private fun c(
        capability: DeviceCapability, risk: DeviceOperationRisk, boundary: DataBoundary,
        state: FeatureState, api: String, explanation: String,
    ) = CapabilityContract(capability, risk, boundary, state, api, explanation)
    private fun unavailable(capability: DeviceCapability, reason: String) = CapabilityContract(
        capability, DeviceOperationRisk.UNSUPPORTED, DataBoundary.SYSTEM_RESTRICTED,
        FeatureState.NOT_AVAILABLE_TO_APP, "NO_PUBLIC_API", reason
    )
}

internal enum class TargetSystem { NOSTROMO, MANOJOS3, ORACULO, VX13 }
internal enum class ControlDecision { ALLOW_R0_LOCAL, REQUIRE_LOCAL_PERMISSION, REQUIRE_EXPLICIT_APPROVAL, DENY }
internal data class DeviceActionRequest(
    val capability: DeviceCapability,
    val target: TargetSystem = TargetSystem.NOSTROMO,
    val userInitiated: Boolean = false,
    val appForeground: Boolean = true,
    val deviceOnline: Boolean = false,
    val nativePermissionGranted: Boolean = false,
    val scopedOneTimeApproval: Boolean = false,
    val destinationIsAuthenticatedNostromoBackend: Boolean = false,
    val attemptsMaterialEffectOnRemoteSystem: Boolean = false,
)

/** This policy never authorizes actual material execution; a scoped executor with receipt is required. */
internal object IOSDevicePolicy {
    fun decide(request: DeviceActionRequest): ControlDecision {
        val contract = IOSDeviceCatalog.get(request.capability)
        if (contract.risk == DeviceOperationRisk.UNSUPPORTED ||
            contract.state == FeatureState.NOT_AVAILABLE_TO_APP ||
            request.attemptsMaterialEffectOnRemoteSystem) return ControlDecision.DENY
        if (request.target != TargetSystem.NOSTROMO &&
            (!request.deviceOnline || !request.destinationIsAuthenticatedNostromoBackend)) return ControlDecision.DENY
        if (contract.foregroundOnly && !request.appForeground) return ControlDecision.DENY
        if (contract.risk == DeviceOperationRisk.READ_ONLY) return ControlDecision.ALLOW_R0_LOCAL
        if (!request.userInitiated) return ControlDecision.DENY
        if (!request.nativePermissionGranted) return ControlDecision.REQUIRE_LOCAL_PERMISSION
        // In this SOURCE-only module no action can proceed to writes even after the user
        // clicks yes. Executor must bind resource/hash/identity/grant and perform readback.
        if (contract.risk == DeviceOperationRisk.MATERIAL_WRITE) return ControlDecision.REQUIRE_EXPLICIT_APPROVAL
        return ControlDecision.ALLOW_R0_LOCAL
    }
}

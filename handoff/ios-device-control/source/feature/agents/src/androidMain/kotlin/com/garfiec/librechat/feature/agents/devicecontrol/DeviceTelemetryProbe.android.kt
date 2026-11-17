package com.garfiec.librechat.feature.agents.devicecontrol

/** The module is designed for iPhone; Android must not claim iOS sensor readback. */
internal actual fun readDeviceTelemetry(): DeviceTelemetry =
    DeviceTelemetry(networkPath = "UNAVAILABLE_ANDROID_ADAPTER_NOT_INSTALLED")

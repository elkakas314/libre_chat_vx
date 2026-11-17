import Foundation
import UIKit
import Network
import CoreBluetooth

/// Read-only iPhone diagnostics. No host control, remote RPC, background scans or cleanup.
/// Deferred: add to the *mobile* Xcode target only after the active Switchboard PR is stable.
struct NostromoDeviceSnapshot: Codable {
    let sampledAt: Date
    let batteryPercent: Int?
    let chargingState: String
    let lowPowerMode: Bool
    let thermalPressure: String
    let availableCapacityBytes: Int64?
    let totalCapacityBytes: Int64?
    let network: NostromoNetworkPath
    let schema: String = "nostromo.ios.device.snapshot.v1"
}
struct NostromoNetworkPath: Codable, Sendable {
    let status: String
    let interfaceKind: String
    let expensive: Bool?
    let constrained: Bool?
    static let unknown = NostromoNetworkPath(
        status: "unknown", interfaceKind: "unknown", expensive: nil, constrained: nil
    )
}

/// Public device summary; no serial, IMEI, health %, cycle count, ambient SSIDs or user documents.
@MainActor
final class NostromoIOSProbe {
    private let monitor = NWPathMonitor()
    private let networkQueue = DispatchQueue(label: "nostromo.ios.path.monitor")
    private var currentPath: NostromoNetworkPath = .unknown
    private var observing = false

    func startNetworkObservation() {
        guard !observing else { return }
        observing = true
        monitor.pathUpdateHandler = { [weak self] path in
            let kind: String
            if path.usesInterfaceType(.wifi) { kind = "wifi" }
            else if path.usesInterfaceType(.cellular) { kind = "cellular" }
            else if path.usesInterfaceType(.wiredEthernet) { kind = "wired" }
            else { kind = "other" }
            let result = NostromoNetworkPath(
                status: path.status == .satisfied ? "satisfied" : "unavailable",
                interfaceKind: kind,
                expensive: path.isExpensive,
                constrained: path.isConstrained
            )
            Task { @MainActor [weak self] in self?.currentPath = result }
        }
        monitor.start(queue: networkQueue)
    }

    func stopNetworkObservation() {
        guard observing else { return }
        observing = false
        monitor.cancel()
        // NWPathMonitor cannot restart after cancellation: create a new adapter when reopened.
    }

    func snapshot() -> NostromoDeviceSnapshot {
        let device = UIDevice.current
        device.isBatteryMonitoringEnabled = true
        let level = device.batteryLevel
        let battery = (0.0...1.0).contains(level) ? Int((level * 100).rounded()) : nil
        let charging: String
        switch device.batteryState {
        case .charging: charging = "charging"
        case .full: charging = "full"
        case .unplugged: charging = "unplugged"
        default: charging = "unknown"
        }
        let process = ProcessInfo.processInfo
        let thermal: String
        switch process.thermalState {
        case .nominal: thermal = "nominal"
        case .fair: thermal = "fair"
        case .serious: thermal = "serious"
        case .critical: thermal = "critical"
        @unknown default: thermal = "unknown"
        }
        let folder = URL(fileURLWithPath: NSHomeDirectory(), isDirectory: true)
        let storage = try? folder.resourceValues(forKeys: [
            .volumeAvailableCapacityForImportantUsageKey, .volumeTotalCapacityKey
        ])
        return NostromoDeviceSnapshot(
            sampledAt: Date(),
            batteryPercent: battery,
            chargingState: charging,
            lowPowerMode: process.isLowPowerModeEnabled,
            thermalPressure: thermal,
            availableCapacityBytes: storage?.volumeAvailableCapacityForImportantUsage,
            totalCapacityBytes: storage?.volumeTotalCapacity.map(Int64.init),
            network: currentPath
        )
    }
}

struct NostromoBLEObservation: Codable {
    let displayName: String
    let signalStrengthDbm: Int
    let sampledAt: Date
}

/// Foreground-only BLE discovery after an explicit tap; maximum 15 seconds.
/// Does NOT pair, connect, read characteristic data or transmit device identifiers.
@MainActor
final class NostromoBLEProbe: NSObject, CBCentralManagerDelegate {
    private var manager: CBCentralManager?
    private var timeout: Timer?
    private var foregroundObserver: NSObjectProtocol?
    private var discoveries: [String: NostromoBLEObservation] = [:]
    private(set) var status: String = "not_started"
    var onUpdate: (([NostromoBLEObservation], String) -> Void)?

    func beginUserInitiatedScan(maxSeconds: TimeInterval = 10) {
        stop()
        guard UIApplication.shared.applicationState == .active else {
            status = "foreground_required"
            report()
            return
        }
        discoveries.removeAll()
        status = "awaiting_bluetooth_permission"
        foregroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.willResignActiveNotification,
            object: nil, queue: .main
        ) { [weak self] _ in Task { @MainActor in self?.stop() } }
        manager = CBCentralManager(delegate: self, queue: .main)
        timeout = Timer.scheduledTimer(withTimeInterval: min(max(maxSeconds, 1), 15), repeats: false) {
            [weak self] _ in Task { @MainActor in self?.stop() }
        }
        report()
    }

    func stop() {
        manager?.stopScan()
        timeout?.invalidate()
        timeout = nil
        if let observer = foregroundObserver {
            NotificationCenter.default.removeObserver(observer)
            foregroundObserver = nil
        }
        manager = nil
        if status == "scanning" { status = "finished" }
        report()
    }

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        guard UIApplication.shared.applicationState == .active else { stop(); return }
        switch central.state {
        case .poweredOn:
            status = "scanning"
            central.scanForPeripherals(withServices: nil, options: [
                CBCentralManagerScanOptionAllowDuplicatesKey: false
            ])
        case .unauthorized: status = "permission_denied"; stop()
        case .poweredOff: status = "bluetooth_off"; stop()
        case .unsupported: status = "unsupported"; stop()
        default: status = "unavailable"
        }
        report()
    }

    func centralManager(
        _ central: CBCentralManager,
        didDiscover peripheral: CBPeripheral,
        advertisementData: [String: Any],
        rssi RSSI: NSNumber
    ) {
        guard status == "scanning", discoveries.count < 32 else { return }
        let label = (advertisementData[CBAdvertisementDataLocalNameKey] as? String)
            ?? peripheral.name ?? "BLE peripheral"
        // Local-only deduplication identifier. Never serialized or uploaded.
        discoveries[peripheral.identifier.uuidString] = NostromoBLEObservation(
            displayName: String(label.prefix(48)),
            signalStrengthDbm: RSSI.intValue,
            sampledAt: Date()
        )
        report()
    }

    private func report() {
        onUpdate?(Array(discoveries.values).sorted {
            $0.signalStrengthDbm > $1.signalStrengthDbm
        }, status)
    }
}

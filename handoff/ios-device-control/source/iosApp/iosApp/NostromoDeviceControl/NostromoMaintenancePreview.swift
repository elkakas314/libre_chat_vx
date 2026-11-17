import Foundation

/// Local inventory/dry-run. It neither deletes files nor backs them up on its own.
struct NostromoMaintenanceItem: Codable {
    let displayPath: String
    let byteCount: Int64
    let isDirectory: Bool
}
struct NostromoMaintenancePreview: Codable {
    let sampledAt: Date
    let scope: String
    let entries: [NostromoMaintenanceItem]
    let totalBytes: Int64
    let truncated: Bool
    let destructiveActionPerformed: Bool = false
    let schema: String = "nostromo.ios.maintenance.preview.v1"
}
struct NostromoSupportFinding: Codable {
    let category: String
    let severity: String
    let recommendation: String
    let actionTaken: Bool = false
}

/// No other app's files, no Keychain/token paths, no automatic cleanup.
/// Add a separate audited R2 executor AFTER explicit per-resource authorization.
final class NostromoMaintenancePlanner {
    enum InventoryError: Error { case invalidRoot }
    private let files = FileManager.default

    func previewAppOwnedDocuments(maxEntries: Int = 200) throws -> NostromoMaintenancePreview {
        guard let root = files.urls(for: .documentDirectory, in: .userDomainMask).first else {
            throw InventoryError.invalidRoot
        }
        return try preview(root: root, scope: "APP_DOCUMENTS", maxEntries: maxEntries)
    }

    func previewAppOwnedCaches(maxEntries: Int = 200) throws -> NostromoMaintenancePreview {
        guard let root = files.urls(for: .cachesDirectory, in: .userDomainMask).first else {
            throw InventoryError.invalidRoot
        }
        return try preview(root: root, scope: "APP_CACHE_READONLY", maxEntries: maxEntries)
    }

    func supportFindings(for snapshot: NostromoDeviceSnapshot) -> [NostromoSupportFinding] {
        var findings: [NostromoSupportFinding] = []
        if let percent = snapshot.batteryPercent, percent <= 15, snapshot.chargingState != "charging" {
            findings.append(.init(category: "battery", severity: "notice",
                recommendation: "Charge the iPhone or enable Low Power Mode in Settings."))
        }
        if snapshot.thermalPressure == "serious" || snapshot.thermalPressure == "critical" {
            findings.append(.init(category: "thermal", severity: "warning",
                recommendation: "Pause intensive work and allow the device to cool."))
        }
        if snapshot.network.status != "satisfied" {
            findings.append(.init(category: "network", severity: "notice",
                recommendation: "Check connectivity before remote NOSTROMO tasks."))
        }
        if let bytes = snapshot.availableCapacityBytes, bytes < 1_000_000_000 {
            findings.append(.init(category: "storage", severity: "warning",
                recommendation: "Review storage and app-owned cache. No automatic deletion."))
        }
        return findings
    }

    private func preview(root: URL, scope: String, maxEntries: Int) throws -> NostromoMaintenancePreview {
        let rootURL = root.standardizedFileURL
        let cap = min(max(1, maxEntries), 500)
        let keys: [URLResourceKey] = [
            .isRegularFileKey, .isDirectoryKey, .isSymbolicLinkKey, .fileSizeKey
        ]
        guard let enumerator = files.enumerator(
            at: rootURL, includingPropertiesForKeys: keys, options: [.skipsHiddenFiles],
            errorHandler: { _, _ in true }
        ) else {
            throw InventoryError.invalidRoot
        }

        var entries: [NostromoMaintenanceItem] = []
        var truncated = false
        for case let fileURL as URL in enumerator {
            guard entries.count < cap else { truncated = true; break }
            let url = fileURL.standardizedFileURL
            guard url.path.hasPrefix(rootURL.path + "/") else {
                enumerator.skipDescendants()
                continue
            }
            let values = try? url.resourceValues(forKeys: Set(keys))
            if values?.isSymbolicLink == true {
                enumerator.skipDescendants()
                continue
            }
            let relative = String(url.path.dropFirst(rootURL.path.count + 1))
            entries.append(.init(displayPath: relative,
                byteCount: Int64(values?.fileSize ?? 0),
                isDirectory: values?.isDirectory == true))
        }
        return NostromoMaintenancePreview(
            sampledAt: Date(), scope: scope, entries: entries,
            totalBytes: entries.reduce(0) { $0 + $1.byteCount }, truncated: truncated
        )
    }
}

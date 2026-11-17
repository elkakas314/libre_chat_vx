import Foundation
import CryptoKit

/// Local integrity manifest ONLY. No files copied, no upload, no encryption, no system backup.
struct NostromoBackupEntry: Codable {
    let relativePath: String
    let sizeBytes: Int64
    let sha256: String
}
struct NostromoBackupManifest: Codable {
    let createdAt: Date
    let scope: String
    let entries: [NostromoBackupEntry]
    let totalBytes: Int64
    let backupPerformed: Bool = false
    let restoreVerified: Bool = false
    let schema: String = "nostromo.ios.backup.manifest.v1"
}

/// User-initiated, app-owned Documents only, strictly bounded size and number.
final class NostromoBackupManifestBuilder {
    enum BackupError: Error {
        case missingDocumentsRoot, outsideAppDocuments, notRegularFile,
             exceedsBudget, cannotRead, changedDuringRead
    }
    private let manager = FileManager.default
    private let maxFiles = 20
    private let maxTotalBytes: Int64 = 512 * 1024 * 1024

    func preview(selectedFileURLs: [URL]) throws -> NostromoBackupManifest {
        guard let root = manager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            throw BackupError.missingDocumentsRoot
        }
        let normalizedRoot = root.resolvingSymlinksInPath().standardizedFileURL
        guard selectedFileURLs.count <= maxFiles else { throw BackupError.exceedsBudget }
        var totalBytes: Int64 = 0
        var entries: [NostromoBackupEntry] = []
        for original in selectedFileURLs {
            let originalURL = original.standardizedFileURL
            let originalAttrs = try originalURL.resourceValues(forKeys: [.isSymbolicLinkKey])
            guard originalAttrs.isSymbolicLink != true else { throw BackupError.notRegularFile }
            let url = originalURL.resolvingSymlinksInPath().standardizedFileURL
            guard url.path.hasPrefix(normalizedRoot.path + "/") else {
                throw BackupError.outsideAppDocuments
            }
            let attrs = try url.resourceValues(forKeys: [
                .isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey
            ])
            guard attrs.isRegularFile == true, attrs.isSymbolicLink != true else {
                throw BackupError.notRegularFile
            }
            let size = Int64(attrs.fileSize ?? 0)
            guard size >= 0, totalBytes <= maxTotalBytes - size else {
                throw BackupError.exceedsBudget
            }
            let digest = try sha256(of: url)
            guard digest.byteCount == size else { throw BackupError.changedDuringRead }
            totalBytes += size
            entries.append(.init(
                relativePath: String(url.path.dropFirst(normalizedRoot.path.count + 1)),
                sizeBytes: size, sha256: digest.hash
            ))
        }
        return NostromoBackupManifest(
            createdAt: Date(), scope: "APP_DOCUMENTS_SELECTED",
            entries: entries, totalBytes: totalBytes
        )
    }

    private func sha256(of url: URL) throws -> (hash: String, byteCount: Int64) {
        guard let stream = InputStream(url: url) else { throw BackupError.cannotRead }
        stream.open()
        defer { stream.close() }
        var digest = SHA256()
        var buffer = [UInt8](repeating: 0, count: 64 * 1024)
        var total: Int64 = 0
        while true {
            let read = stream.read(&buffer, maxLength: buffer.count)
            if read < 0 { throw BackupError.cannotRead }
            if read == 0 { break }
            total += Int64(read)
            guard total <= maxTotalBytes else { throw BackupError.exceedsBudget }
            digest.update(data: Data(buffer.prefix(read)))
        }
        return (digest.finalize().map { String(format: "%02x", $0) }.joined(), total)
    }
}

import Foundation
import UIKit

/// System-mediated export of explicitly selected, app-owned documents.
/// The caller must present this picker after a user tap. NO cloud destination is selected by code.
/// Picker completion only means export UI finished; it does NOT prove a durable backup/restore.
@MainActor
final class NostromoDocumentExport {
    private let manifestBuilder = NostromoBackupManifestBuilder()

    struct PreparedExport {
        let manifest: NostromoBackupManifest
        let picker: UIDocumentPickerViewController
        let completionEvidence: String = "UNVERIFIED_UNTIL_USER_READBACK_AND_RESTORE"
    }

    func prepareAfterUserSelection(fileURLs: [URL]) throws -> PreparedExport {
        // This validates root/symlink policy, maximum file count/size and computes SHA-256.
        // No network transmission or background sync is performed.
        let manifest = try manifestBuilder.preview(selectedFileURLs: fileURLs)
        guard !manifest.entries.isEmpty else { throw ExportError.emptySelection }
        let picker = UIDocumentPickerViewController(forExporting: fileURLs, asCopy: true)
        picker.allowsMultipleSelection = fileURLs.count > 1
        return PreparedExport(manifest: manifest, picker: picker)
    }

    enum ExportError: Error { case emptySelection }
}

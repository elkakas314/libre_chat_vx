import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).resolve().parents[1] / "nostromo-backup-audit-r0.py"
spec = importlib.util.spec_from_file_location("nostromo_backup_audit", SCRIPT)
audit_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit_module)


class BackupAuditR0Tests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="nostromo-backup-test-")
        self.addCleanup(self.tmp.cleanup)
        self.home = Path(self.tmp.name)
        self.installed = self.home / "installed"
        self.installed.mkdir()

    def directory(self, name, file="a.txt", content="data"):
        root = self.home / name
        root.mkdir()
        (root / file).write_text(content, encoding="utf-8")
        return root

    def test_duplicate_is_only_review_not_auto_delete(self):
        a = self.directory("a")
        b = self.directory("b")
        report = audit_module.audit([str(a), str(b)], str(self.installed))
        self.assertEqual(report["backups"][0]["classification"], "KEEP_FIRST_VALID_COPY")
        self.assertEqual(report["backups"][1]["classification"], "POSSIBLE_DUPLICATE_REVIEW_ONLY")
        self.assertEqual(report["backups"][1]["duplicateOf"], str(a))
        self.assertFalse(report["backups"][1]["canQuarantine"])
        self.assertFalse(report["backups"][1]["canPurge"])

    def test_unique_backup_is_not_deleted(self):
        a = self.directory("a", content="alpha")
        b = self.directory("b", content="beta")
        report = audit_module.audit([str(a), str(b)], str(self.installed))
        self.assertEqual(report["backups"][0]["classification"], "KEEP_FIRST_VALID_COPY")
        self.assertEqual(report["backups"][1]["classification"], "KEEP_FIRST_VALID_COPY")

    def test_symlink_to_outside_is_not_followed_or_approved(self):
        outside = self.directory("outside", content="DO_NOT_INSPECT")
        root = self.directory("b")
        (root / "escape").symlink_to(outside, target_is_directory=True)
        result = audit_module.audit_dir(str(root))
        self.assertEqual(result["status"], "UNKNOWN_PRESERVE")
        self.assertEqual(result["symlinkCount"], 1)
        self.assertIn("SYMLINK_PRESENT_NO_FOLLOW", result["issues"])

    def test_root_parent_symlink_is_rejected_before_walking_or_hashing(self):
        outside = self.home / "external"
        (outside / "backup").mkdir(parents=True)
        marker = outside / "backup" / "unique.txt"
        marker.write_text("DO_NOT_READ_OUTSIDE", encoding="utf-8")
        link = self.home / "alias"
        link.symlink_to(outside, target_is_directory=True)
        root = link / "backup"  # final is a real directory, but parent is link
        original = marker.read_bytes()
        with mock.patch.object(audit_module, "snapshot", side_effect=AssertionError("UNSAFE_WALK")) as walk, \
             mock.patch.object(audit_module, "hash_file", side_effect=AssertionError("UNSAFE_READ")) as read:
            result = audit_module.audit_dir(str(root))
            walk.assert_not_called()
            read.assert_not_called()
        self.assertEqual(result["status"], "UNKNOWN_PRESERVE")
        self.assertIn("ROOT_ANCESTOR_UNSAFE", result["issues"])
        self.assertIsNone(result["contentSha256"])
        self.assertEqual(marker.read_bytes(), original)

    def test_snapshot_and_file_hash_refuse_symlink_parent(self):
        root = self.directory("real")
        link = self.home / "via-link"
        link.symlink_to(root, target_is_directory=True)
        scoped = link / "a.txt"
        listing, issues = audit_module.snapshot(str(link), 20)
        self.assertEqual(listing, {})
        self.assertIn("ROOT_ANCESTOR_UNSAFE", issues)
        with mock.patch.object(audit_module.os, "open", side_effect=AssertionError("MUST_NOT_OPEN")) as opened:
            with self.assertRaisesRegex(ValueError, "FILE_ANCESTOR_UNSAFE"):
                audit_module.hash_file(str(scoped), audit_module.identity(scoped.stat()), 100)
            opened.assert_not_called()

    def test_secret_contents_not_read_or_echoed(self):
        root = self.directory("a", file=".env", content="SUPER_SECRET_VALUE")
        result = audit_module.audit_dir(str(root))
        self.assertEqual(result["sensitiveCount"], 1)
        self.assertEqual(result["hashedBytes"], 0)
        self.assertEqual(result["status"], "UNKNOWN_PRESERVE")
        output = subprocess.run([
            sys.executable, "-B", str(SCRIPT), "--root", str(root),
            "--installed-workspace", str(self.installed)],
            capture_output=True, text=True, check=True)
        self.assertNotIn("SUPER_SECRET_VALUE", output.stdout)
        self.assertNotIn("SUPER_SECRET_VALUE", output.stderr)

    def test_mid_scan_change_fails_closed(self):
        root = self.directory("a")
        original = audit_module.snapshot
        calls = [0]

        def altered(*args):
            calls[0] += 1
            data, errors = original(*args)
            if calls[0] == 2:
                data["unexpected.txt"] = (1, 2, 3, 4, 5)
            return data, errors
        with mock.patch.object(audit_module, "snapshot", side_effect=altered):
            report = audit_module.audit_dir(str(root))
        self.assertEqual(report["status"], "UNKNOWN_PRESERVE")
        self.assertIn("TREE_CHANGED_DURING_AUDIT", report["issues"])

    def test_unavailable_and_hash_budget_are_unknown(self):
        root = self.directory("a", content="more_than_four")
        self.assertEqual(audit_module.audit_dir(str(self.home / "missing"))["status"], "UNKNOWN_PRESERVE")
        report = audit_module.audit_dir(str(root), max_hash_bytes=4)
        self.assertEqual(report["status"], "UNKNOWN_PRESERVE")
        self.assertIn("FILE_UNREADABLE_OR_CHANGED", report["issues"])

    def test_empty_dir_and_file_mode_affect_fingerprint(self):
        a = self.directory("a")
        b = self.directory("b")
        (b / "empty").mkdir()
        x = audit_module.audit_dir(str(a))
        y = audit_module.audit_dir(str(b))
        self.assertNotEqual(x["contentSha256"], y["contentSha256"])


if __name__ == "__main__":
    unittest.main()

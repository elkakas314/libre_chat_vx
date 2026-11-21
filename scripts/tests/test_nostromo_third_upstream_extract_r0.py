import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1] / "extract-third-upstream-differences-r0.py"
spec = importlib.util.spec_from_file_location("nostromo_extract", SOURCE)
extract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract)


def report():
    return {
        "schema": "nostromo.third-upstream.forensic.r0.v1",
        "readOnly": True, "mutations": 0, "networkRequests": 0,
        "followSymlinks": False, "secretNamedFilesOpened": False,
        "secretValuesPrinted": False, "sourceIsNotLive": True,
        "status": "R0_SNAPSHOT_WITH_GAPS",
        "counts": {"relations": {"ONLY_IN_THIRD": 1, "DIFFERENT_CONTENT": 2}},
        "categories": {
            "API_BACKEND": {"examples": [
                {"path": "src/unique.ts", "relation": "ONLY_IN_THIRD", "size": 11, "shaCompared": False},
                {"path": "src/changed.ts", "relation": "DIFFERENT_CONTENT", "size": 12, "shaCompared": True}]},
            "DOCUMENTATION": {"examples": [
                {"path": "docs/changed.md", "relation": "DIFFERENT_CONTENT", "size": 13, "shaCompared": True}]},
        },
        "crossTreePathReferences": {"vx": {
            "status": "R0_SCAN_COMPLETE", "filesReferencingThirdAbsolutePath": 8,
            "examples": [f"src/ref-{i}.mjs" for i in range(8)]}},
    }


class ExtractDifferencesTests(unittest.TestCase):
    def test_extracts_exact_three_paths_and_eight_references_without_source(self):
        result = extract.validate_report(report())
        self.assertEqual(result["counts"], {"differences": 3, "vxReferences": 8})
        self.assertEqual({x["path"] for x in result["differences"]},
                         {"src/unique.ts", "src/changed.ts", "docs/changed.md"})
        self.assertFalse(result["sourceContentsPrinted"])
        self.assertFalse(result["liveVerified"])

    def test_refuses_incomplete_or_stale_examples(self):
        broken = report()
        broken["categories"]["DOCUMENTATION"]["examples"] = []
        with self.assertRaisesRegex(ValueError, "DIFFERENCE_EXAMPLES_INCOMPLETE"):
            extract.validate_report(broken)

    def test_refuses_redacted_sensitive_and_traversal_paths(self):
        for candidate in ("<SENSITIVE_PATH_REDACTED>", "../outside.txt", ".env"):
            with self.subTest(candidate=candidate):
                with self.assertRaises(ValueError):
                    extract.safe_relative(candidate)

    def test_refuses_secret_flags_or_partial_reference_scan(self):
        broken = report(); broken["secretValuesPrinted"] = True
        with self.assertRaisesRegex(ValueError, "REPORT_SAFETY_FLAGS_INVALID"):
            extract.validate_report(broken)
        broken = report(); broken["crossTreePathReferences"]["vx"]["status"] = "R0_PARTIAL"
        with self.assertRaisesRegex(ValueError, "VX_REFERENCE_EXAMPLES_INCOMPLETE"):
            extract.validate_report(broken)

    def test_read_report_refuses_symlink(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp); real = base / "source.json"; link = base / "report.json"
            real.write_text(json.dumps(report()), encoding="utf-8")
            link.symlink_to(real)
            with self.assertRaisesRegex(ValueError, "REPORT_NOT_REGULAR_FILE"):
                extract.read_report(link)

    def test_cli_refuses_reports_outside_canonical_reports_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            report_path = Path(tmp) / "report.json"
            report_path.write_text(json.dumps(report()), encoding="utf-8")
            result = subprocess.run([sys.executable, str(SOURCE), "--report", str(report_path)],
                                    capture_output=True, text=True, timeout=5)
            self.assertEqual(result.returncode, 2)
            self.assertEqual(json.loads(result.stdout)["status"],
                             "REPORT_OUTSIDE_CANONICAL_REPORTS")


if __name__ == "__main__":
    unittest.main()

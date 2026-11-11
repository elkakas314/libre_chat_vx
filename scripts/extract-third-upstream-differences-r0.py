#!/usr/bin/env python3
"""Extract prior R0 audit relations; never rescan trees or print source contents."""
import argparse
import hashlib
import json
import os
import re
import stat
import sys
from pathlib import Path, PurePosixPath

EXPECTED_RELATIONS = {"ONLY_IN_THIRD": 1, "DIFFERENT_CONTENT": 2}
EXPECTED_REFERENCE_COUNT = 8
MAX_REPORT_BYTES = 16 * 1024 * 1024
DEFAULT_REPORT = (Path.home() / "librechat/nostromo/reports/"
                  "third-upstream-forensic-20261111.sAKM9u.json")
SENSITIVE = re.compile(r"(?:^|/)(?:\.env(?:\.|$)|secret|credential|private|\.pem$|\.key$|id_rsa|id_ed25519|token|cookie|password|\.p12)", re.I)


def safe_relative(value):
    if not isinstance(value, str) or not value or value == "<SENSITIVE_PATH_REDACTED>":
        raise ValueError("PATH_MISSING_OR_REDACTED")
    p = PurePosixPath(value)
    if p.is_absolute() or ".." in p.parts or "\\" in value or SENSITIVE.search(value):
        raise ValueError("PATH_UNSAFE_OR_SENSITIVE")
    return value


def validate_report(doc, report_sha256=None):
    if not isinstance(doc, dict) or doc.get("schema") != "nostromo.third-upstream.forensic.r0.v1":
        raise ValueError("REPORT_SCHEMA_MISMATCH")
    if (doc.get("readOnly") is not True or doc.get("mutations") != 0 or
            doc.get("networkRequests") != 0 or doc.get("followSymlinks") is not False or
            doc.get("secretNamedFilesOpened") is not False or
            doc.get("secretValuesPrinted") is not False or
            doc.get("sourceIsNotLive") is not True):
        raise ValueError("REPORT_SAFETY_FLAGS_INVALID")
    counts = doc.get("counts")
    relations = counts.get("relations") if isinstance(counts, dict) else None
    if not isinstance(relations, dict) or any(relations.get(k) != v for k, v in EXPECTED_RELATIONS.items()):
        raise ValueError("RELATION_BASELINE_MISMATCH")

    found = {}
    categories = doc.get("categories")
    if not isinstance(categories, dict):
        raise ValueError("CATEGORY_EXAMPLES_MISSING")
    for category in categories.values():
        if not isinstance(category, dict) or not isinstance(category.get("examples"), list):
            continue
        for row in category["examples"]:
            if not isinstance(row, dict) or row.get("relation") not in EXPECTED_RELATIONS:
                continue
            rel, p = row["relation"], safe_relative(row.get("path"))
            size, compared = row.get("size"), row.get("shaCompared")
            if not isinstance(size, int) or size < 0 or not isinstance(compared, bool):
                raise ValueError("DIFFERENCE_METADATA_INVALID")
            if compared != (rel == "DIFFERENT_CONTENT"):
                raise ValueError("HASH_COMPARISON_FLAG_INVALID")
            item = {"path": p, "relation": rel, "size": size, "shaCompared": compared}
            if p in found and found[p] != item:
                raise ValueError("CONFLICTING_PATH_CLASSIFICATION")
            found[p] = item
    actual = {k: sum(x["relation"] == k for x in found.values()) for k in EXPECTED_RELATIONS}
    if actual != EXPECTED_RELATIONS:
        raise ValueError("DIFFERENCE_EXAMPLES_INCOMPLETE")

    refs = doc.get("crossTreePathReferences", {}).get("vx", {})
    if (not isinstance(refs, dict) or refs.get("status") != "R0_SCAN_COMPLETE" or
            refs.get("filesReferencingThirdAbsolutePath") != EXPECTED_REFERENCE_COUNT or
            not isinstance(refs.get("examples"), list) or len(refs["examples"]) != EXPECTED_REFERENCE_COUNT):
        raise ValueError("VX_REFERENCE_EXAMPLES_INCOMPLETE")
    safe_refs = sorted({safe_relative(x) for x in refs["examples"]})
    if len(safe_refs) != EXPECTED_REFERENCE_COUNT:
        raise ValueError("VX_REFERENCE_EXAMPLES_DUPLICATE")
    return {
        "schema": "nostromo.third-upstream.extracted-differences.r0.v1",
        "sourceReportSchema": doc["schema"],
        "sourceReportSha256": report_sha256,
        "sourceReportStatus": doc.get("status"),
        "readOnly": True,
        "sourceContentsPrinted": False,
        "liveVerified": False,
        "differences": sorted(found.values(), key=lambda x: (x["relation"], x["path"])),
        "vxReferences": safe_refs,
        "counts": {"differences": len(found), "vxReferences": len(safe_refs)},
        "decision": "PRESERVE_THIRD_CHECKOUT_UNTIL_DEPENDENCY_AND_ROLLBACK_REVIEW",
    }


def read_report(path):
    path = Path(path)
    try:
        before = os.lstat(path)
    except OSError as exc:
        raise ValueError("REPORT_UNAVAILABLE") from exc
    if not stat.S_ISREG(before.st_mode) or stat.S_ISLNK(before.st_mode):
        raise ValueError("REPORT_NOT_REGULAR_FILE")
    if before.st_size > MAX_REPORT_BYTES:
        raise ValueError("REPORT_TOO_LARGE")
    fd = os.open(path, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
    try:
        current = os.fstat(fd)
        if not stat.S_ISREG(current.st_mode) or (current.st_dev, current.st_ino, current.st_size) != (
                before.st_dev, before.st_ino, before.st_size):
            raise ValueError("REPORT_CHANGED_DURING_OPEN")
        with os.fdopen(fd, "rb") as handle:
            fd = -1
            data = handle.read(MAX_REPORT_BYTES + 1)
        if len(data) > MAX_REPORT_BYTES:
            raise ValueError("REPORT_TOO_LARGE")
        return json.loads(data.decode("utf-8")), hashlib.sha256(data).hexdigest()
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError("REPORT_JSON_INVALID") from exc
    finally:
        if fd >= 0:
            os.close(fd)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Extract prior third-upstream R0 differences (no rescan)")
    parser.add_argument("--report", default=str(DEFAULT_REPORT))
    args = parser.parse_args(argv)
    try:
        report_path = Path(args.report).absolute()
        reports_dir = DEFAULT_REPORT.parent.absolute()
        if report_path.parent != reports_dir:
            raise ValueError("REPORT_OUTSIDE_CANONICAL_REPORTS")
        if report_path.suffix.lower() != ".json" or SENSITIVE.search(report_path.name):
            raise ValueError("REPORT_FILENAME_REFUSED")
        doc, digest = read_report(report_path)
        result = validate_report(doc, digest)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, OSError) as exc:
        print(json.dumps({"schema": "nostromo.third-upstream.extracted-differences.r0.v1",
                          "status": str(exc), "readOnly": True,
                          "sourceContentsPrinted": False, "liveVerified": False}), file=sys.stdout)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

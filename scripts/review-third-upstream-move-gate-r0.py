#!/usr/bin/env python3
"""NOSTROMO M1: bounded R0 readback of exactly 3 differences + 8 VX references.

Consumes JSON emitted by extract-third-upstream-differences-r0.py on stdin.
Does not rescan trees, modify data, read .env, disclose file contents or approve a move.
"""
import argparse
import hashlib
import errno
import json
import os
import re
import stat
import sys
from pathlib import Path, PurePosixPath

SCHEMA = "nostromo.third-upstream.move-gate.r0.v1"
EXTRACTED = "nostromo.third-upstream.extracted-differences.r0.v1"
NEEDLE = b"/home/elkakas314/upstream"
SENSITIVE = re.compile(r"(?:^|/)(?:\.env(?:\.|$)|[^/]*(?:secret|credential|private|password|token|cookie|id_rsa|id_ed25519)[^/]*|[^/]*\.(?:pem|key|p12))", re.I)
MAX_REFERENCE_BYTES = 512 * 1024
MAX_DIFF_BYTES = 8 * 1024 * 1024
MAX_INPUT_BYTES = 1024 * 1024


def relative(value):
    if not isinstance(value, str) or not value or value == "<SENSITIVE_PATH_REDACTED>":
        raise ValueError("PATH_MISSING_OR_REDACTED")
    p = PurePosixPath(value)
    if (p.is_absolute() or value != str(p) or "\\" in value or
            any(part in ("", ".", "..") for part in value.split("/")) or
            SENSITIVE.search(value)):
        raise ValueError("PATH_UNSAFE_OR_SENSITIVE")
    return value


def root_state(root, expected):
    """Fail closed: exact canonical scope and lstat of EVERY ancestor from '/'.

    No root contents are opened here; do not use resolve()/is_dir() on a
    user-supplied path, because those would follow an ancestor symlink.
    """
    root, expected = Path(root), Path(expected)
    if not root.is_absolute() or root != expected:
        return "ROOT_OUTSIDE_CANONICAL_SCOPE"
    current = Path(root.anchor)
    for part in root.parts[1:]:
        current = current / part
        try:
            info = os.lstat(current)
        except OSError:
            return "ROOT_UNAVAILABLE"
        if stat.S_ISLNK(info.st_mode):
            return "ROOT_SYMLINK_BLOCKED"
        if not stat.S_ISDIR(info.st_mode):
            return "ROOT_ANCESTOR_NOT_DIRECTORY"
    return "DIRECTORY"


def file_state(root, rel):
    """lstat each intermediate component; open(2) later refuses final symlinks."""
    current = Path(root)
    for part in PurePosixPath(relative(rel)).parts:
        current = current / part
        try:
            info = os.lstat(current)
        except FileNotFoundError:
            return "ABSENT", None
        except OSError:
            return "UNREADABLE", None
        if stat.S_ISLNK(info.st_mode):
            return "SYMLINK_BLOCKED", None
        if part != PurePosixPath(rel).parts[-1] and not stat.S_ISDIR(info.st_mode):
            return "ANCESTOR_NOT_DIRECTORY", None
    return ("REGULAR", info) if stat.S_ISREG(info.st_mode) else ("NOT_REGULAR", None)


def checked_bytes(root, rel, limit):
    state, before = file_state(root, rel)
    if state != "REGULAR":
        return state, None
    if before.st_size > limit:
        return "SIZE_LIMIT", None
    # Open every ancestor by dirfd with O_NOFOLLOW, not by a single path.
    # This prevents a symlink swap between root_state() and this read.
    fd = None
    try:
        fd = os.open("/", os.O_RDONLY | os.O_DIRECTORY)
        parts = list(Path(root).parts[1:]) + list(PurePosixPath(relative(rel)).parts)
        for index, name in enumerate(parts):
            flags = os.O_RDONLY | os.O_NOFOLLOW
            if index != len(parts) - 1:
                flags |= os.O_DIRECTORY
            next_fd = os.open(name, flags, dir_fd=fd)
            os.close(fd)
            fd = next_fd
        observed = os.fstat(fd)
        identity = lambda st: (st.st_dev, st.st_ino, st.st_size, st.st_mtime_ns)
        if not stat.S_ISREG(observed.st_mode) or identity(before) != identity(observed):
            return "RACE_BLOCKED", None
        payload = os.read(fd, before.st_size + 1)
        if len(payload) != before.st_size or identity(os.fstat(fd)) != identity(observed):
            return "RACE_BLOCKED", None
        return "READ_OK", payload
    except OSError as exc:
        if exc.errno in (errno.ELOOP, errno.ENOTDIR, errno.ENOENT):
            return "RACE_BLOCKED", None
        return "UNREADABLE", None
    finally:
        if fd is not None:
            os.close(fd)


def reference_kind(rel):
    parts = re.split(r"[/_.-]", rel.lower())
    if any(p in ("test", "tests", "spec", "fixture", "fixtures", "e2e") for p in parts):
        return "TEST_OR_FIXTURE_UNVERIFIED"
    if any(p in ("doc", "docs", "readme", "documentation") for p in parts) or rel.lower().endswith(".md"):
        return "DOCUMENTATION_UNVERIFIED"
    return "POTENTIAL_RUNTIME_CONSUMER_UNVERIFIED"


def validate_extracted(doc):
    if (not isinstance(doc, dict) or doc.get("schema") != EXTRACTED or
            doc.get("readOnly") is not True or doc.get("liveVerified") is not False or
            doc.get("sourceContentsPrinted") is not False or
            doc.get("counts") != {"differences": 3, "vxReferences": 8}):
        raise ValueError("EXTRACTED_REPORT_INVALID_OR_INCOMPLETE")
    diffs, refs = doc.get("differences"), doc.get("vxReferences")
    if not isinstance(diffs, list) or not isinstance(refs, list) or len(diffs) != 3 or len(refs) != 8:
        raise ValueError("EXPECTED_3_DIFFERENCES_8_REFERENCES")
    seen = set()
    categories = {"ONLY_IN_THIRD": 0, "DIFFERENT_CONTENT": 0}
    for d in diffs:
        if not isinstance(d, dict) or d.get("relation") not in categories:
            raise ValueError("INVALID_DIFFERENCE")
        rel = relative(d.get("path"))
        if rel in seen or type(d.get("size")) is not int or d["size"] < 0:
            raise ValueError("DUPLICATE_OR_INVALID_DIFFERENCE")
        seen.add(rel)
        categories[d["relation"]] += 1
    if categories != {"ONLY_IN_THIRD": 1, "DIFFERENT_CONTENT": 2}:
        raise ValueError("DIFFERENCE_RELATIONS_INVALID")
    names = [relative(r) for r in refs]
    if len(set(names)) != 8:
        raise ValueError("DUPLICATE_VX_REFERENCE")
    return diffs, names


def review(doc, third, integrated, vx, *, home=None):
    diffs, refs = validate_extracted(doc)
    # R0 scope is intentionally not configurable independently per root.
    # The optional home is exclusively for isolated test fixtures.
    base = Path.home() if home is None else Path(home)
    roots = {
        "third": root_state(third, base / "upstream"),
        "integrated": root_state(integrated, base / "librechat/upstream"),
        "vx": root_state(vx, base / "librechat/vx"),
    }
    if any(status != "DIRECTORY" for status in roots.values()):
        return {"schema": SCHEMA, "readOnly": True, "mutations": 0,
                "status": "ROOTS_BLOCKED", "roots": roots, "migrationAllowed": False}
    differences = []
    for d in diffs:
        rel = relative(d["path"])
        left_state, left = checked_bytes(third, rel, MAX_DIFF_BYTES)
        right_state, right = checked_bytes(integrated, rel, MAX_DIFF_BYTES)
        relation = ("ONLY_IN_THIRD" if left_state == "READ_OK" and right_state == "ABSENT" else
                    "DIFFERENT_CONTENT" if left_state == right_state == "READ_OK" and
                    hashlib.sha256(left).digest() != hashlib.sha256(right).digest() else
                    "IDENTICAL" if left_state == right_state == "READ_OK" else "UNKNOWN")
        differences.append({"path": rel, "reportedRelation": d["relation"],
            "observedRelation": relation, "thirdRead": left_state,
            "integratedRead": right_state,
            "thirdSizeMatchesSnapshot": len(left) == d["size"] if left is not None else None,
            "relationStillHolds": relation == d["relation"] and left is not None and len(left) == d["size"],
            "snapshotHashProof": False})
    references = []
    for rel in refs:
        state, body = checked_bytes(vx, rel, MAX_REFERENCE_BYTES)
        references.append({"path": rel, "kindByFilename": reference_kind(rel),
            "readState": state, "exactAbsolutePathStillReferenced":
            NEEDLE in body if body is not None else None,
            "runtimeConsumerConfirmed": False})
    unchanged = all(row["relationStillHolds"] for row in differences)
    refs_present = all(row["exactAbsolutePathStillReferenced"] is True for row in references)
    return {"schema": SCHEMA, "readOnly": True, "mutations": 0,
        "sourceReportSha256": doc.get("sourceReportSha256"),
        "contentValuesOutput": False, "gitChanged": False, "liveVerified": False,
        "roots": roots, "differences": differences, "vxReferences": references,
        "counts": {"differencesInspected": len(differences), "referencesInspected": len(references)},
        "status": "R0_RECONCILIATION_PENDING" if unchanged and refs_present else "R0_STALE_OR_UNVERIFIED",
        "migrationAllowed": False,
        "blockers": ["THIRD_ENV_AND_LOCKFILE_RECONCILIATION", "ACTIVE_CONSUMER_ASSESSMENT",
                     "PERSISTENCE_AND_BACKUP_READBACK", "ROLLBACK_AND_E2E_VALIDATION"],
        "note": "Relations/filename roles are evidence, not proof of runtime consumers or snapshot identity. No move/delete authorized."}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Read-only NOSTROMO third-upstream dependency move gate")
    ap.add_argument("--third", default=str(Path.home() / "upstream"))
    ap.add_argument("--integrated", default=str(Path.home() / "librechat/upstream"))
    ap.add_argument("--vx", default=str(Path.home() / "librechat/vx"))
    args = ap.parse_args(argv)
    try:
        raw = sys.stdin.buffer.read(MAX_INPUT_BYTES + 1)
        if len(raw) > MAX_INPUT_BYTES:
            raise ValueError("EXTRACTED_REPORT_TOO_LARGE")
        doc = json.loads(raw.decode("utf-8"))
        result = review(doc, args.third, args.integrated, args.vx)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0 if result["status"] == "R0_RECONCILIATION_PENDING" else 2
    except (ValueError, UnicodeError, json.JSONDecodeError, OSError) as e:
        print(json.dumps({"schema": SCHEMA, "readOnly": True, "mutations": 0,
                          "migrationAllowed": False, "status": str(e)}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

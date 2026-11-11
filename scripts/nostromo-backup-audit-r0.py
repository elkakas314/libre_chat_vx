#!/usr/bin/env python3
"""NOSTROMO backup inventory. R0 ONLY: no deletion, quarantine, config reads or output files.
Hashes regular non-secret files, not symlink targets. Conservative on races,
permissions, partial scans, backup purpose and unmatched historical data.
"""
import argparse
import hashlib
import json
import os
import stat
import sys
from pathlib import Path

DEFAULT_BACKUPS = [
    "nostromo-workspace-backup.2jGTrK",
    "nostromo-ui-backup.s5cE3siD",
    "nostromo-backup.ceBhjB8V",
]
BLOCK = 1024 * 1024
SECRET_TERMS = (".env", ".pem", ".key", "id_rsa", "id_ed25519",
                "credential", "secret", "token", "auth", "cookie")


def secret_like(relative):
    return any(x in relative.lower().split("/")[-1] for x in SECRET_TERMS)


def snapshot(root, max_files):
    """Inventory metadata with lstat. Any error is NOT an all-clear."""
    found = {}
    errors = []
    if not os.path.isdir(root) or os.path.islink(root):
        return found, ["NOT_A_REAL_DIRECTORY"]
    for folder, dirs, files in os.walk(root, topdown=True, followlinks=False):
        dirs.sort()
        files.sort()
        # Symlinked directory entries are included as links but never traversed.
        for name in list(dirs):
            namepath = os.path.join(folder, name)
            if os.path.islink(namepath):
                dirs.remove(name)
                files.append(name)
        rel_folder = os.path.relpath(folder, root)
        if rel_folder != ".":
            try:
                s = os.lstat(folder)
                if not stat.S_ISDIR(s.st_mode):
                    errors.append("DIRECTORY_REPLACED")
                else:
                    found[rel_folder + "/"] = identity(s)
            except OSError:
                errors.append("DIRECTORY_INACCESSIBLE")
        for name in sorted(files):
            p = os.path.join(folder, name)
            rel = os.path.relpath(p, root)
            if len(found) >= max_files:
                return found, errors + ["FILE_COUNT_LIMIT"]
            try:
                found[rel] = identity(os.lstat(p))
            except OSError:
                errors.append("ITEM_INACCESSIBLE")
    return found, errors


def identity(s):
    return (s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_mode)


def hash_file(path, baseline, budget):
    """No symlink following; detect replaced/mutated files during read."""
    flags = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0)
    fd = os.open(path, flags)
    try:
        before = os.fstat(fd)
        if identity(before) != baseline or not stat.S_ISREG(before.st_mode):
            raise ValueError("FILE_CHANGED_BEFORE_READ")
        if before.st_size > budget:
            raise ValueError("HASH_BUDGET_EXCEEDED")
        h = hashlib.sha256()
        while True:
            chunk = os.read(fd, BLOCK)
            if not chunk:
                break
            h.update(chunk)
        after = os.fstat(fd)
        if identity(before) != identity(after):
            raise ValueError("FILE_CHANGED_DURING_READ")
        return h.hexdigest(), after.st_size
    finally:
        os.close(fd)


def fingerprint(entries):
    h = hashlib.sha256()
    for rel, value in sorted(entries.items()):
        serialized = json.dumps([rel, value], separators=(",", ":"), ensure_ascii=False)
        h.update(serialized.encode("utf-8"))
        h.update(b"\n")
    return h.hexdigest()


def audit_dir(root, max_files=20000, max_hash_bytes=2 * 1024 ** 3):
    root = os.path.abspath(root)
    result = {"path": root, "status": "UNKNOWN", "files": 0,
              "bytesLogical": 0, "bytesAllocated": None,
              "inventorySha256": None, "contentSha256": None,
              "sensitiveCount": 0, "symlinkCount": 0, "hashedBytes": 0,
              "issues": [], "entries": None}
    try:
        st = os.lstat(root)
        if not stat.S_ISDIR(st.st_mode):
            result["status"] = "UNKNOWN_PRESERVE"
            result["issues"].append("ROOT_NOT_DIRECTORY_OR_SYMLINK")
            return result
    except OSError:
        result["status"] = "UNKNOWN_PRESERVE"
        result["issues"].append("ROOT_UNAVAILABLE")
        return result
    root_before = identity(st)
    baseline, errors = snapshot(root, max_files)
    result["issues"].extend(errors)
    result["inventorySha256"] = fingerprint(baseline)
    remaining = max_hash_bytes
    manifest = []
    for rel, value in sorted(baseline.items()):
        if rel.endswith("/"):
            manifest.append([rel, "DIRECTORY", stat.S_IMODE(value[4]), None])
            continue
        p = os.path.join(root, rel)
        mode = value[4]
        if stat.S_ISLNK(mode):
            result["symlinkCount"] += 1
            result["issues"].append("SYMLINK_PRESENT_NO_FOLLOW")
            manifest.append([rel, "SYMLINK", None, None])
            continue
        if not stat.S_ISREG(mode):
            result["issues"].append("SPECIAL_FILE_NOT_READ")
            manifest.append([rel, "SPECIAL", None, None])
            continue
        result["files"] += 1
        result["bytesLogical"] += value[2]
        if secret_like(rel):
            result["sensitiveCount"] += 1
            result["issues"].append("SENSITIVE_FILE_NOT_HASHED")
            manifest.append([rel, "SENSITIVE", stat.S_IMODE(mode), None])
            continue
        try:
            digest, used = hash_file(p, value, remaining)
            remaining -= used
            result["hashedBytes"] += used
            manifest.append([rel, "FILE", stat.S_IMODE(mode), digest])
        except (OSError, ValueError):
            result["issues"].append("FILE_UNREADABLE_OR_CHANGED")
            manifest.append([rel, "UNKNOWN", None, None])
    after, after_errors = snapshot(root, max_files)
    result["issues"].extend(after_errors)
    try:
        root_after = identity(os.lstat(root))
    except OSError:
        root_after = None
    if root_before != root_after or baseline != after:
        result["issues"].append("TREE_CHANGED_DURING_AUDIT")
    if not result["issues"]:
        h = hashlib.sha256(json.dumps(manifest, ensure_ascii=False,
             separators=(",", ":")).encode("utf-8")).hexdigest()
        result["contentSha256"] = h
        result["status"] = "CONTENT_AUDITED_NEEDS_PURPOSE_REVIEW"
    else:
        result["status"] = "UNKNOWN_PRESERVE"
    result["issues"] = sorted(set(result["issues"]))
    result["entries"] = len(baseline)
    return result


def audit(roots, installed, max_files=20000, max_hash_bytes=2 * 1024 ** 3):
    backups = [audit_dir(x, max_files, max_hash_bytes) for x in roots]
    actual = audit_dir(installed, max_files, max_hash_bytes)
    seen = {}
    for item in backups:
        digest = item["contentSha256"]
        if digest:
            if digest in seen:
                item["classification"] = "POSSIBLE_DUPLICATE_REVIEW_ONLY"
                item["duplicateOf"] = seen[digest]
            else:
                seen[digest] = item["path"]
                item["classification"] = "KEEP_FIRST_VALID_COPY"
            if digest == actual["contentSha256"] and actual["status"].startswith("CONTENT_AUDITED"):
                item["sameAsInstalled"] = True
                item["classification"] = "MATCHES_INSTALLED_REVIEW_ONLY"
        else:
            item["classification"] = "UNKNOWN_PRESERVE"
        item["canQuarantine"] = False
        item["canPurge"] = False
    return {
        "schema": "nostromo.backup.audit.r0.v1",
        "readOnly": True, "mutations": 0, "followedSymlinks": False,
        "secretsContentsRead": False, "quarantineEnabled": False, "purgeEnabled": False,
        "backups": backups, "installedWorkspace": actual,
        "note": "No deletion authority. Matching byte content does NOT prove backup purpose is obsolete."
    }


def main(argv=None):
    p = argparse.ArgumentParser(description="NOSTROMO backup audit R0; stdout only")
    p.add_argument("--root", action="append", default=[])
    p.add_argument("--installed-workspace", default=str(
        Path.home() / "librechat/upstream/packages/librechat-vx"))
    p.add_argument("--max-files", type=int, default=20000)
    p.add_argument("--max-hash-mib", type=int, default=2048)
    args = p.parse_args(argv)
    if not 1 <= args.max_files <= 100000 or not 1 <= args.max_hash_mib <= 8192:
        p.error("limits outside safe range")
    roots = args.root or [str(Path.home() / x) for x in DEFAULT_BACKUPS]
    if len(set(roots)) != len(roots) or len(roots) > 20:
        p.error("duplicate or excessive roots")
    report = audit(roots, args.installed_workspace, args.max_files,
                   args.max_hash_mib * 1024 ** 2)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())

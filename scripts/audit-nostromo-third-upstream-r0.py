#!/usr/bin/env python3
"""Read-only, bounded forensic inventory of the separate ~/upstream LibreChat clone.
No .env/credential content, symlink traversal, Git mutations, network or service actions.
Output JSON to stdout only. Source/category evidence != executable LIVE proof.
"""
import argparse
import collections
import hashlib
import json
import os
import re
import stat
import subprocess
import sys
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", ".next", ".venv", "venv", ".cache",
             ".turbo", "dist", "build", "coverage", "playwright-report",
             "test-results", "vendor", ".pnpm-store", "tmp", ".tmp"}
SECRET_PARTS = (".env", "secret", "credential", "private", ".pem", ".key",
                "id_rsa", "id_ed25519", "token", "cookie", "password", ".p12")
SOURCE_EXT = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".py", ".sh",
              ".bash", ".yml", ".yaml", ".json", ".toml", ".md",
              ".xml", ".sql", ".ini", ".conf"}
CATEGORY_TERMS = {
    "API_BACKEND": ("api", "backend", "routes", "controllers", "endpoints", "providers",
                    "server", "graphql", "http", "express", "fastify"),
    "E2E_TESTS": ("e2e", "playwright", "cypress", "integration", "test", "spec",
                  "fixture", "vitest", "jest", "smoke", "canary"),
    "SCRIPTS_CLI": ("scripts", "bin", "cli", "commands", "maintenance",
                    "migrations"),
    "SKILLS_PLUGINS": ("skills", "skill.md", "plugins", "extensions", "mcp"),
    "REDIS_QUEUES": ("redis", "ioredis", "bullmq", "bull", "queue", "worker",
                     "stream", "pubsub", "cache"),
    "DB_PERSISTENCE": ("mongo", "mongoose", "postgres", "sqlite", "prisma",
                       "database", "migration", "models", "db"),
    "AGENTS_MCP": ("agent", "mcp", "tool", "function", "capability"),
    "MOBILE_PWA": ("mobile", "pwa", "service-worker", "serviceworker",
                   "manifest.webmanifest", "sw.js", "speech", "voice"),
    "AUTH_SECURITY": ("auth", "oauth", "session", "rbac", "permissions",
                      "policy", "csrf", "security", "acl"),
    "DEPLOYMENT": ("docker", "compose", "deploy", "nginx", "caddy", "systemd",
                   "tailscale", "cloudflare", "k8s", "helm", "redis.conf"),
    "DOCUMENTATION": ("docs", "readme", "instructions", "guides"),
}
HARD_REF = ("/home/elkakas314/upstream", "~/upstream", "/home/elkakas314/librechat/upstream")
SOURCE_SIGNALS = {
    "REDIS_QUEUE_CALLS": ("redis", "ioredis", "bullmq", "bull.queue", "new queue("),
    "API_HTTP_HANDLERS": ("router.get(", "router.post(", "app.get(", "app.post(", "fastify.", "/api/"),
    "E2E_TOOLING": ("playwright", "cypress", "test.describe(", "describe(", "it("),
    "SKILL_LOADING": ("skill.md", "skills/", "loadskill", "skillregistry"),
    "MCP_TRANSPORT": ("mcpserver", "@modelcontextprotocol/sdk", "mcpservers", "stdio"),
    "MOBILE_PWA": ("serviceworker", "manifest.webmanifest", "beforeinstallprompt"),
    "CONTAINER_ORCHESTRATION": ("docker compose", "docker-compose", "redis:"),
}



def sensitive(rel):
    parts = rel.lower().split("/")
    return any(any(term in part for term in SECRET_PARTS) for part in parts)


def safe_name(rel):
    return "<SENSITIVE_PATH_REDACTED>" if sensitive(rel) else rel


def regular_at(root, relative):
    """lstat every component: symlink ancestors are never followed."""
    current = root
    for name in Path(relative).parts:
        if name in ("..", ".", ""):
            return "UNSAFE_PATH", None
        current = current / name
        try:
            info = os.lstat(current)
        except FileNotFoundError:
            return "ABSENT", None
        except OSError:
            return "UNREADABLE", None
        if stat.S_ISLNK(info.st_mode):
            return "SYMLINK_REFUSED", None
    if not stat.S_ISREG(info.st_mode):
        return "NOT_REGULAR", None
    return "REGULAR", info


def bounded_hash(root, relative, info, max_size, budget):
    if info.st_size > max_size:
        return None, "FILE_TOO_LARGE"
    if info.st_size > budget[0]:
        return None, "HASH_BUDGET_EXHAUSTED"
    target = root / relative
    fd = None
    try:
        fd = os.open(target, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
        before = os.fstat(fd)
        if not stat.S_ISREG(before.st_mode):
            return None, "REPLACED"
        if (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns) != (
                info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns):
            return None, "CHANGED_BEFORE_READ"
        digest = hashlib.sha256()
        remaining = info.st_size
        while remaining:
            chunk = os.read(fd, min(65536, remaining))
            if not chunk:
                return None, "SHORT_READ"
            digest.update(chunk)
            remaining -= len(chunk)
        after = os.fstat(fd)
        if (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns) != (
                before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns):
            return None, "CHANGED_DURING_READ"
        budget[0] -= info.st_size
        return digest.hexdigest(), "HASHED"
    except (OSError, ValueError):
        return None, "UNREADABLE_OR_RACED"
    finally:
        if fd is not None:
            os.close(fd)


def categories(rel):
    lower = rel.lower()
    parts = re.split(r"[/_.-]", lower)
    tags = []
    for name, terms in CATEGORY_TERMS.items():
        if any(term in lower for term in terms) or any(term in parts for term in terms):
            tags.append(name)
    # Recognize test suffixes even without a test directory.
    if re.search(r"(?:^|[/_.-])(test|spec|e2e)(?:[/_.-]|$)", lower) and "E2E_TESTS" not in tags:
        tags.append("E2E_TESTS")
    return tags


def git_info(root):
    env = dict(os.environ)
    env.update({"GIT_OPTIONAL_LOCKS": "0", "GIT_TERMINAL_PROMPT": "0",
                "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": "/dev/null"})
    def call(args):
        try:
            p = subprocess.run(["git", "-c", "core.fsmonitor=false",
                                "-c", "core.hooksPath=/dev/null", "-C", str(root)] + args,
                               env=env, capture_output=True, timeout=20, check=False)
            return (p.stdout.decode("utf-8", "replace") if args[0] == "status"
                    else p.stdout.decode("utf-8", "replace").strip()) if p.returncode == 0 else None
        except (OSError, subprocess.TimeoutExpired):
            return None
    status = call(["status", "--porcelain=v1", "--untracked-files=all"])
    lines = status.splitlines() if status is not None else []
    return {"head": call(["rev-parse", "HEAD"]),
            "branch": call(["branch", "--show-current"]),
            "gitRoot": call(["rev-parse", "--show-toplevel"]),
            "dirtyEntries": len(lines) if status is not None else None,
            "trackedChanges": sum(not x.startswith("??") for x in lines),
            "untrackedEntries": sum(x.startswith("??") for x in lines),
            "sample": [safe_name(x[3:]) for x in lines[:40]]}


def inspect_package(root, relative):
    state, info = regular_at(root, relative)
    if state != "REGULAR" or info.st_size > 1024 * 1024:
        return {"path": relative, "status": state}
    try:
        fd = os.open(root / relative, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
        with os.fdopen(fd, "r", encoding="utf-8") as f:
            observed = os.fstat(f.fileno())
            if (observed.st_dev, observed.st_ino, observed.st_size, observed.st_mtime_ns) != (
                    info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns):
                raise ValueError("PACKAGE_FILE_CHANGED")
            pkg = json.load(f)
        if not isinstance(pkg, dict):
            raise ValueError("NOT_PACKAGE_OBJECT")
        deps = {}
        for field in ("dependencies", "devDependencies", "optionalDependencies"):
            values = pkg.get(field) or {}
            if isinstance(values, dict):
                deps[field] = len(values)
                deps[field + "Relevant"] = sorted(
                    k for k in values if any(x in k.lower() for x in
                       ("redis", "bull", "queue", "mongo", "mongoose", "mcp",
                        "playwright", "cypress", "vitest", "jest", "socket", "pwa")))
        scripts = pkg.get("scripts") or {}
        return {"path": relative, "status": "PARSED",
                "name": str(pkg.get("name", ""))[:120],
                "version": str(pkg.get("version", ""))[:40],
                "packageManager": str(pkg.get("packageManager", ""))[:50],
                "scriptNames": sorted(str(k) for k in scripts)[:80] if isinstance(scripts, dict) else [],
                "dependencies": deps}
    except (OSError, UnicodeError, ValueError, TypeError):
        return {"path": relative, "status": "PACKAGE_PARSE_UNKNOWN"}


def top_entries(root):
    results = []
    try:
        for e in sorted(os.scandir(root), key=lambda x: x.name.lower()):
            name = safe_name(e.name)
            try:
                info = e.stat(follow_symlinks=False)
                kind = "SYMLINK" if stat.S_ISLNK(info.st_mode) else (
                    "DIR" if stat.S_ISDIR(info.st_mode) else
                    "FILE" if stat.S_ISREG(info.st_mode) else "SPECIAL")
                results.append({"name": name, "kind": kind})
            except OSError:
                results.append({"name": name, "kind": "UNREADABLE"})
    except OSError:
        return [{"name": "<root>", "kind": "UNREADABLE"}]
    return results[:160]



def scan_tree_references(root, needle="/home/elkakas314/upstream",
                         max_files=25000, max_bytes=24 * 1024 * 1024,
                         sample_limit=40):
    """Detect only hardcoded path mentions in safe text. Never print contents."""
    try:
        st = os.lstat(root)
        if not stat.S_ISDIR(st.st_mode) or stat.S_ISLNK(st.st_mode):
            return {"status": "ROOT_UNSAFE", "filesInspected": 0}
    except OSError:
        return {"status": "ROOT_UNAVAILABLE", "filesInspected": 0}
    files_seen, bytes_seen, count, paths = 0, 0, 0, []
    incomplete = False
    for base, dirs, files in os.walk(root, followlinks=False, topdown=True,
                                    onerror=lambda _: None):
        dirs[:] = [name for name in dirs if name not in SKIP_DIRS and
                   not os.path.islink(os.path.join(base, name))]
        for name in files:
            if files_seen >= max_files or bytes_seen >= max_bytes:
                incomplete = True
                break
            rel = os.path.relpath(os.path.join(base, name), root)
            files_seen += 1
            if sensitive(rel) or Path(rel).suffix.lower() not in SOURCE_EXT:
                continue
            state, st = regular_at(root, rel)
            if state != "REGULAR" or st.st_size > 512 * 1024 or (
                    bytes_seen + st.st_size > max_bytes):
                continue
            fd = None
            try:
                fd = os.open(root / rel, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
                b = os.fstat(fd)
                if (b.st_dev, b.st_ino, b.st_size, b.st_mtime_ns) != (
                        st.st_dev, st.st_ino, st.st_size, st.st_mtime_ns):
                    incomplete = True
                    continue
                payload = os.read(fd, st.st_size + 1)
                a = os.fstat(fd)
                if (a.st_dev, a.st_ino, a.st_size, a.st_mtime_ns) != (
                        b.st_dev, b.st_ino, b.st_size, b.st_mtime_ns):
                    incomplete = True
                    continue
                bytes_seen += len(payload)
                if needle.encode("utf-8") in payload:
                    count += 1
                    if len(paths) < sample_limit:
                        paths.append(safe_name(rel))
            except OSError:
                incomplete = True
            finally:
                if fd is not None:
                    os.close(fd)
        if files_seen >= max_files or bytes_seen >= max_bytes:
            incomplete = True
            break
    return {"status": "R0_PARTIAL" if incomplete else "R0_SCAN_COMPLETE",
            "filesInspected": files_seen, "bytesScanned": bytes_seen,
            "filesReferencingThirdAbsolutePath": count,
            "examples": paths, "rawSourceValuesReadIntoReport": False}

def scan(target, integrated, max_files, max_hash_size, hash_mib,
         ref_mib, full, max_samples, vx_root=None):
    report = {"schema": "nostromo.third-upstream.forensic.r0.v1",
              "readOnly": True, "mutations": 0, "networkRequests": 0,
              "followSymlinks": False, "secretNamedFilesOpened": False,
              "secretValuesPrinted": False, "sourceFilesMayContainEmbeddedSecrets": True,
              "sourceIsNotLive": True, "target": str(target),
              "integrated": str(integrated), "status": "INCOMPLETE",
              "warnings": [], "categories": {}, "skipped": collections.Counter()}
    for root, label in ((target, "target"), (integrated, "integrated")):
        try:
            st = os.lstat(root)
            if not stat.S_ISDIR(st.st_mode) or stat.S_ISLNK(st.st_mode):
                report["warnings"].append(label + "_NOT_REAL_DIRECTORY")
                return report
        except OSError:
            report["warnings"].append(label + "_UNAVAILABLE")
            return report
    report["git"] = {"third": git_info(target), "integrated": git_info(integrated)}
    report["topLevel"] = {"third": top_entries(target), "integrated": top_entries(integrated)}
    report["presenceOnly"] = {
        "thirdEnv": regular_at(target, ".env")[0] == "REGULAR",
        "integratedEnv": regular_at(integrated, ".env")[0] == "REGULAR",
        "thirdLock": regular_at(target, "package-lock.json")[0] == "REGULAR",
        "integratedLock": regular_at(integrated, "package-lock.json")[0] == "REGULAR",
        "thirdCompose": any(regular_at(target, p)[0] == "REGULAR" for p in
                            ("docker-compose.yml", "compose.yaml", "docker-compose.yaml")),
        "integratedCompose": any(regular_at(integrated, p)[0] == "REGULAR" for p in
                                 ("docker-compose.yml", "compose.yaml", "docker-compose.yaml"))
    }
    report["rootPackages"] = {
        "third": inspect_package(target, "package.json"),
        "integrated": inspect_package(integrated, "package.json")
    }
    # Monorepo workspace contract inventory: dependency *names* and script
    # *names* only. No .env contents, npm execution or package install.
    workspace_candidates = ("api/package.json", "client/package.json",
        "packages/data-provider/package.json", "packages/agents/package.json",
        "packages/mcp/package.json", "e2e/package.json",
        "packages/redis/package.json")
    report["workspacePackages"] = {}
    for relative in workspace_candidates:
        if (regular_at(target, relative)[0] == "REGULAR" or
                regular_at(integrated, relative)[0] == "REGULAR"):
            report["workspacePackages"][relative] = {
                "third": inspect_package(target, relative),
                "integrated": inspect_package(integrated, relative)
            }
    tracked = 0
    total = 0
    symlinks = 0
    sensitive_files = 0
    hashed_files = 0
    hash_budget = [hash_mib * 1024 * 1024]
    ref_budget = [ref_mib * 1024 * 1024]
    cat_records = collections.defaultdict(list)
    states = collections.Counter()
    hardrefs = collections.Counter()
    signals = collections.Counter()
    signal_examples = collections.defaultdict(list)
    unreadable = 0
    for base, dirs, files in os.walk(
            target, topdown=True, followlinks=False,
            onerror=lambda _: report["warnings"].append("UNREADABLE_SUBTREE")):
        relbase = os.path.relpath(base, target)
        depth = 0 if relbase == "." else len(Path(relbase).parts)
        if depth >= 15:
            report["skipped"]["MAX_DEPTH"] += len(dirs)
            dirs[:] = []
        for name in list(dirs):
            p = os.path.join(base, name)
            try:
                if os.path.islink(p):
                    symlinks += 1
                    dirs.remove(name)
                elif name in SKIP_DIRS:
                    dirs.remove(name)
                    report["skipped"]["DIR_" + name] += 1
            except OSError:
                dirs.remove(name)
                report["skipped"]["DIR_UNKNOWN"] += 1
        for name in files:
            if total >= max_files:
                report["warnings"].append("FILE_COUNT_BUDGET_REACHED")
                break
            rel = str((Path(relbase) / name) if relbase != "." else Path(name))
            total += 1
            try:
                st = os.lstat(os.path.join(base, name))
            except OSError:
                unreadable += 1
                continue
            if stat.S_ISLNK(st.st_mode):
                symlinks += 1
                continue
            if not stat.S_ISREG(st.st_mode):
                report["skipped"]["SPECIAL"] += 1
                continue
            tags = categories(rel)
            if sensitive(rel):
                sensitive_files += 1
                report["skipped"]["SENSITIVE_NOT_READ"] += 1
                # Secret files are presence-only, never hashed or scanned.
                continue
            if not tags:
                report["skipped"]["UNCATEGORIZED"] += 1
                continue
            external_hash, source_status = bounded_hash(
                target, rel, st, max_hash_size, hash_budget)
            if source_status == "HASHED":
                hashed_files += 1
            counterpart_state, counterpart_st = regular_at(integrated, rel)
            diff = "UNKNOWN"
            if counterpart_state == "ABSENT":
                diff = "ONLY_IN_THIRD"
            elif counterpart_state == "REGULAR" and external_hash:
                canonical_hash, can_status = bounded_hash(
                    integrated, rel, counterpart_st, max_hash_size, hash_budget)
                if can_status == "HASHED":
                    hashed_files += 1
                    diff = "IDENTICAL" if canonical_hash == external_hash else "DIFFERENT_CONTENT"
                else:
                    diff = "UNKNOWN_" + can_status
            else:
                diff = "UNKNOWN_" + counterpart_state
            states[diff] += 1
            record = {"path": safe_name(rel), "relation": diff,
                      "size": st.st_size, "shaCompared": diff in ("IDENTICAL", "DIFFERENT_CONTENT")}
            for t in tags:
                cat_records[t].append(record)
            if st.st_size <= 512 * 1024 and ref_budget[0] >= st.st_size and (
                    Path(rel).suffix.lower() in SOURCE_EXT):
                ref_budget[0] -= st.st_size
                fd = None
                try:
                    fd = os.open(target / rel, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
                    data = os.read(fd, min(st.st_size + 1, 512 * 1024)).decode(
                        "utf-8", "replace")
                    if "\0" not in data:
                        for pattern in HARD_REF:
                            if pattern in data:
                                hardrefs[pattern] += 1
                        lowered = data.lower()
                        for kind, needles in SOURCE_SIGNALS.items():
                            if any(needle in lowered for needle in needles):
                                signals[kind] += 1
                                if len(signal_examples[kind]) < max_samples:
                                    signal_examples[kind].append(safe_name(rel))
                except OSError:
                    unreadable += 1
                finally:
                    if fd is not None:
                        os.close(fd)
        if total >= max_files:
            break
    report["counts"] = {"visitedFiles": total, "classified": sum(
        x for x in states.values()), "hashedFiles": hashed_files,
        "symlinksNotFollowed": symlinks, "sensitiveFilesPresenceOnly": sensitive_files,
        "unreadable": unreadable, "relations": dict(states),
        "bytesHashBudgetRemaining": hash_budget[0],
        "bytesReferenceBudgetRemaining": ref_budget[0]}
    for cat, rows in sorted(cat_records.items()):
        by = dict(collections.Counter(x["relation"] for x in rows))
        rows = sorted(rows, key=lambda x: (x["relation"] == "IDENTICAL", x["path"]))
        report["categories"][cat] = {"files": len(rows), "relations": by,
            "examples": rows if full else rows[:max_samples]}
    report["crossTreePathReferences"] = {
        "integrated": scan_tree_references(integrated),
        "vx": scan_tree_references(vx_root) if vx_root is not None
              else {"status": "NOT_REQUESTED", "filesInspected": 0}
    }
    report["hardcodedReferencesInThird"] = dict(hardrefs)
    report["sourceSignals"] = {kind: {"filesContainingSignal": count,
        "examples": signal_examples[kind]} for kind, count in sorted(signals.items())}
    report["skipped"] = dict(report["skipped"])
    report["conclusions"] = {
        "thirdCanBeDeleted": False, "thirdCanBeMovedWithoutReferenceAudit": False,
        "thirdCanReplaceIntegrated": False, "redisLiveVerified": False,
        "apiE2eTestsExecuted": False, "configurationMayBeUnique": True,
        "safeNext": "RECONCILE_THIRD_UNIQUE_FILES_AND_REFERENCES_BEFORE_ANY_MOVE"}
    if report["git"]["third"]["head"] != report["git"]["integrated"]["head"]:
        report["warnings"].append("GIT_HEAD_DIVERGENCE")
    if report["presenceOnly"]["thirdEnv"] and not report["presenceOnly"]["integratedEnv"]:
        report["warnings"].append("THIRD_ENV_ONLY_DO_NOT_COPY_OR_PRINT")
    if not report["presenceOnly"]["thirdLock"] and report["presenceOnly"]["integratedLock"]:
        report["warnings"].append("THIRD_LOCK_MISSING_PRESERVE_STATE")
    if any(x.startswith("UNKNOWN") for x in states):
        report["warnings"].append("HASH_OR_COMPARISON_INCOMPLETE")
    report["status"] = "R0_SNAPSHOT_WITH_GAPS" if report["warnings"] else "R0_INVENTORY_COMPLETE"
    return report


def main(argv=None):
    p = argparse.ArgumentParser(description="Read-only deep audit of third upstream")
    p.add_argument("--target", default=str(Path.home() / "upstream"))
    p.add_argument("--integrated", default=str(Path.home() / "librechat/upstream"))
    p.add_argument("--vx", default=str(Path.home() / "librechat/vx"))
    p.add_argument("--max-files", type=int, default=40000)
    p.add_argument("--hash-budget-mib", type=int, default=128)
    p.add_argument("--max-file-mib", type=int, default=4)
    p.add_argument("--reference-budget-mib", type=int, default=32)
    p.add_argument("--detail", choices=("summary", "full"), default="summary")
    p.add_argument("--sample", type=int, default=30)
    args = p.parse_args(argv)
    if not (100 <= args.max_files <= 100000 and
            1 <= args.hash_budget_mib <= 1024 and
            1 <= args.max_file_mib <= 20 and
            1 <= args.reference_budget_mib <= 128 and 1 <= args.sample <= 200):
        p.error("AUDIT_BUDGET_OUT_OF_RANGE")
    t, i = Path(args.target).absolute(), Path(args.integrated).absolute()
    if t == i or t.is_symlink() or i.is_symlink():
        print(json.dumps({"status": "INVALID_OR_ALIASED_ROOTS", "readOnly": True}))
        return 2
    result = scan(t, i, args.max_files, args.max_file_mib * 1024 * 1024,
                  args.hash_budget_mib, args.reference_budget_mib,
                  args.detail == "full", args.sample,
                  vx_root=Path(args.vx).absolute())
    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
    return 0 if result["status"].startswith("R0_") else 2


if __name__ == "__main__":
    sys.exit(main())

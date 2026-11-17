#!/usr/bin/env python3
"""Stage NOSTROMO's DEFERRED mobile module into a separate Switchboard worktree.
Default: read-only. Never overwrite an existing different file. No network or credentials.
Optional --xcode rewrites ONLY exact known Xcode project anchors after preflight.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import sys
import tempfile
from pathlib import Path

IOS_SWIFT = (
    "NostromoIOSProbe.swift",
    "NostromoMaintenancePreview.swift",
    "NostromoBackupManifest.swift",
    "NostromoDocumentExport.swift",
)
ID_START = 21
PERMISSION_KEY = "NSBluetoothAlwaysUsageDescription"
PERMISSION_TEXT = (
    "NOSTROMO usa Bluetooth LE únicamente cuando pides buscar "
    "dispositivos cercanos; no los empareja ni rastrea en segundo plano."
)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def one(text: str, anchor: str, replacement: str) -> str:
    if text.count(anchor) != 1:
        raise ValueError(f"Xcode project drift: expected one {anchor!r}, found {text.count(anchor)}")
    return text.replace(anchor, replacement, 1)


def patch_xcode(text: str) -> str:
    if "NostromoDeviceControl/NostromoIOSProbe.swift" in text:
        if all(f"NostromoDeviceControl/{name}" in text for name in IOS_SWIFT):
            return text
        raise ValueError("Partial Xcode registration; fix manually before retrying")
    for i in range(ID_START, ID_START + len(IOS_SWIFT)):
        if f"AAA{i:05X}" in text or f"BBB{i:05X}" in text:
            raise ValueError("Xcode id collision")
    builds = "".join(
        f'\t\tAAA{i:05X} /* {name} in Sources */ = '
        f'{{isa = PBXBuildFile; fileRef = BBB{i:05X}; }};\n'
        for i, name in enumerate(IOS_SWIFT, ID_START)
    )
    refs = "".join(
        f'\t\tBBB{i:05X} /* {name} */ = '
        f'{{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; '
        f'path = NostromoDeviceControl/{name}; sourceTree = "<group>"; }};\n'
        for i, name in enumerate(IOS_SWIFT, ID_START)
    )
    groups = "".join(
        f'\t\t\t\tBBB{i:05X} /* {name} */,\n'
        for i, name in enumerate(IOS_SWIFT, ID_START)
    )
    sources = "".join(
        f'\t\t\t\tAAA{i:05X} /* {name} in Sources */,\n'
        for i, name in enumerate(IOS_SWIFT, ID_START)
    )
    text = one(text, "/* End PBXBuildFile section */", builds + "/* End PBXBuildFile section */")
    text = one(text, "/* End PBXFileReference section */", refs + "/* End PBXFileReference section */")
    text = one(text, '\t\t\t\tBBB00014 /* ScheduleCheckTask.swift */,\n',
               '\t\t\t\tBBB00014 /* ScheduleCheckTask.swift */,\n' + groups)
    text = one(text, '\t\t\t\tAAA00014 /* ScheduleCheckTask.swift in Sources */,\n',
               '\t\t\t\tAAA00014 /* ScheduleCheckTask.swift in Sources */,\n' + sources)
    return text


def atomic_write(path: Path, data: bytes) -> None:
    fd, tmp = tempfile.mkstemp(prefix=".nostromo-", dir=str(path.parent))
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
        os.chmod(tmp, path.stat().st_mode & 0o777)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", type=Path, required=True, help="Separate Librechat-Mobile git worktree")
    parser.add_argument("--apply", action="store_true", help="Copy only new, nonconflicting files")
    parser.add_argument("--xcode", action="store_true", help="Also wire Swift source + Bluetooth usage description")
    args = parser.parse_args()
    home = Path(__file__).resolve().parent
    source = home / "source"
    target = args.target.resolve()
    if not (target / ".git").exists() and not (target / ".git").is_file():
        parser.error("target must be its own git worktree (not the NOSTROMO backend)")
    if not (target / "feature/agents/build.gradle.kts").is_file():
        parser.error("target does not look like the Switchboard KMP client")
    if args.xcode and not (target / "iosApp/iosApp.xcodeproj/project.pbxproj").is_file():
        parser.error("missing iOS Xcode project")

    planned: list[tuple[Path, Path]] = []
    for src in sorted(source.rglob("*")):
        if not src.is_file() or src.suffix not in (".kt", ".swift"):
            continue
        if src.suffix == ".swift" and not args.xcode:
            continue
        dst = target / src.relative_to(source)
        if dst.is_symlink() or any(parent.is_symlink() for parent in dst.parents if parent != target and target in parent.parents):
            print(f"CONFLICT: symlink target path {dst}", file=sys.stderr)
            return 2
        if dst.exists():
            if sha(src) == sha(dst):
                continue
            print(f"CONFLICT: refusing to overwrite {dst}", file=sys.stderr)
            return 2
        planned.append((src, dst))

    xcode_path = target / "iosApp/iosApp.xcodeproj/project.pbxproj"
    plist_path = target / "iosApp/iosApp/Info.plist"
    patched_project = None
    patched_plist = None
    if args.xcode:
        patched_project = patch_xcode(xcode_path.read_text())
        if not plist_path.is_file():
            parser.error("missing iOS Info.plist")
        plist = plist_path.read_text()
        if PERMISSION_KEY not in plist:
            marker = "</dict>"
            last_close = plist.rfind(marker)
            if last_close < 0 or "</plist>" not in plist[last_close:]:
                parser.error("unexpected iOS Info.plist structure")
            import html
            escaped = html.escape(PERMISSION_TEXT)
            patched_plist = (plist[:last_close] +
                             f"\t<key>{PERMISSION_KEY}</key>\n\t<string>{escaped}</string>\n" +
                             plist[last_close:])

    for src, dst in planned:
        print(("COPY" if args.apply else "WOULD_COPY"), dst.relative_to(target))
    if args.xcode:
        print(("XCODE_PATCH" if args.apply else "WOULD_PATCH_XCODE"),
              "4 Swift source files + Bluetooth usage description")
    if not args.apply:
        print(f"DRY_RUN_ONLY files={len(planned)} (no changes)")
        return 0

    for src, dst in planned:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dst)
    if patched_project is not None and patched_project != xcode_path.read_text():
        atomic_write(xcode_path, patched_project.encode())
    if patched_plist is not None:
        atomic_write(plist_path, patched_plist.encode())
    print(f"STAGED_SOURCE_ONLY files={len(planned)} xcode={bool(args.xcode)}")
    print("NEXT: compile Android/KMP + iOS, wire NativeDeviceControlRoute into navigation;")
    print("verify permissions/hardware before enabling BLE, cache clean or backup.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

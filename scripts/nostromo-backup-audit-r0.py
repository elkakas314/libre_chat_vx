#!/usr/bin/env python3
"""R0 backup inventory: descriptor-pinned, no symlink traversal, no deletion."""
import argparse
import hashlib
import json
import os
import stat
import sys
from pathlib import Path

DEFAULT_BACKUPS = [
    'nostromo-frontend-deps-backup.fDbtdf',
    'nostromo-workspace-backup.2jGTrK',
    'nostromo-ui-backup.s5cE3siD',
    'nostromo-backup.ceBhjB8V',
]
BLOCK = 1024 * 1024
SECRET_TERMS = ('.env', '.pem', '.key', 'id_rsa', 'id_ed25519',
                'credential', 'secret', 'token', 'auth', 'cookie')
DIR_FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | getattr(os, 'O_CLOEXEC', 0)
FILE_FLAGS = os.O_RDONLY | os.O_NOFOLLOW | getattr(os, 'O_CLOEXEC', 0) | getattr(os, 'O_NONBLOCK', 0)


def secret_like(relative):
    return any(x in relative.lower().split('/')[-1] for x in SECRET_TERMS)


def identity(s):
    return (s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_mode)


def directory_ancestors_safe(root):
    """Precheck for static symlink parents; security is enforced by open_dir."""
    current = Path('/')
    for part in Path(os.path.abspath(root)).parts[1:]:
        current = current / part
        try:
            st = os.lstat(current)
        except OSError:
            return False
        if not stat.S_ISDIR(st.st_mode) or stat.S_ISLNK(st.st_mode):
            return False
    return True


def open_dir(path):
    """Pin every ancestor by dir_fd; never follow a symlink even after precheck."""
    fd = os.open('/', DIR_FLAGS)
    try:
        for part in Path(os.path.abspath(path)).parts[1:]:
            nxt = os.open(part, DIR_FLAGS, dir_fd=fd)
            os.close(fd)
            fd = nxt
        return fd
    except BaseException:
        os.close(fd)
        raise


def open_child_dir(parent_fd, components):
    fd = os.dup(parent_fd)
    try:
        for component in components:
            if component in ('', '.', '..') or '/' in component:
                raise ValueError('UNSAFE_COMPONENT')
            nxt = os.open(component, DIR_FLAGS, dir_fd=fd)
            os.close(fd)
            fd = nxt
        return fd
    except BaseException:
        os.close(fd)
        raise


def _snapshot_fd(root_fd, max_files):
    """Only relative names from pinned directory descriptors are inspected."""
    found, errors = {}, []
    def walk(parent_fd, prefix=''):
        try:
            with os.scandir(parent_fd) as entries:
                names = sorted(entry.name for entry in entries)
        except OSError:
            errors.append('WALK_ERROR_UNREADABLE_DIRECTORY')
            return
        for name in names:
            rel = prefix + name
            if len(found) >= max_files:
                errors.append('FILE_COUNT_LIMIT')
                return
            try:
                before = os.stat(name, dir_fd=parent_fd, follow_symlinks=False)
            except OSError:
                errors.append('ITEM_INACCESSIBLE')
                continue
            if stat.S_ISDIR(before.st_mode):
                try:
                    child = os.open(name, DIR_FLAGS, dir_fd=parent_fd)
                    try:
                        after = os.fstat(child)
                        if identity(before) != identity(after):
                            errors.append('DIRECTORY_REPLACED')
                            continue
                        found[rel + '/'] = identity(after)
                        walk(child, rel + '/')
                    finally:
                        os.close(child)
                except OSError:
                    errors.append('DIRECTORY_REPLACED_OR_UNSAFE')
            else:
                found[rel] = identity(before)
    walk(root_fd)
    return found, errors


def snapshot(root, max_files, root_fd=None):
    if root_fd is not None:
        return _snapshot_fd(root_fd, max_files)
    if not directory_ancestors_safe(root):
        return {}, ['ROOT_ANCESTOR_UNSAFE']
    try:
        fd = open_dir(root)
    except OSError:
        return {}, ['ROOT_ANCESTOR_UNSAFE']
    try:
        return _snapshot_fd(fd, max_files)
    finally:
        os.close(fd)


def _hash_relative(root_fd, relative, baseline, budget):
    """Hash only pinned-root descendants. A concurrent symlink swap cannot redirect read."""
    parts = relative.split('/')
    if not parts or any(x in ('', '.', '..') for x in parts):
        raise ValueError('INVALID_RELATIVE_PATH')
    parent_fd = open_child_dir(root_fd, parts[:-1])
    try:
        fd = os.open(parts[-1], FILE_FLAGS, dir_fd=parent_fd)
        try:
            before = os.fstat(fd)
            if identity(before) != baseline or not stat.S_ISREG(before.st_mode):
                raise ValueError('FILE_CHANGED_BEFORE_READ')
            if before.st_size > budget:
                raise ValueError('HASH_BUDGET_EXCEEDED')
            h, consumed = hashlib.sha256(), 0
            while True:
                chunk = os.read(fd, min(BLOCK, budget - consumed + 1))
                if not chunk:
                    break
                consumed += len(chunk)
                if consumed > budget:
                    raise ValueError('HASH_BUDGET_EXCEEDED_DURING_READ')
                h.update(chunk)
            after = os.fstat(fd)
            if identity(before) != identity(after):
                raise ValueError('FILE_CHANGED_DURING_READ')
            return h.hexdigest(), after.st_size
        finally:
            os.close(fd)
    finally:
        os.close(parent_fd)


def hash_file(path, baseline, budget, root_fd=None, relative=None):
    if root_fd is not None:
        if not isinstance(relative, str):
            raise ValueError('MISSING_RELATIVE_PATH')
        return _hash_relative(root_fd, relative, baseline, budget)
    parent = os.path.dirname(os.path.abspath(path))
    if not directory_ancestors_safe(parent):
        raise ValueError('FILE_ANCESTOR_UNSAFE')
    root_fd = open_dir(parent)
    try:
        return _hash_relative(root_fd, os.path.basename(path), baseline, budget)
    finally:
        os.close(root_fd)


def fingerprint(entries):
    h = hashlib.sha256()
    for rel, value in sorted(entries.items()):
        serialized = json.dumps([rel, value], separators=(',', ':'), ensure_ascii=False)
        h.update(serialized.encode('utf-8'))
        h.update(b'\n')
    return h.hexdigest()


def audit_dir(root, max_files=20000, max_hash_bytes=256 * 1024 ** 2):
    root = os.path.abspath(root)
    result = {'path': root, 'status': 'UNKNOWN', 'files': 0,
              'bytesLogical': 0, 'bytesAllocated': None,
              'inventorySha256': None, 'contentSha256': None,
              'sensitiveCount': 0, 'symlinkCount': 0, 'hashedBytes': 0,
              'issues': [], 'entries': None}
    if not directory_ancestors_safe(root):
        result['status'] = 'UNKNOWN_PRESERVE'
        result['issues'].append('ROOT_ANCESTOR_UNSAFE')
        return result
    try:
        root_fd = open_dir(root)
    except OSError:
        result['status'] = 'UNKNOWN_PRESERVE'
        result['issues'].append('ROOT_UNAVAILABLE')
        return result
    try:
        st = os.fstat(root_fd)
        root_before = identity(st)
        result['ownerUid'] = st.st_uid
        result['rootMode'] = oct(stat.S_IMODE(st.st_mode))
        baseline, errors = snapshot(root, max_files, root_fd)
        result['issues'].extend(errors)
        result['inventorySha256'] = fingerprint(baseline)
        remaining, manifest = max_hash_bytes, []
        for rel, value in sorted(baseline.items()):
            if rel.endswith('/'):
                manifest.append([rel, 'DIRECTORY', stat.S_IMODE(value[4]), None])
                continue
            mode = value[4]
            if stat.S_ISLNK(mode):
                result['symlinkCount'] += 1
                result['issues'].append('SYMLINK_PRESENT_NO_FOLLOW')
                manifest.append([rel, 'SYMLINK', None, None])
                continue
            if not stat.S_ISREG(mode):
                result['issues'].append('SPECIAL_FILE_NOT_READ')
                manifest.append([rel, 'SPECIAL', None, None])
                continue
            result['files'] += 1
            result['bytesLogical'] += value[2]
            if secret_like(rel):
                result['sensitiveCount'] += 1
                result['issues'].append('SENSITIVE_FILE_NOT_HASHED')
                manifest.append([rel, 'SENSITIVE', stat.S_IMODE(mode), None])
                continue
            try:
                digest, used = hash_file(os.path.join(root, rel), value, remaining,
                                         root_fd=root_fd, relative=rel)
                remaining -= used
                result['hashedBytes'] += used
                manifest.append([rel, 'FILE', stat.S_IMODE(mode), digest])
            except (OSError, ValueError):
                result['issues'].append('FILE_UNREADABLE_OR_CHANGED')
                manifest.append([rel, 'UNKNOWN', None, None])
        after, after_errors = snapshot(root, max_files, root_fd)
        result['issues'].extend(after_errors)
        try:
            root_after = identity(os.lstat(root))
        except OSError:
            root_after = None
        if not directory_ancestors_safe(root):
            result['issues'].append('ROOT_ANCESTOR_UNSAFE_AFTER_SCAN')
        if root_before != root_after or baseline != after or root_before != identity(os.fstat(root_fd)):
            result['issues'].append('TREE_CHANGED_DURING_AUDIT')
        if not result['issues']:
            h = hashlib.sha256(json.dumps(manifest, ensure_ascii=False,
                separators=(',', ':')).encode('utf-8')).hexdigest()
            result['contentSha256'] = h
            result['status'] = 'CONTENT_AUDITED_NEEDS_PURPOSE_REVIEW'
        else:
            result['status'] = 'UNKNOWN_PRESERVE'
        result['issues'] = sorted(set(result['issues']))
        result['entries'] = len(baseline)
        return result
    finally:
        os.close(root_fd)


def audit(roots, installed, max_files=20000, max_hash_bytes=2 * 1024 ** 3):
    backups = [audit_dir(x, max_files, max_hash_bytes) for x in roots]
    actual = audit_dir(installed, max_files, max_hash_bytes)
    seen = {}
    for item in backups:
        digest = item['contentSha256']
        if digest:
            if digest in seen:
                item['classification'] = 'POSSIBLE_DUPLICATE_REVIEW_ONLY'
                item['duplicateOf'] = seen[digest]
            else:
                seen[digest] = item['path']
                item['classification'] = 'KEEP_FIRST_VALID_COPY'
            if digest == actual['contentSha256'] and actual['status'].startswith('CONTENT_AUDITED'):
                item['sameAsInstalled'] = True
                item['classification'] = 'MATCHES_INSTALLED_REVIEW_ONLY'
        else:
            item['classification'] = 'UNKNOWN_PRESERVE'
        item['canQuarantine'] = False
        item['canPurge'] = False
    return {'schema': 'nostromo.backup.audit.r0.v1', 'readOnly': True,
            'mutations': 0, 'followedSymlinks': False, 'secretsContentsRead': False,
            'quarantineEnabled': False, 'purgeEnabled': False,
            'backups': backups, 'installedWorkspace': actual,
            'note': 'No deletion authority. Matching byte content does NOT prove backup purpose is obsolete.'}


def main(argv=None):
    p = argparse.ArgumentParser(description='NOSTROMO backup audit R0; stdout only')
    p.add_argument('--root', action='append', default=[])
    p.add_argument('--installed-workspace', default=str(
        Path.home() / 'librechat/upstream/packages/librechat-vx'))
    p.add_argument('--max-files', type=int, default=20000)
    p.add_argument('--max-hash-mib', type=int, default=256)
    args = p.parse_args(argv)
    if not 1 <= args.max_files <= 100000 or not 1 <= args.max_hash_mib <= 8192:
        p.error('limits outside safe range')
    roots = args.root or [str(Path.home() / x) for x in DEFAULT_BACKUPS]
    if len(set(roots)) != len(roots) or len(roots) > 20:
        p.error('duplicate or excessive roots')
    report = audit(roots, args.installed_workspace, args.max_files,
                   args.max_hash_mib * 1024 ** 2)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())

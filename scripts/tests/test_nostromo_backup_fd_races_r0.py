import importlib.util
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).resolve().parents[1] / 'nostromo-backup-audit-r0.py'
spec = importlib.util.spec_from_file_location('nostromo_backup_audit', SCRIPT)
audit_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit_module)


class BackupFdRaceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='nostromo-fd-race-')
        self.addCleanup(self.tmp.cleanup)
        self.home = Path(self.tmp.name)

    def directory(self, name, file='a.txt', content='data'):
        root = self.home / name
        root.mkdir()
        (root / file).write_text(content, encoding='utf-8')
        return root

    def test_symlink_swap_after_snapshot_prevents_external_read(self):
        root = self.directory('r')
        (root / 'inside').mkdir()
        (root / 'inside' / 'data.txt').write_text('SAFE', encoding='utf8')
        outside = self.directory('outside', file='data.txt', content='EXTERNAL_SECRET_MARKER')
        original = audit_module.snapshot
        calls = [0]
        def swap_after_first_snapshot(*args, **kwargs):
            rows = original(*args, **kwargs)
            calls[0] += 1
            if calls[0] == 1:
                (root / 'inside').rename(root / 'saved-inside')
                (root / 'inside').symlink_to(outside, target_is_directory=True)
            return rows
        real_read = os.read
        read_inodes = []
        def checked_read(fd, size):
            read_inodes.append(os.fstat(fd).st_ino)
            return real_read(fd, size)
        with mock.patch.object(audit_module, 'snapshot', side_effect=swap_after_first_snapshot), \
             mock.patch.object(audit_module.os, 'read', side_effect=checked_read):
            report = audit_module.audit_dir(str(root))
        self.assertNotIn((outside / 'data.txt').stat().st_ino, read_inodes)
        self.assertEqual(report['status'], 'UNKNOWN_PRESERVE')
        self.assertIn('FILE_UNREADABLE_OR_CHANGED', report['issues'])
        self.assertEqual((outside / 'data.txt').read_text(), 'EXTERNAL_SECRET_MARKER')

    def test_root_swap_to_symlink_does_not_redirect_pinned_fd(self):
        root = self.directory('root', file='safe.txt', content='SAFE_DATA')
        outside = self.directory('external', file='safe.txt', content='EXTERNAL_SECRET_MARKER')
        external_inode = (outside / 'safe.txt').stat().st_ino
        original_snapshot = audit_module.snapshot
        real_read = os.read
        calls, read_inodes = [0], []
        def swap_root(*args, **kwargs):
            rows = original_snapshot(*args, **kwargs)
            calls[0] += 1
            if calls[0] == 1:
                root.rename(self.home / 'original-root')
                root.symlink_to(outside, target_is_directory=True)
            return rows
        def traced_read(fd, amount):
            read_inodes.append(os.fstat(fd).st_ino)
            return real_read(fd, amount)
        with mock.patch.object(audit_module, 'snapshot', side_effect=swap_root), \
             mock.patch.object(audit_module.os, 'read', side_effect=traced_read):
            report = audit_module.audit_dir(str(root))
        self.assertEqual(report['status'], 'UNKNOWN_PRESERVE')
        self.assertNotIn(external_inode, read_inodes)
        self.assertIn('ROOT_ANCESTOR_UNSAFE_AFTER_SCAN', report['issues'])
        self.assertEqual((outside / 'safe.txt').read_text(), 'EXTERNAL_SECRET_MARKER')

    def test_child_swap_before_scandir_blocks_external_directory(self):
        root = self.directory('root', file='other.txt')
        child = root / 'child'
        child.mkdir()
        (child / 'inside.txt').write_text('SAFE')
        outside = self.directory('outside', file='inside.txt', content='EXTERNAL')
        original_open = os.open
        calls = [0]
        def swap_before_open(path, flags, *args, **kwargs):
            if path == 'child' and kwargs.get('dir_fd') is not None and calls[0] == 0:
                calls[0] += 1
                child.rename(root / 'saved-child')
                child.symlink_to(outside, target_is_directory=True)
            return original_open(path, flags, *args, **kwargs)
        real_read = os.read
        read_inodes = []
        def checked_read(fd, size):
            read_inodes.append(os.fstat(fd).st_ino)
            return real_read(fd, size)
        with mock.patch.object(audit_module.os, 'open', side_effect=swap_before_open), \
             mock.patch.object(audit_module.os, 'read', side_effect=checked_read):
            report = audit_module.audit_dir(str(root))
        self.assertNotIn((outside / 'inside.txt').stat().st_ino, read_inodes)
        self.assertEqual(calls[0], 1)
        self.assertEqual(report['status'], 'UNKNOWN_PRESERVE')
        self.assertTrue(any('DIRECTORY_REPLACED' in x for x in report['issues']))
        self.assertEqual((outside / 'inside.txt').read_text(), 'EXTERNAL')


if __name__ == '__main__':
    unittest.main()

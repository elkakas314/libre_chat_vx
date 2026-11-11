import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1] / 'review-third-upstream-move-gate-r0.py'
spec = importlib.util.spec_from_file_location('nostromo_gate', SOURCE)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def extracted():
    return {'schema': gate.EXTRACTED, 'readOnly': True, 'liveVerified': False,
            'sourceContentsPrinted': False, 'sourceReportSha256': 'abc',
            'counts': {'differences': 3, 'vxReferences': 8},
            'differences': [
                {'path': 'src/unique.ts', 'relation': 'ONLY_IN_THIRD', 'size': 6},
                {'path': 'src/changed.ts', 'relation': 'DIFFERENT_CONTENT', 'size': 4},
                {'path': 'docs/change.md', 'relation': 'DIFFERENT_CONTENT', 'size': 4},
            ], 'vxReferences': [f'src/ref-{n}.ts' for n in range(8)]}


def put(root, name, content):
    dest = root / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content, encoding='utf-8')
    return dest


class ThirdUpstreamMoveGateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name)
        self.third = self.home / 'upstream'
        self.integrated = self.home / 'librechat/upstream'
        self.vx = self.home / 'librechat/vx'
        for root in (self.third, self.integrated, self.vx):
            root.mkdir(parents=True)
        put(self.third, 'src/unique.ts', 'unique')
        put(self.third, 'src/changed.ts', 'left')
        put(self.integrated, 'src/changed.ts', 'right')
        put(self.third, 'docs/change.md', 'left')
        put(self.integrated, 'docs/change.md', 'right')
        for n in range(8):
            put(self.vx, f'src/ref-{n}.ts', f'const path="{gate.NEEDLE.decode()}";')

    def review(self, doc=None):
        return gate.review(doc or extracted(), self.third, self.integrated, self.vx, home=self.home)

    def test_exact_bounded_readback_and_never_approve_move(self):
        result = self.review()
        self.assertEqual(result['status'], 'R0_RECONCILIATION_PENDING')
        self.assertFalse(result['migrationAllowed'])
        self.assertTrue(all(x['relationStillHolds'] for x in result['differences']))
        self.assertTrue(all(x['exactAbsolutePathStillReferenced'] for x in result['vxReferences']))
        self.assertNotIn(str(gate.NEEDLE.decode()), json.dumps(result))
        self.assertNotIn('const path=', json.dumps(result))
        self.assertEqual(result['counts'], {'differencesInspected': 3, 'referencesInspected': 8})

    def test_stale_snapshot_detected_and_move_blocked(self):
        put(self.integrated, 'src/changed.ts', 'left')
        result = self.review()
        self.assertEqual(result['status'], 'R0_STALE_OR_UNVERIFIED')
        self.assertEqual(result['differences'][1]['observedRelation'], 'IDENTICAL')
        self.assertFalse(result['migrationAllowed'])

    def test_symlink_and_missing_reference_block_gate(self):
        (self.vx / 'src/ref-0.ts').unlink()
        (self.vx / 'src/ref-0.ts').symlink_to(self.vx / 'src/ref-1.ts')
        (self.vx / 'src/ref-2.ts').unlink()
        result = self.review()
        self.assertEqual(result['vxReferences'][0]['readState'], 'SYMLINK_BLOCKED')
        self.assertEqual(result['vxReferences'][2]['readState'], 'ABSENT')
        self.assertFalse(result['migrationAllowed'])

    def test_sensitive_traversal_duplicate_and_wrong_baseline_refused(self):
        for candidate in ('.env', '../etc/shadow', 'src/token-file', '/tmp/abs', 'src//no'):
            with self.subTest(candidate=candidate):
                with self.assertRaises(ValueError):
                    gate.relative(candidate)
        x = extracted(); x['vxReferences'][0] = x['vxReferences'][1]
        with self.assertRaisesRegex(ValueError, 'DUPLICATE_VX_REFERENCE'):
            self.review(x)
        x = extracted(); x['counts']['vxReferences'] = 7
        with self.assertRaisesRegex(ValueError, 'EXTRACTED_REPORT_INVALID'):
            self.review(x)

    def test_size_limit_and_root_symlink_fail_closed(self):
        put(self.vx, 'src/ref-0.ts', 'x' * (gate.MAX_REFERENCE_BYTES + 1))
        result = self.review()
        self.assertEqual(result['vxReferences'][0]['readState'], 'SIZE_LIMIT')
        self.assertFalse(result['migrationAllowed'])
        fake = Path(self.temp.name) / 'link'
        fake.symlink_to(self.third)
        result = gate.review(extracted(), fake, self.integrated, self.vx, home=self.home)
        self.assertEqual(result['status'], 'ROOTS_BLOCKED')

    def test_parent_symlink_refuses_external_reads_and_mutations(self):
        # The canonical lexical path exists but its intermediate librechat/
        # points to an external tree. No checked_bytes invocation is allowed.
        outside = self.home / 'outside-data'
        outside.mkdir()
        original = self.home / 'librechat'
        relocated = outside / 'legitimate-data'
        original.rename(relocated)  # Fixture setup only, before measured gate.
        original.symlink_to(relocated, target_is_directory=True)
        marker = relocated / 'vx/src/ref-0.ts'
        original_bytes = marker.read_bytes()
        with patch.object(gate, 'checked_bytes', side_effect=AssertionError('UNSAFE_EXTERNAL_READ')) as reads:
            result = self.review()
            reads.assert_not_called()
        self.assertEqual(result['status'], 'ROOTS_BLOCKED')
        self.assertEqual(result['roots']['integrated'], 'ROOT_SYMLINK_BLOCKED')
        self.assertEqual(result['roots']['vx'], 'ROOT_SYMLINK_BLOCKED')
        self.assertFalse(result['migrationAllowed'])
        self.assertEqual(result['mutations'], 0)
        self.assertEqual(marker.read_bytes(), original_bytes)
        self.assertTrue(original.is_symlink())
        self.assertTrue(relocated.is_dir())

    def test_root_scope_and_ancestor_not_directory_refused(self):
        alternative = self.home / 'outside-data'
        alternative.mkdir()
        self.assertEqual(gate.root_state(alternative, self.home / 'upstream'),
                         'ROOT_OUTSIDE_CANONICAL_SCOPE')
        self.assertEqual(gate.root_state(self.home / 'upstream/../librechat/upstream',
                                         self.home / 'librechat/upstream'),
                         'ROOT_OUTSIDE_CANONICAL_SCOPE')
        bad = self.home / 'bad'
        bad.write_text('regular-file')
        self.assertEqual(gate.root_state(bad / 'upstream', bad / 'upstream'),
                         'ROOT_ANCESTOR_NOT_DIRECTORY')
        with patch.object(gate, 'checked_bytes', side_effect=AssertionError('EXTERNAL_READ')) as reads:
            result = gate.review(extracted(), alternative, self.integrated, self.vx, home=self.home)
            reads.assert_not_called()
        self.assertFalse(result['migrationAllowed'])

    def test_cli_refuses_malformed_input_without_mutations(self):
        result = subprocess.run([sys.executable, str(SOURCE), '--third', str(self.third),
             '--integrated', str(self.integrated), '--vx', str(self.vx)],
             input='{"not":"a report"}', capture_output=True, text=True, timeout=5)
        self.assertEqual(result.returncode, 2)
        self.assertFalse(json.loads(result.stdout)['migrationAllowed'])


if __name__ == '__main__':
    unittest.main()

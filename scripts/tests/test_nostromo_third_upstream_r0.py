import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1] / "audit-nostromo-third-upstream-r0.py"
spec = importlib.util.spec_from_file_location("nostromo_third_audit", SOURCE)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class ThirdUpstreamAuditTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory(prefix="nostromo-third-upstream-test-")
        self.addCleanup(self.dir.cleanup)
        self.root = Path(self.dir.name)
        self.third = self.root / "third"
        self.integrated = self.root / "integrated"
        self.third.mkdir()
        self.integrated.mkdir()

    def perform(self):
        return audit.scan(self.third, self.integrated, 1000,
                          1024 * 1024, 32, 4, False, 20)

    def test_distinguishes_unique_api_e2e_scripts_skills_redis(self):
        for rel in ("api/routes/hello.ts", "e2e/browser.spec.ts",
                    "scripts/smoke.sh", "skills/custom/SKILL.md",
                    "api/redis/cache.js"):
            p = self.third / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text("fixture", encoding="utf8")
        r = self.perform()
        for group in ("API_BACKEND", "E2E_TESTS", "SCRIPTS_CLI",
                      "SKILLS_PLUGINS", "REDIS_QUEUES"):
            self.assertGreater(r["categories"][group]["files"], 0, group)
        self.assertGreater(r["counts"]["relations"]["ONLY_IN_THIRD"], 0)
        self.assertFalse(r["conclusions"]["thirdCanBeDeleted"])
        self.assertFalse(r["conclusions"]["redisLiveVerified"])

    def test_env_never_opened_even_if_symlink_points_outside_root(self):
        unique = self.root / "outside.txt"
        unique.write_text("SECRET_SENTINEL_NEVER_SHOW", encoding="utf8")
        (self.third / ".env").symlink_to(unique)
        (self.third / "api").mkdir()
        (self.third / "api" / "auth.ts").write_text(
            "export const x='safe';", encoding="utf8")
        r = self.perform()
        raw = json.dumps(r)
        self.assertNotIn("SECRET_SENTINEL_NEVER_SHOW", raw)
        self.assertGreaterEqual(r["counts"]["symlinksNotFollowed"], 1)
        self.assertFalse(r["presenceOnly"]["thirdEnv"])

    def test_compares_existing_content_without_claiming_tests_executed(self):
        for directory, data in ((self.third, "x"), (self.integrated, "x")):
            p = directory / "api" / "route.ts"
            p.parent.mkdir()
            p.write_text(data, encoding="utf8")
        r = self.perform()
        self.assertEqual(r["counts"]["relations"]["IDENTICAL"], 1)
        self.assertFalse(r["conclusions"]["apiE2eTestsExecuted"])
        (self.integrated / "api" / "route.ts").write_text("modified", encoding="utf8")
        self.assertEqual(self.perform()["counts"]["relations"]["DIFFERENT_CONTENT"], 1)


    def test_redis_signal_detected_in_generic_file_without_executing_it(self):
        (self.third / "backend").mkdir()
        (self.third / "backend" / "config.ts").write_text(
            "import Redis from 'ioredis';", encoding="utf8")
        r = self.perform()
        self.assertGreater(r["sourceSignals"]["REDIS_QUEUE_CALLS"]["filesContainingSignal"], 0)
        self.assertFalse(r["conclusions"]["redisLiveVerified"])

    def test_cross_tree_absolute_references_are_detected_without_printing_source(self):
        (self.integrated / "scripts").mkdir()
        (self.integrated / "scripts" / "legacy-migrate.sh").write_text(
            "cd /home/elkakas314/upstream; echo FICTIONAL_SENTINEL", encoding="utf8")
        r = self.perform()
        x = r["crossTreePathReferences"]["integrated"]
        self.assertEqual(x["filesReferencingThirdAbsolutePath"], 1)
        self.assertIn("scripts/legacy-migrate.sh", x["examples"])
        self.assertNotIn("FICTIONAL_SENTINEL", json.dumps(r))

    def test_missing_lock_and_distinct_env_are_only_warnings(self):
        (self.third / ".env").write_text("PASSWORD=private", encoding="utf8")
        (self.integrated / "package-lock.json").write_text("{}", encoding="utf8")
        r = self.perform()
        self.assertTrue(r["presenceOnly"]["thirdEnv"])
        self.assertFalse(r["presenceOnly"]["integratedEnv"])
        self.assertIn("THIRD_ENV_ONLY_DO_NOT_COPY_OR_PRINT", r["warnings"])
        self.assertIn("THIRD_LOCK_MISSING_PRESERVE_STATE", r["warnings"])
        self.assertNotIn("PASSWORD=private", json.dumps(r))

if __name__ == "__main__":
    unittest.main()

"""Offline, side-effect-free tests for the deferred Switchboard installation adapter."""
import importlib.util
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("installer", ROOT / "install_into_switchboard.py")
assert SPEC and SPEC.loader
importer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(importer)


class InstallAdapterTests(unittest.TestCase):
    def test_xcode_registers_all_swift_and_privacy_resources_once(self):
        sample = (
            "/* Begin PBXBuildFile section */\n/* End PBXBuildFile section */\n"
            "/* Begin PBXFileReference section */\n/* End PBXFileReference section */\n"
            "\t\t\t\tBBB00014 /* ScheduleCheckTask.swift */,\n"
            "\t\t\t\tAAA00014 /* ScheduleCheckTask.swift in Sources */,\n"
            "\t\t\t\tAAA0000C /* Assets.xcassets in Resources */,\n"
        )
        patched = importer.patch_xcode(sample)
        self.assertEqual(importer.patch_xcode(patched), patched)
        for name in importer.IOS_SWIFT:
            self.assertIn("NostromoDeviceControl/" + name, patched)
        self.assertIn("NostromoDeviceControl/PrivacyInfo.xcprivacy", patched)
        self.assertIn("AAA00019 /* PrivacyInfo.xcprivacy in Resources */", patched)

    def test_xcode_fails_closed_if_its_shape_drifted(self):
        with self.assertRaises(ValueError):
            importer.patch_xcode("unrelated")
        with self.assertRaises(ValueError):
            importer.patch_xcode("AAA00015 /* collision */")

    def test_xcode_fails_closed_on_partial_existing_registration(self):
        with self.assertRaises(ValueError):
            importer.patch_xcode("NostromoDeviceControl/NostromoIOSProbe.swift")

    def make_navigation_fixture(self, target: pathlib.Path):
        prefix = target / "feature/agents/src/commonMain"
        pieces = {
            prefix / "kotlin/com/garfiec/librechat/feature/agents/navigation/AgentsNavigation.kt": (
                "import com.garfiec.librechat.feature.agents.screen.NostromoHubScreen\n"
                "@Serializable data object NostromoHub : AgentsRoute\n"
                "            onStartChatWithPrompt = onStartChatWithPrompt,\n"
                "        )\n    }\n    entry<AgentMarketplace>\n"
                "        subclass(NostromoHub::class, NostromoHub.serializer())\n"
            ),
            prefix / "kotlin/com/garfiec/librechat/feature/agents/screen/NostromoHubScreen.kt": (
                "import com.garfiec.librechat.feature.agents.resources.nostromo_title\n"
                "    onStartChatWithPrompt: (agentId: String, prompt: String) -> Unit,\n)\n"
                "            Text(stringResource(Res.string.nostromo_agent_not_live), style = MaterialTheme.typography.bodyMedium)\n"
            ),
            prefix / "composeResources/values/strings.xml": (
                '<resources>\n    <string name="nostromo_title">Tentáculo · NOSTROMO</string>\n</resources>'
            ),
            target / "shared/src/commonMain/kotlin/com/garfiec/librechat/shared/navigation/WorkspaceRoutes.kt": (
                "import com.garfiec.librechat.feature.agents.navigation.NostromoHub\n"
                "    NostromoHub -> WorkspaceDestination.NOSTROMO\n"
            ),
        }
        for path, content in pieces.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        return pieces

    def test_navigation_is_idempotent_and_only_edits_four_files(self):
        with tempfile.TemporaryDirectory() as d:
            target = pathlib.Path(d)
            original = self.make_navigation_fixture(target)
            changes = importer.navigation_patches(target)
            self.assertEqual(len(changes), 4)
            for path, data in changes:
                self.assertIn(path, original)
                path.write_bytes(data)
            self.assertEqual(importer.navigation_patches(target), [])
            self.assertIn("onOpenDeviceControl", next(
                p for path, p in [(x, x.read_text()) for x in original] if path.name == "NostromoHubScreen.kt"
            ))

    def test_navigation_drift_does_not_edit_files(self):
        with tempfile.TemporaryDirectory() as d:
            target = pathlib.Path(d)
            files = self.make_navigation_fixture(target)
            hub = next(p for p in files if p.name == "NostromoHubScreen.kt")
            hub.write_text("changed by another agent")
            original = {p: p.read_bytes() for p in files}
            with self.assertRaises(ValueError):
                importer.navigation_patches(target)
            self.assertEqual({p: p.read_bytes() for p in files}, original)

    def test_source_manifest_consistent(self):
        src = ROOT / "source"
        for name in importer.IOS_SWIFT:
            self.assertTrue((src / "iosApp/iosApp/NostromoDeviceControl" / name).is_file(), name)
        self.assertTrue((src / "iosApp/iosApp/NostromoDeviceControl/PrivacyInfo.xcprivacy").is_file())
        self.assertTrue((src / "feature/agents/src/commonMain/kotlin/com/garfiec/librechat/feature/agents/devicecontrol/DeviceTelemetryProbe.kt").is_file())


if __name__ == "__main__":
    unittest.main()

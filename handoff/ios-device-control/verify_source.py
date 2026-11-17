#!/usr/bin/env python3
"""Offline verification of the deferred mobile source package.

Does not touch Lenovo, browser, credentials, device, network or another repo.
SOURCE gates only; cannot certify iOS installation or Apple SDK typechecking.
"""
from __future__ import annotations
import pathlib
import plistlib
import shutil
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "source"
IOS = SRC / "iosApp/iosApp/NostromoDeviceControl"
POLICY = SRC / "feature/agents/src/commonMain/kotlin/com/garfiec/librechat/feature/agents/devicecontrol/DeviceControlPolicy.kt"


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)
    print(f"PASS {message}")


def run(argv: list[str], timeout: int = 60) -> None:
    print("CHECK", " ".join(argv[:4]))
    result = subprocess.run(argv, cwd=HERE, capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        print(result.stdout[-3000:], result.stderr[-3000:], file=sys.stderr)
        raise AssertionError(f"failed({result.returncode}): {argv[0]}")
    if result.stdout:
        print(result.stdout.strip()[-900:])


def main() -> None:
    check(POLICY.is_file(), "capability and privacy policy exists")
    with (IOS / "PrivacyInfo.xcprivacy").open("rb") as file:
        privacy = plistlib.load(file)
    reasons = {t["NSPrivacyAccessedAPIType"]: t["NSPrivacyAccessedAPITypeReasons"]
               for t in privacy["NSPrivacyAccessedAPITypes"]}
    check(reasons.get("NSPrivacyAccessedAPICategoryDiskSpace") == ["85F4.1"],
          "Apple local-display disk space reason 85F4.1")
    policy_text = POLICY.read_text()
    for token in ("transmitsTelemetryOffDevice", "outboundTelemetryConsent",
                  "DeviceCapability.VOLUME_CAPACITY", "DeviceCapability.APP_CACHE_USAGE"):
        check(token in policy_text, f"explicit data-boundary policy {token}")
    run([sys.executable, "-m", "unittest", "discover", "-s", str(HERE / "tests"),
         "-p", "test_*.py", "-v"], timeout=20)
    if (cc := shutil.which("swiftc")) is not None:
        for file in sorted(IOS.glob("*.swift")):
            run([cc, "-frontend", "-parse", str(file)], timeout=20)
        print("PASS Swift syntax parse (NOT Apple SDK typecheck)")
    else:
        print("SKIP Swift syntax parse — swiftc not installed")
    if shutil.which("kotlinc") and shutil.which("java"):
        with tempfile.TemporaryDirectory(prefix="nostromo-ios-source-") as temp:
            jar = str(pathlib.Path(temp) / "smoke.jar")
            run(["kotlinc", str(POLICY), str(HERE / "tests/PolicySmoke.kt"),
                 "-include-runtime", "-d", jar], timeout=65)
            run(["java", "-jar", jar], timeout=15)
    else:
        print("SKIP Kotlin/JVM smoke — kotlinc/java not installed")
    print("SOURCE_VERIFICATION_PASS; IOS_BUILD_LIVE_NOT_VERIFIED")


if __name__ == "__main__":
    main()

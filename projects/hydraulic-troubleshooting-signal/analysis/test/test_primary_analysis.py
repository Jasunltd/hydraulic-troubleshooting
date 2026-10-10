from __future__ import annotations

import importlib.util
import tempfile
import unittest
import zipfile
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "analyze.py"
spec = importlib.util.spec_from_file_location("hydraulic_analysis", MODULE_PATH)
assert spec and spec.loader
analysis = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analysis)


class HydraulicPrimaryAnalysisSeams(unittest.TestCase):
    def test_profile_contract_rejects_unknown_levels_and_incomplete_factorial(self) -> None:
        levels = [
            analysis.COMPONENTS["cooler"]["levels"],
            analysis.COMPONENTS["valve"]["levels"],
            analysis.COMPONENTS["pump"]["levels"],
            analysis.COMPONENTS["accumulator"]["levels"],
        ]
        profile = []
        for cooler in levels[0]:
            for valve in levels[1]:
                for pump in levels[2]:
                    for accumulator in levels[3]:
                        row = (cooler, valve, pump, accumulator, 0)
                        profile.extend([row, row])
        analysis.validate_profile_contract(profile)

        bad = list(profile)
        bad[0] = (999, bad[0][1], bad[0][2], bad[0][3], 0)
        with self.assertRaisesRegex(ValueError, "unexpected cooler_pct"):
            analysis.validate_profile_contract(bad)

        with self.assertRaisesRegex(ValueError, "design incomplete"):
            analysis.validate_profile_contract(profile[:-2])

    def test_stable_split_is_deterministic_disjoint_and_excludes_transients(self) -> None:
        profile = [
            (100, 100, 0, 130, 0),
            (100, 100, 0, 130, 0),
            (100, 100, 0, 130, 0),
            (100, 100, 0, 130, 0),
            (100, 100, 0, 130, 1),
            (3, 73, 2, 90, 0),
            (3, 73, 2, 90, 0),
        ]
        discovery, verification = analysis.split_stable(profile)
        self.assertEqual((discovery, verification), analysis.split_stable(profile))
        self.assertFalse(set(discovery) & set(verification))
        self.assertEqual(set(discovery) | set(verification), {0, 1, 2, 3, 5, 6})
        self.assertNotIn(4, discovery)
        self.assertNotIn(4, verification)

    def test_matched_effect_holds_other_component_states_fixed(self) -> None:
        profile = [
            (100, 100, 0, 130, 0),
            (100, 100, 2, 130, 0),
            (3, 73, 0, 90, 0),
            (3, 73, 2, 90, 0),
            (20, 90, 0, 115, 0),
        ]
        values = [10.0, 12.0, 100.0, 102.0, -500.0]
        result = analysis.matched_effect(values, profile, range(len(profile)), "pump")
        self.assertEqual(result["matched_strata"], 2)
        self.assertEqual(result["direction"], "up")
        self.assertEqual(result["direction_consistency"], 1.0)
        self.assertAlmostEqual(result["mean_difference"], 2.0)

    def test_sensor_compile_boundary_rejects_nonfinite_and_wrong_width(self) -> None:
        original = analysis.SENSORS
        analysis.SENSORS = {"X": 12}
        try:
            with tempfile.NamedTemporaryFile(suffix=".zip") as fh:
                with zipfile.ZipFile(fh.name, "w") as zf:
                    zf.writestr("X.txt", " ".join(["1"] * 11) + "\n")
                with zipfile.ZipFile(fh.name) as zf:
                    with self.assertRaisesRegex(ValueError, "expected 12 samples"):
                        analysis.extract_features(zf, 1)

            with tempfile.NamedTemporaryFile(suffix=".zip") as fh:
                with zipfile.ZipFile(fh.name, "w") as zf:
                    zf.writestr("X.txt", " ".join(["1"] * 11 + ["nan"]) + "\n")
                with zipfile.ZipFile(fh.name) as zf:
                    with self.assertRaisesRegex(ValueError, "non-finite value"):
                        analysis.extract_features(zf, 1)
        finally:
            analysis.SENSORS = original


if __name__ == "__main__":
    unittest.main()

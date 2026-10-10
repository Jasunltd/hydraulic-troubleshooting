#!/usr/bin/env python3
"""Deterministic analysis for the public UCI/ZeMA hydraulic condition-monitoring dataset.

The analysis is deliberately interpretable:
1. audit source/profile/sensor alignment;
2. extract cycle summaries plus twelve equal-duration window means;
3. exclude source-flagged non-static cycles from component-effect estimation;
4. split repeated cycles within every stable factorial cell into discovery and verification halves;
5. estimate matched healthy-to-severe effects while holding the other three component states fixed;
6. verify direction and effect repeatability on the untouched half.

No machine-learning model is fit. No field diagnostic accuracy, maintenance benefit, downtime reduction,
savings, safety improvement, or sustainment outcome is inferred.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import statistics
import sys
import zipfile
from datetime import datetime, timezone
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
ZIP_PATH = ROOT / "data" / "raw" / "hydraulic-systems.zip"
PROCESSED = ROOT / "data" / "processed"
EVIDENCE = ROOT / "evidence"
RECEIPTS = EVIDENCE / "receipts"

SENSORS: dict[str, int] = {
    "PS1": 6000, "PS2": 6000, "PS3": 6000, "PS4": 6000, "PS5": 6000, "PS6": 6000,
    "EPS1": 6000, "FS1": 600, "FS2": 600,
    "TS1": 60, "TS2": 60, "TS3": 60, "TS4": 60, "VS1": 60, "CE": 60, "CP": 60, "SE": 60,
}
WINDOWS = 12

COMPONENTS: dict[str, dict[str, object]] = {
    "cooler": {"column": 0, "levels": [100, 20, 3], "healthy": 100, "severe": 3},
    "valve": {"column": 1, "levels": [100, 90, 80, 73], "healthy": 100, "severe": 73},
    "pump": {"column": 2, "levels": [0, 1, 2], "healthy": 0, "severe": 2},
    "accumulator": {"column": 3, "levels": [130, 115, 100, 90], "healthy": 130, "severe": 90},
}
PROFILE_NAMES = ["cooler_pct", "valve_pct", "pump_leakage", "accumulator_bar", "stable_flag"]
EXPECTED_PROFILE_LEVELS = {
    0: set(int(x) for x in COMPONENTS["cooler"]["levels"]),
    1: set(int(x) for x in COMPONENTS["valve"]["levels"]),
    2: set(int(x) for x in COMPONENTS["pump"]["levels"]),
    3: set(int(x) for x in COMPONENTS["accumulator"]["levels"]),
    4: {0, 1},
}

# Frozen before the second pass. These are engineering repeatability screens, not p-value thresholds.
DISCOVERY_MATCHED_EFFECT_MIN = 1.00
VERIFY_MATCHED_EFFECT_MIN = 0.80
DISCOVERY_CONSISTENCY_MIN = 0.90
VERIFY_CONSISTENCY_MIN = 0.85
TOP_PER_COMPONENT = 10


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sample_sd(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    return math.sqrt(max(0.0, sum((v - mean) ** 2 for v in values) / (len(values) - 1)))


def summarize_cycle(values: list[float]) -> tuple[float, float, float, float, list[float]]:
    n = len(values)
    total = sum(values)
    mean = total / n
    sq = sum(v * v for v in values)
    variance = max(0.0, (sq - n * mean * mean) / (n - 1)) if n > 1 else 0.0
    width = n // WINDOWS
    if width * WINDOWS != n:
        raise ValueError(f"sample count {n} is not divisible by {WINDOWS} windows")
    window_means = [sum(values[w * width:(w + 1) * width]) / width for w in range(WINDOWS)]
    return mean, math.sqrt(variance), max(values) - min(values), values[-1] - values[0], window_means


def read_profile(zf: zipfile.ZipFile) -> list[tuple[int, int, int, int, int]]:
    rows: list[tuple[int, int, int, int, int]] = []
    for line_no, raw in enumerate(zf.read("profile.txt").decode("utf-8").splitlines(), start=1):
        if not raw.strip():
            continue
        parts = raw.split()
        if len(parts) != 5:
            raise ValueError(f"profile.txt line {line_no}: expected 5 columns, got {len(parts)}")
        rows.append(tuple(int(x) for x in parts))  # type: ignore[arg-type]
    return rows


def validate_profile_contract(profile: list[tuple[int, int, int, int, int]]) -> None:
    if not profile:
        raise ValueError("profile.txt contains no rows")
    for row_no, row in enumerate(profile, start=1):
        if len(row) != 5:
            raise ValueError(f"profile row {row_no}: expected 5 values")
        for column, value in enumerate(row):
            if value not in EXPECTED_PROFILE_LEVELS[column]:
                raise ValueError(
                    f"profile row {row_no}: unexpected {PROFILE_NAMES[column]} value {value}"
                )

    stable = [row[:4] for row in profile if row[4] == 0]
    counts = Counter(stable)
    expected = math.prod(len(COMPONENTS[name]["levels"]) for name in COMPONENTS)
    if len(counts) != expected:
        raise ValueError(
            f"stable profile design incomplete: expected {expected} component combinations, got {len(counts)}"
        )
    if min(counts.values()) < 2:
        raise ValueError("stable profile design needs at least two repeats per component combination")


def extract_features(
    zf: zipfile.ZipFile,
    profile_rows: int,
) -> tuple[dict[str, list[float]], dict[str, list[float]], dict[str, dict[str, int]]]:
    persisted: dict[str, list[float]] = {}
    analysis: dict[str, list[float]] = {}
    audit: dict[str, dict[str, int]] = {}

    for sensor, expected_samples in SENSORS.items():
        means: list[float] = []
        sds: list[float] = []
        ranges: list[float] = []
        deltas: list[float] = []
        windows: list[list[float]] = [[] for _ in range(WINDOWS)]
        bad_width = 0

        with zf.open(f"{sensor}.txt") as raw:
            stream = io.TextIOWrapper(raw, encoding="utf-8", newline="")
            for line_no, line in enumerate(stream, start=1):
                parts = line.split()
                if len(parts) != expected_samples:
                    bad_width += 1
                    raise ValueError(
                        f"{sensor}.txt line {line_no}: expected {expected_samples} samples, got {len(parts)}"
                    )
                values = [float(x) for x in parts]
                if any(not math.isfinite(value) for value in values):
                    raise ValueError(f"{sensor}.txt line {line_no}: non-finite value")
                mean, sd, value_range, delta, window_means = summarize_cycle(values)
                means.append(mean)
                sds.append(sd)
                ranges.append(value_range)
                deltas.append(delta)
                for w, value in enumerate(window_means):
                    windows[w].append(value)

        if len(means) != profile_rows:
            raise ValueError(f"{sensor}: {len(means)} rows != profile rows {profile_rows}")

        base = {
            f"{sensor}_mean": means,
            f"{sensor}_sd": sds,
            f"{sensor}_range": ranges,
            f"{sensor}_delta": deltas,
        }
        persisted.update(base)
        analysis.update(base)
        for w in range(WINDOWS):
            analysis[f"{sensor}_w{w + 1:02d}_mean"] = windows[w]

        audit[sensor] = {
            "rows": len(means),
            "expected_samples_per_cycle": expected_samples,
            "width_mismatches": bad_width,
        }
        print(f"processed {sensor}: {len(means)} cycles x {expected_samples} samples")

    return persisted, analysis, audit


def split_stable(profile: list[tuple[int, int, int, int, int]]) -> tuple[list[int], list[int]]:
    by_combo: dict[tuple[int, int, int, int], list[int]] = defaultdict(list)
    for idx, row in enumerate(profile):
        if row[4] == 0:
            by_combo[row[:4]].append(idx)

    discovery: list[int] = []
    verification: list[int] = []
    for combo in sorted(by_combo):
        for pos, idx in enumerate(sorted(by_combo[combo])):
            (discovery if pos % 2 == 0 else verification).append(idx)
    return sorted(discovery), sorted(verification)


def grouped_effect(
    values: list[float],
    profile: list[tuple[int, int, int, int, int]],
    indices: Iterable[int],
    component: str,
) -> dict[str, object]:
    spec = COMPONENTS[component]
    col = int(spec["column"])
    levels = [int(x) for x in spec["levels"]]
    groups: dict[int, list[float]] = {level: [] for level in levels}
    used: list[float] = []

    for idx in indices:
        level = profile[idx][col]
        value = values[idx]
        groups[level].append(value)
        used.append(value)

    grand = sum(used) / len(used)
    means = {level: statistics.fmean(groups[level]) for level in levels}
    ss_total = sum((v - grand) ** 2 for v in used)
    ss_between = sum(len(groups[level]) * (means[level] - grand) ** 2 for level in levels)
    eta2 = ss_between / ss_total if ss_total > 0 else 0.0

    ordered_means = [means[level] for level in levels]
    monotonic = (
        all(a <= b for a, b in zip(ordered_means, ordered_means[1:]))
        or all(a >= b for a, b in zip(ordered_means, ordered_means[1:]))
    )
    delta = means[int(spec["severe"])] - means[int(spec["healthy"])]
    direction = "up" if delta > 0 else "down" if delta < 0 else "flat"

    return {
        "eta2": eta2,
        "group_means": {str(level): means[level] for level in levels},
        "group_counts": {str(level): len(groups[level]) for level in levels},
        "healthy_to_severe_delta": delta,
        "monotonic": monotonic,
        "direction": direction,
    }


def matched_effect(
    values: list[float],
    profile: list[tuple[int, int, int, int, int]],
    indices: Iterable[int],
    component: str,
) -> dict[str, object]:
    spec = COMPONENTS[component]
    target_col = int(spec["column"])
    healthy = int(spec["healthy"])
    severe = int(spec["severe"])
    other_cols = [c for c in range(4) if c != target_col]

    cells: dict[tuple[int, int, int], dict[int, list[float]]] = defaultdict(lambda: defaultdict(list))
    for idx in indices:
        row = profile[idx]
        target_level = row[target_col]
        if target_level not in (healthy, severe):
            continue
        stratum = tuple(row[c] for c in other_cols)
        cells[stratum][target_level].append(values[idx])

    diffs: list[float] = []
    within_ss = 0.0
    within_df = 0
    for stratum in sorted(cells):
        healthy_vals = cells[stratum].get(healthy, [])
        severe_vals = cells[stratum].get(severe, [])
        if not healthy_vals or not severe_vals:
            continue
        h_mean = statistics.fmean(healthy_vals)
        s_mean = statistics.fmean(severe_vals)
        diffs.append(s_mean - h_mean)
        for vals, mean in ((healthy_vals, h_mean), (severe_vals, s_mean)):
            within_ss += sum((v - mean) ** 2 for v in vals)
            within_df += max(0, len(vals) - 1)

    if not diffs:
        raise ValueError(f"no matched healthy/severe strata for {component}")

    mean_diff = statistics.fmean(diffs)
    median_diff = statistics.median(diffs)
    pooled_within_sd = math.sqrt(within_ss / within_df) if within_df > 0 else 0.0
    if pooled_within_sd > 0:
        effect_sd = mean_diff / pooled_within_sd
    elif mean_diff > 0:
        effect_sd = math.inf
    elif mean_diff < 0:
        effect_sd = -math.inf
    else:
        effect_sd = 0.0

    positive = sum(d > 0 for d in diffs)
    negative = sum(d < 0 for d in diffs)
    nonzero = positive + negative
    consistency = max(positive, negative) / nonzero if nonzero else 0.0
    direction = "up" if mean_diff > 0 else "down" if mean_diff < 0 else "flat"

    return {
        "matched_strata": len(diffs),
        "mean_difference": mean_diff,
        "median_difference": median_diff,
        "pooled_within_sd": pooled_within_sd,
        "effect_sd": effect_sd,
        "direction": direction,
        "direction_consistency": consistency,
        "difference_sd_across_strata": sample_sd(diffs),
        "min_stratum_difference": min(diffs),
        "max_stratum_difference": max(diffs),
    }


def write_cycle_features(
    profile: list[tuple[int, int, int, int, int]],
    features: dict[str, list[float]],
) -> None:
    PROCESSED.mkdir(parents=True, exist_ok=True)
    path = PROCESSED / "cycle-features.csv"
    feature_names = sorted(features)
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["cycle_id", *PROFILE_NAMES, *feature_names])
        for idx, row in enumerate(profile):
            writer.writerow([idx + 1, *row, *[f"{features[name][idx]:.12g}" for name in feature_names]])


def main() -> None:
    if not ZIP_PATH.exists():
        raise SystemExit(f"missing raw source package: {ZIP_PATH}")

    PROCESSED.mkdir(parents=True, exist_ok=True)
    EVIDENCE.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(ZIP_PATH) as zf:
        profile = read_profile(zf)
        validate_profile_contract(profile)
        persisted_features, analysis_features, sensor_audit = extract_features(zf, len(profile))

    write_cycle_features(profile, persisted_features)

    stable_indices = [i for i, row in enumerate(profile) if row[4] == 0]
    unstable_indices = [i for i, row in enumerate(profile) if row[4] == 1]
    stable_combo_counts = Counter(profile[i][:4] for i in stable_indices)
    expected_combo_count = math.prod(len(spec["levels"]) for spec in COMPONENTS.values())
    discovery, verification = split_stable(profile)
    healthy_stable = [i for i, row in enumerate(profile) if row == (100, 100, 0, 130, 0)]

    audit = {
        "source_zip": str(ZIP_PATH.relative_to(ROOT)),
        "profile_rows": len(profile),
        "stable_cycles": len(stable_indices),
        "unstable_cycles": len(unstable_indices),
        "stable_unique_component_combinations": len(stable_combo_counts),
        "expected_full_factorial_combinations": expected_combo_count,
        "stable_component_design_full_factorial": len(stable_combo_counts) == expected_combo_count,
        "stable_replicates_per_combination_min": min(stable_combo_counts.values()),
        "stable_replicates_per_combination_max": max(stable_combo_counts.values()),
        "fully_healthy_stable_reference_cycles": len(healthy_stable),
        "discovery_cycles": len(discovery),
        "verification_cycles": len(verification),
        "analysis_feature_count": len(analysis_features),
        "persisted_cycle_feature_count": len(persisted_features),
        "time_windows_per_cycle": WINDOWS,
        "sensor_files": sensor_audit,
        "profile_value_counts": {
            "cooler_pct": dict(sorted(Counter(row[0] for row in profile).items())),
            "valve_pct": dict(sorted(Counter(row[1] for row in profile).items())),
            "pump_leakage": dict(sorted(Counter(row[2] for row in profile).items())),
            "accumulator_bar": dict(sorted(Counter(row[3] for row in profile).items())),
            "stable_flag": dict(sorted(Counter(row[4] for row in profile).items())),
        },
    }
    (EVIDENCE / "data-quality-audit.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")

    with (EVIDENCE / "healthy-reference-summary.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["feature", "n", "mean", "sample_sd", "min", "max"])
        for feature in sorted(persisted_features):
            vals = [persisted_features[feature][i] for i in healthy_stable]
            writer.writerow([
                feature, len(vals),
                f"{statistics.fmean(vals):.12g}" if vals else "",
                f"{sample_sd(vals):.12g}" if vals else "",
                f"{min(vals):.12g}" if vals else "",
                f"{max(vals):.12g}" if vals else "",
            ])

    ranking_rows: list[dict[str, object]] = []
    summary_by_component: dict[str, list[dict[str, object]]] = {}

    # Compute effects for every feature/component once per split.
    disc_match: dict[str, dict[str, dict[str, object]]] = defaultdict(dict)
    ver_match: dict[str, dict[str, dict[str, object]]] = defaultdict(dict)
    disc_group: dict[str, dict[str, dict[str, object]]] = defaultdict(dict)
    ver_group: dict[str, dict[str, dict[str, object]]] = defaultdict(dict)

    for component in COMPONENTS:
        for feature, values in analysis_features.items():
            disc_match[component][feature] = matched_effect(values, profile, discovery, component)
            ver_match[component][feature] = matched_effect(values, profile, verification, component)
            disc_group[component][feature] = grouped_effect(values, profile, discovery, component)
            ver_group[component][feature] = grouped_effect(values, profile, verification, component)

    for component in COMPONENTS:
        ranked: list[tuple[str, float, float]] = []
        for feature in analysis_features:
            target_abs = abs(float(disc_match[component][feature]["effect_sd"]))
            max_other = max(
                abs(float(disc_match[other][feature]["effect_sd"]))
                for other in COMPONENTS
                if other != component
            )
            specificity_ratio = target_abs / max(max_other, 1e-12)
            ranked.append((feature, target_abs, specificity_ratio))

        ranked.sort(
            key=lambda item: (
                item[1] * float(disc_match[component][item[0]]["direction_consistency"]),
                item[2],
                float(disc_group[component][item[0]]["eta2"]),
            ),
            reverse=True,
        )

        top_entries: list[dict[str, object]] = []
        for rank, (feature, _, specificity_ratio) in enumerate(ranked[:TOP_PER_COMPONENT], start=1):
            dm = disc_match[component][feature]
            vm = ver_match[component][feature]
            dg = disc_group[component][feature]
            vg = ver_group[component][feature]
            same_direction = dm["direction"] == vm["direction"] and dm["direction"] != "flat"
            discovery_pass = (
                abs(float(dm["effect_sd"])) >= DISCOVERY_MATCHED_EFFECT_MIN
                and float(dm["direction_consistency"]) >= DISCOVERY_CONSISTENCY_MIN
            )
            verification_pass = (
                abs(float(vm["effect_sd"])) >= VERIFY_MATCHED_EFFECT_MIN
                and float(vm["direction_consistency"]) >= VERIFY_CONSISTENCY_MIN
                and same_direction
            )
            verified = discovery_pass and verification_pass

            entry = {
                "component": component,
                "rank": rank,
                "feature": feature,
                "discovery_matched_effect_sd": float(dm["effect_sd"]),
                "discovery_direction_consistency": float(dm["direction_consistency"]),
                "discovery_direction": dm["direction"],
                "discovery_eta2": float(dg["eta2"]),
                "discovery_monotonic": bool(dg["monotonic"]),
                "specificity_ratio": specificity_ratio,
                "verification_matched_effect_sd": float(vm["effect_sd"]),
                "verification_direction_consistency": float(vm["direction_consistency"]),
                "verification_direction": vm["direction"],
                "verification_eta2": float(vg["eta2"]),
                "verification_monotonic": bool(vg["monotonic"]),
                "same_direction": same_direction,
                "discovery_threshold_pass": discovery_pass,
                "verification_threshold_pass": verification_pass,
                "verified": verified,
                "matched_strata_discovery": int(dm["matched_strata"]),
                "matched_strata_verification": int(vm["matched_strata"]),
                "discovery_group_means": dg["group_means"],
                "verification_group_means": vg["group_means"],
            }
            ranking_rows.append(entry)
            top_entries.append(entry)
        summary_by_component[component] = top_entries

    fields = [
        "component", "rank", "feature",
        "discovery_matched_effect_sd", "discovery_direction_consistency", "discovery_direction",
        "discovery_eta2", "discovery_monotonic", "specificity_ratio",
        "verification_matched_effect_sd", "verification_direction_consistency", "verification_direction",
        "verification_eta2", "verification_monotonic", "same_direction",
        "discovery_threshold_pass", "verification_threshold_pass", "verified",
        "matched_strata_discovery", "matched_strata_verification",
    ]
    with (EVIDENCE / "component-signal-ranking.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for row in ranking_rows:
            writer.writerow({field: row[field] for field in fields})

    with (EVIDENCE / "verification-summary.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for component in COMPONENTS:
            for row in summary_by_component[component][:5]:
                writer.writerow({field: row[field] for field in fields})

    summary = {
        "research_question": (
            "Which cycle-level sensor features most reliably separate stable healthy hydraulic component states "
            "from degraded cooler, valve, pump, and accumulator states, and can those verified signals support "
            "an interpretable troubleshooting sequence without a black-box model?"
        ),
        "analysis_scope": {
            "public_dataset": "UCI Condition monitoring of hydraulic systems",
            "stable_cycles_only_for_component_effects": True,
            "discovery_verification_split": "alternating repeated cycles within each stable 4-component factorial cell",
            "model_type": "matched factorial signal screening; no machine-learning classifier",
            "persisted_features": ["cycle mean", "cycle sample standard deviation", "cycle range", "end-minus-start delta"],
            "analysis_only_features": f"{WINDOWS} equal-duration window means per sensor",
        },
        "quality_audit": audit,
        "verification_criteria": {
            "discovery_abs_matched_effect_sd_min": DISCOVERY_MATCHED_EFFECT_MIN,
            "verification_abs_matched_effect_sd_min": VERIFY_MATCHED_EFFECT_MIN,
            "discovery_direction_consistency_min": DISCOVERY_CONSISTENCY_MIN,
            "verification_direction_consistency_min": VERIFY_CONSISTENCY_MIN,
            "direction_must_match": True,
            "note": "Engineering repeatability screen; not a claim of statistical significance or field diagnostic performance.",
        },
        "top_signals": summary_by_component,
        "spc_status": {
            "formal_control_limits_established": False,
            "reason": (
                "Only 10 cycles are simultaneously stable and fully healthy across all four components. "
                "They are kept as a descriptive reference window; no in-control production baseline is claimed."
            ),
        },
        "claim_boundaries": [
            "Observed findings describe this public experimental test rig only.",
            "The source experiment deliberately varied component condition labels; matched holdout repeatability strengthens signal attribution but does not prove field causation on other equipment.",
            "No maintenance intervention, downtime reduction, savings, safety improvement, or sustainment outcome was observed.",
            "Source-flagged non-static cycles are excluded from component-effect estimation.",
            "The second pass added matched comparisons and time-localized windows because whole-cycle summaries can average away dynamic switching behavior; thresholds were not loosened after the first pass.",
        ],
    }
    summary_path = EVIDENCE / "analysis-summary.json"
    summary_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    RECEIPTS.mkdir(parents=True, exist_ok=True)
    receipt_outputs = [
        EVIDENCE / "data-quality-audit.json",
        EVIDENCE / "healthy-reference-summary.csv",
        EVIDENCE / "component-signal-ranking.csv",
        EVIDENCE / "verification-summary.csv",
        summary_path,
    ]
    receipt = {
        "schema": "ci-research.primary-analysis-receipt/v1",
        "authority": "none",
        "effectReplay": False,
        "claimBoundary": "Receipt binds deterministic analysis code, public source identity, and derived output hashes only; it does not establish field diagnostic accuracy, operational benefit, or sustainment.",
        "completedAtUtc": datetime.now(timezone.utc).isoformat(),
        "analysisScript": str(Path(__file__).relative_to(ROOT)),
        "analysisScriptSha256": sha256_file(Path(__file__)),
        "sourceZip": str(ZIP_PATH.relative_to(ROOT)),
        "sourceZipSha256": sha256_file(ZIP_PATH),
        "pythonVersion": sys.version,
        "outputs": {
            str(output.relative_to(ROOT)): sha256_file(output)
            for output in receipt_outputs
        },
    }
    (RECEIPTS / "primary-analysis-receipt.json").write_text(
        json.dumps(receipt, indent=2) + "\n", encoding="utf-8"
    )

    print(json.dumps({
        "profile_rows": len(profile),
        "stable_cycles": len(stable_indices),
        "stable_combinations": len(stable_combo_counts),
        "full_factorial": len(stable_combo_counts) == expected_combo_count,
        "stable_replicates_min": min(stable_combo_counts.values()),
        "stable_replicates_max": max(stable_combo_counts.values()),
        "healthy_stable_reference_cycles": len(healthy_stable),
        "discovery_cycles": len(discovery),
        "verification_cycles": len(verification),
        "analysis_feature_count": len(analysis_features),
        "top_features": {
            component: [
                {
                    "feature": row["feature"],
                    "discovery_effect_sd": round(float(row["discovery_matched_effect_sd"]), 3),
                    "verification_effect_sd": round(float(row["verification_matched_effect_sd"]), 3),
                    "consistency": round(float(row["verification_direction_consistency"]), 3),
                    "specificity_ratio": round(float(row["specificity_ratio"]), 2),
                    "direction": row["verification_direction"],
                    "verified": bool(row["verified"]),
                }
                for row in rows[:5]
            ]
            for component, rows in summary_by_component.items()
        },
    }, indent=2))


if __name__ == "__main__":
    main()

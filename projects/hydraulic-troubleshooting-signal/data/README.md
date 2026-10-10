# Data Provenance

## Policy

Every data element in this project is labeled as one of:

- **PUBLIC** — directly obtained from a public source.
- **DERIVED_PUBLIC** — calculated only from public information.
- **SYNTHETIC** — generated for experimentation and never represented as operational fact.
- **ASSUMPTION** — an explicit modeling or analysis choice.

No confidential current/former-employer data, screenshots, drawings, process parameters, schemas, names, URLs, or reconstructed proprietary artifacts are permitted.

## Source dataset

| Path / table | Class | Generation/source | Purpose | Known limitations |
|---|---|---|---|---|
| `data/raw/hydraulic-systems.zip` | PUBLIC | UCI Machine Learning Repository dataset 447 | Raw 60-second hydraulic test-rig cycles and component-condition labels | Experimental test rig, not a production asset; raw file is Git-ignored |
| `data/processed/cycle-features.csv` | DERIVED_PUBLIC | `analysis/analyze.py` | Cycle mean, SD, range, and end-minus-start delta for each sensor | Aggregation can hide within-cycle dynamics; 12-window features are recomputed in memory |
| `evidence/data-quality-audit.json` | DERIVED_PUBLIC | deterministic audit | Source/profile/sensor alignment and stable-factorial coverage | Validates structure, not sensor calibration |
| `evidence/component-signal-ranking.csv` | DERIVED_PUBLIC | matched factorial analysis | Discovery/verification signal ranking | Test-rig-specific; not field diagnostic accuracy |
| `evidence/verification-summary.csv` | DERIVED_PUBLIC | holdout verification | Top-five signals per component on untouched repeated cycles | Holdout is within the same source experiment |

## Acquisition

Source page: https://archive.ics.uci.edu/dataset/447/condition+monitoring+of+hydraulic+systems

Direct public archive used:

`https://archive.ics.uci.edu/static/public/447/condition%2Bmonitoring%2Bof%2Bhydraulic%2Bsystems.zip`

Observed SHA-256:

`24128aad2ee45eea7e6b63ebbd9992cdf25d0483a2cebefbfc13bc69079af1f2`

The raw package is excluded from Git by the repository's existing `**/data/raw/` rule.

## Measurement-validity rules

The source provides a cycle-wise `stable_flag`:
- `0`: conditions were stable;
- `1`: static conditions might not have been reached.

Component-effect estimates use only `stable_flag == 0` cycles. Non-static cycles are retained in the raw/derived data but are not silently mixed into stable-state diagnosis.

The source does not provide an independent calibration/MSA study sufficient to establish measurement-system adequacy for a production control chart. Therefore this project does **not** claim a formal SPC baseline.

## Derived feature assumptions

**ASSUMPTION A-001:** Each 60-second cycle is divided into 12 equal-duration windows (5 seconds each). Window means are used only to localize dynamic signatures that whole-cycle averages can obscure.

**ASSUMPTION A-002:** Repeated stable cycles within each full component-state combination are alternated into discovery and verification sets. This preserves every condition stratum in both sets.

No random seed is required; the split is deterministic.

## Synthetic data

No synthetic observations are used in the completed analysis. Future simulation, if added, must be separately labeled.

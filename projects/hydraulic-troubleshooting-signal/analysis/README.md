# Analysis

This project keeps two complementary deterministic evidence paths.

## Acquisition

`analysis/acquire.py` downloads UCI dataset 447, verifies the expected source files, records the public archive SHA-256, and extracts a working copy. Raw public data remain under `data/raw/` and are Git-ignored.

```bash
python3 analysis/acquire.py
```

No Python third-party packages are required.

## Primary study — matched factorial signal discovery

`analysis/analyze.py` is the canonical component-signal study. It audits all 2,205 source cycles and sensor widths; gates source-flagged non-static cycles out of stable-state effect estimation; preserves the stable four-component factorial structure; alternates repeated cycles within every stable factorial cell into discovery and verification sets; extracts interpretable whole-cycle summaries plus twelve five-second window means; and compares healthy with severe states while holding the other three component conditions fixed. It checks repeatability, direction consistency, and cross-component specificity. No black-box classifier is fit.

```bash
python3 analysis/analyze.py
```

Primary evidence: `evidence/data-quality-audit.json`, `evidence/component-signal-ranking.csv`, `evidence/verification-summary.csv`, and `evidence/analysis-summary.json`.

## Secondary robustness study — pump leakage on unseen nuisance groups

`analysis/analyze.ts` asks a narrower question: can a small physical-sensor summary separate pump-leakage labels when complete cooler/valve/accumulator condition groups are withheld from feature selection? It screens physical channels only; virtual CE/CP/SE channels are excluded. Every fifth sorted nuisance-condition group is held out in full. A healthy-development quantile supplies a proposed limit, and the frozen rule is evaluated on those unseen groups.

```bash
node --import tsx analysis/analyze.ts
```

Outputs are namespaced `pump-leak-*` so the robustness check cannot overwrite the primary factorial study.

## Measurement and claim boundary

Both paths use public experimental test-rig data. Structural integrity, row alignment, finite values, expected profile levels, factorial coverage, sampling counts, and holdout separation are checked, but the public package does not establish production-field MSA adequacy. Neither analysis establishes time-to-failure, field diagnostic accuracy, downtime reduction, savings, safety improvement, or sustainment.

## Closure verification

The public analysis seams are frozen in `contracts/signal-discovery.v1.json`. Python seam tests cover the primary factorial input/partition/matched-effect boundaries; Node tests bind the current analysis code to receipts/outputs and preserve the non-authority/claim boundary. Run `npm run study:hydraulic:verify` from the repository root.

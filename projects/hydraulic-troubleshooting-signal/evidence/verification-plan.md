# Verification Plan

## Material claims under test

1. The source package is structurally consistent with the published dataset description.
2. Cooler and valve degradation have repeatable component-specific dynamic signatures in the stable test-rig cycles.
3. The broad pump screen is cross-sensitive, but a separately selected physical-sensor pump rule discriminates source-labeled pump leakage across complete held-out cooler/valve/accumulator condition groups inside the same experiment.
4. Accumulator signals remain too cross-sensitive for a clean single-signal isolation claim.
5. A staged troubleshooting workflow is a feasible proposal; it is **not yet a verified operational improvement**.

## Evidence hierarchy

### Level A — source / measurement integrity
- public archive identity;
- profile/sensor row reconciliation;
- expected samples per cycle;
- stable/non-static labeling;
- physical/virtual sensor definitions.

### Level B — repeated-cycle holdout
The primary factorial study splits repeated cycles inside every stable four-component condition cell.

Use: repeatability and matched component-effect assessment.

Limitation: the same condition cells occur in discovery and verification.

### Level C — nuisance-condition holdout
The secondary pump study withholds complete cooler × valve × accumulator condition groups from feature/threshold selection.

Use: stronger within-experiment test of nuisance-condition robustness.

Observed frozen-rule holdout:
- healthy: 0 / 90 flagged;
- weak leak: 90 / 90 flagged;
- severe leak: 90 / 90 flagged.

Limitation: the development and held-out groups still come from the same source experiment.

### Level D — external validation

**Not yet performed.**

Requires a genuinely independent dataset or independently specified experiment.

No Level B/C result may be described as field diagnostic accuracy.

## Current acceptance criteria

### Source/data validity
- 2,205 profile rows;
- 2,205 rows per sensor;
- source-documented samples per cycle for every sensor;
- no silent row-width exclusions;
- stable/non-static populations explicitly counted.

### Primary factorial signal repeatability

Discovery:
- absolute matched healthy-to-severe effect ≥ 1.00 within-cell SD;
- direction consistency ≥ 90%.

Verification:
- absolute matched effect ≥ 0.80 within-cell SD;
- direction consistency ≥ 85%;
- direction matches discovery.

These are engineering repeatability gates, not p-values or field diagnostic thresholds.

### Next operational experiment

Primary Y:
- median diagnostic candidate component families remaining.

Hard gate:
- forced diagnosis when evidence is inconclusive = 0.

Before execution, also freeze:
- false-isolation acceptance rule;
- independent validation population;
- measurement-system gate;
- safety/human review.

## Independent evidence currently available

- raw public source archive and SHA-256;
- `evidence/data-quality-audit.json`;
- `evidence/component-signal-ranking.csv`;
- `evidence/verification-summary.csv`;
- `evidence/analysis-summary.json`;
- `evidence/pump-leak-measurement-audit.json`;
- `evidence/pump-leak-rule-summary.json`;
- `evidence/receipts/pump-leak-rule-receipt.json`;
- deterministic rerun of the registered analyses.

## Failure conditions

A current signal claim fails if:
- source/profile alignment breaks;
- holdout construction leaks outcome information into feature/threshold selection;
- verification direction/effect fails its frozen gate;
- a broad cross-sensitive signal is represented as clean isolation;
- a source-flagged non-static cycle is silently treated as stable evidence;
- within-experiment validation is labeled as external/field validation.

The future workflow experiment fails if:
- it forces a diagnosis when evidence is inconclusive;
- false isolation exceeds the predeclared gate;
- any safety, legal, quality, human, ecological, or data constraint fails;
- candidate-count improvement is claimed without an independently measured baseline/counterfactual.

## Operational-improvement verification — NOT STARTED

Before claiming reduced troubleshooting time or downtime:
- use genuinely independent evidence;
- establish a baseline diagnostic workflow and timing;
- predeclare false-isolation and safety gates;
- freeze the staged decision logic;
- observe implementation;
- monitor a control horizon.

No current artifact satisfies those requirements.

## Reproduction

```bash
python3 projects/hydraulic-troubleshooting-signal/analysis/analyze.py
node --import tsx projects/hydraulic-troubleshooting-signal/analysis/analyze.ts
npx tsx projects/hydraulic-troubleshooting-signal/analysis/build_state.ts
npm run project:check -- --project projects/hydraulic-troubleshooting-signal
npm run verify
```

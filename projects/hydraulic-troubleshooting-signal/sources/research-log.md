# Public Problem Research Log

Project: **Hydraulic Troubleshooting: Interpretable Signal Discovery**

## Research objective

Build a clean-room troubleshooting / causal-signal case study using public experimental evidence, with no employer data and no fabricated maintenance outcome.

## 2026-10-03 — Source selection

Selected UCI dataset 447, *Condition monitoring of hydraulic systems*.

Source-stated facts:
- experimental hydraulic test rig;
- 2,205 repeated 60-second load cycles;
- raw pressure, power, flow, temperature, vibration, and virtual efficiency signals;
- cooler, valve, pump leakage, and accumulator condition varied across severity grades;
- cycle-wise stable flag identifying conditions where static conditions might not yet have been reached;
- CC BY 4.0 license.

Why selected:
- directly supports unplanned-downtime/troubleshooting reasoning;
- no physical experiment is required;
- component condition is deliberately varied, enabling cleaner competing-hypothesis analysis than a generic failure label;
- cyclic raw signals allow SPC/statistical thinking without forcing AI.

Source ID: SRC-001.

## 2026-10-03 — Measurement validity

Downloaded the public archive and recorded:

`SHA-256 24128aad2ee45eea7e6b63ebbd9992cdf25d0483a2cebefbfc13bc69079af1f2`

Deterministic audit found:
- 2,205 profile rows;
- all 17 sensor files contain 2,205 cycles;
- every sensor row matches the source-documented sampling width;
- 1,449 cycles are source-flagged stable;
- 756 are source-flagged non-static;
- stable cycles span all 144 possible four-component condition combinations;
- each stable combination has 10–19 repeated cycles.

Derived evidence: `evidence/data-quality-audit.json`.

## 2026-10-03 — Analyze cycle A: whole-cycle summaries

Whole-cycle mean/SD/range/delta features were screened first.

Outcome:
- cooler degradation was strongly visible;
- valve, pump, and accumulator did not all satisfy the frozen first-pass screen;
- no failed component was relabeled as success.

This suggested that averaging a cyclic response over 60 seconds was hiding time-localized behavior.

Evidence: `evidence/method-iteration.md`.

## 2026-10-03 — Analyze cycle B: matched/time-localized signals

Added:
- matched healthy-vs-severe comparisons within fixed states of the other three components;
- twelve equal five-second window means;
- deterministic discovery/verification split inside every stable factorial cell.

Observed:
- cooler: highly repeatable, highly specific thermal/pressure signatures;
- valve: highly repeatable and specific early-cycle pressure/flow signatures;
- pump: repeatable signals, but limited specificity in the broad matched-feature screen;
- accumulator: repeatable early pressure signal, but substantial cross-sensitivity.

This supported a staged troubleshooting hypothesis rather than a claim that four components were cleanly isolated.

## 2026-10-03 — Analyze cycle C: pump nuisance-condition holdout

A narrower secondary analysis was added to test the pump ambiguity.

Design:
- physical sensors only;
- source-flagged stable cycles only;
- nuisance group = cooler × valve × accumulator;
- 39 nuisance groups used for development;
- 9 complete nuisance groups held out from feature/threshold selection.

Development population: 1,179 cycles.

Held-out population: 270 cycles:
- 90 healthy pump;
- 90 weak leak;
- 90 severe leak.

The development-selected `FS1__end_shift` rule produced on the held-out nuisance groups:
- 0 / 90 healthy flagged;
- 90 / 90 weak leak flagged;
- 90 / 90 severe leak flagged.

Interpretation:
- this is stronger evidence for **within-experiment pump-leak discrimination across nuisance conditions**;
- it does not erase the earlier broad-screen cross-sensitivity finding, because the methods answer different questions;
- it is not external validation, production causality, field accuracy, or observed downtime improvement.

Evidence:
- `evidence/pump-leak-measurement-audit.json`;
- `evidence/pump-leak-rule-summary.json`;
- `evidence/receipts/pump-leak-rule-receipt.json`.

## 2026-10-03 — Six Sigma methodology alignment

The hydraulic project was compared against the active P2P DMAIC study.

Adopted:
- explicit Measure snapshot;
- frozen next-phase primary operational Y;
- zero forced-diagnosis hard gate;
- separate repeatability, nuisance-condition holdout, and external-validation semantics;
- Analyze questions/tollgate that must close before Improve;
- preservation of failed/ambiguous earlier analyses rather than rewriting history.

Frozen next-phase primary Y:

**Median diagnostic candidate component families remaining after the staged screen.**

Operational baseline: **not established**.

Improve remains closed until a genuinely independent validation protocol and false-isolation acceptance rule are frozen.

## Unknowns / limitations

- No production-field false-positive/false-negative rate is established.
- No independent production MSA/calibration evidence is available.
- Only 10 cycles are simultaneously stable and fully healthy across all four components.
- No maintenance intervention was performed.
- No operational candidate-count/troubleshooting-time baseline exists.
- No downtime, labor, quality, safety, ecological, or financial benefit was observed.
- Generalization beyond this public experiment is unverified.

## Current next question

Can a frozen settled-state-gated hierarchical rule reduce diagnostic candidate count on genuinely independent evidence while preserving zero forced diagnoses and an acceptable predeclared false-isolation rate?

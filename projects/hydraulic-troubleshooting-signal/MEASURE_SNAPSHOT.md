# Measure Snapshot — 2026-10-03

**Status:** Public-dataset Measure population and next-phase operational Y are frozen. No operational improvement baseline has been established.

## Exact research question

Which cycle-level sensor features most reliably separate stable healthy hydraulic component states from degraded cooler, valve, pump, and accumulator states, and can those verified signals support an interpretable troubleshooting sequence without a black-box model?

## Frozen next-phase primary Y

**Primary Y:** median number of candidate component families remaining after the staged diagnostic screen.

Unit: component families / validation case.

This is the operational Y for the **next validation experiment**. It has no measured baseline yet.

### Hard quality / human gate

**Forced diagnoses when evidence is inconclusive = 0.**

A workflow that narrows candidates by forcing an unsupported diagnosis fails regardless of speed or candidate-count improvement.

Secondary measures:
- troubleshooting decision time;
- number of signals/checks reviewed before escalation;
- false-isolation rate;
- inconclusive/escalation rate;
- unnecessary diagnostic intervention/test cycles.

## Public source population

UCI Machine Learning Repository dataset 447, *Condition monitoring of hydraulic systems*.

Observed and reconciled:
- total cycles: **2,205**;
- source-flagged stable cycles: **1,449**;
- source-flagged non-static cycles: **756**;
- sensor files: **17**;
- stable component-state combinations: **144 / 144**;
- stable repetitions per combination: **10–19**;
- fully healthy + stable cycles: **10**;
- sensor rows with unexpected sample width: **0**.

Raw archive SHA-256:

`24128aad2ee45eea7e6b63ebbd9992cdf25d0483a2cebefbfc13bc69079af1f2`

## Measurement-validity boundary

The source-provided `stable_flag` is treated as a process-state gate:
- `0`: stable/static condition reported by the source;
- `1`: static conditions might not yet have been reached.

Stable-state component comparisons use only `stable_flag == 0`.

This is **not** a complete production MSA. The source data support file-integrity, row-alignment, finite-value, sampling-width, and condition-label checks. They do not establish deployment-specific sensor calibration, repeatability/reproducibility, drift control, or field measurement-system adequacy.

Therefore:
- the 10 fully healthy stable cycles are descriptive reference evidence;
- no formal production SPC control limits are claimed.

## Frozen analysis populations

### Primary factorial signal study

Purpose: repeatability and component-effect assessment while holding nuisance component states fixed.

Stable cycles are split **inside every full four-component condition cell**:
- discovery: **725 cycles**;
- verification: **724 cycles**.

Both halves contain the same condition cells, using different repeated cycles.

Interpretation: **within-experiment replicate holdout**. This tests repeatability, not external generalization.

### Secondary pump-leak nuisance-condition holdout

Purpose: test whether a pump-leak screening signal survives cooler, valve, and accumulator condition changes not used for feature/threshold selection.

Population:
- stable cycles only;
- nuisance group = cooler × valve × accumulator condition;
- 48 total nuisance groups;
- 39 development groups / **1,179 cycles**;
- 9 held-out nuisance groups / **270 cycles**;
- held-out pump states: 90 healthy, 90 weak leak, 90 severe leak.

The feature and threshold were selected using development groups only.

Observed held-out result for the selected `FS1__end_shift` rule:
- healthy flagged: **0 / 90**;
- weak leak flagged: **90 / 90**;
- severe leak flagged: **90 / 90**.

This is stronger than a random row holdout because complete nuisance-condition groups are withheld. It is still **within the same public experiment** and is not field diagnostic accuracy or external validation.

## What Measure establishes

Established:
- source identity and provenance;
- complete row/sampling reconciliation;
- stable/non-static population;
- full factorial coverage;
- frozen discovery/verification logic;
- next-phase primary operational Y and hard gate;
- within-experiment signal-validation populations.

Not established:
- baseline troubleshooting time;
- baseline candidate-count performance of an existing field workflow;
- field failure prevalence;
- production sensor MSA;
- production false-isolation rate;
- field-generalization performance;
- implemented countermeasure effect;
- sustainment.

## Gate to continue Analyze

The next Analyze cycle must answer:
1. Which signals survive nuisance-condition changes?
2. Which signals add information beyond another already-selected signal?
3. Under what conditions does the diagnostic logic produce false isolation?
4. Can the frozen sequence reduce candidate families without forcing a diagnosis?
5. Which conclusions survive a genuinely independent dataset or independently specified experiment?

Improve remains closed until the decision logic and independent-validation protocol are frozen.

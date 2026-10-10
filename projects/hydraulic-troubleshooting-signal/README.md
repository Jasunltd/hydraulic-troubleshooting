# Hydraulic Troubleshooting: Interpretable Signal Discovery

**Independent engineering case study**  
**Manufacturing CI lane:** 13 — Troubleshooting and causal-signal discovery across IT + OT  
**Public domain reference:** UCI / ZeMA hydraulic test rig

## Research question

> Which cycle-level sensor features most reliably separate stable healthy hydraulic component states from degraded cooler, valve, pump, and accumulator states, and can those verified signals support an interpretable troubleshooting sequence without a black-box model?

## Current status

**Bounded public-data signal-discovery study closed. Define, Measure, and Analyze are complete for this scope; external validation, Improve, and Control remain unopened/proposal-only.**

Completed evidence:
- acquired the UCI source package and recorded its SHA-256;
- audited all 2,205 profile rows and 17 sensor files;
- verified 1,449 source-flagged stable cycles and 756 non-static cycles;
- verified all 144 cooler × valve × pump × accumulator stable condition combinations, with 10–19 repetitions each;
- froze the next-phase primary operational Y: median diagnostic candidate component families remaining;
- froze the hard quality/human gate: zero forced diagnosis when evidence is inconclusive;
- completed a matched replicate-holdout study for all four component families;
- verified strong component-specific cooler and valve signatures;
- completed a secondary pump study that withheld complete cooler/valve/accumulator condition groups from feature/threshold selection;
- on that within-experiment pump holdout, the selected `FS1__end_shift` rule flagged 0/90 healthy, 90/90 weak-leak, and 90/90 severe-leak cycles.

Not completed:
- no genuinely external hydraulic validation dataset/experiment has been run;
- no field troubleshooting workflow has been implemented;
- no operational candidate-count or troubleshooting-time baseline exists;
- no production false-isolation rate has been observed;
- no production MSA/SPC baseline has been established;
- no downtime, maintenance-labor, quality, safety, ecological, or financial benefit has been measured;
- no sustainment/control outcome exists.

## Current engineering finding

The evidence supports a **staged deterministic troubleshooting concept**:

1. require a settled/static-state gate;
2. use verified cooler and valve signatures for hypothesis narrowing;
3. treat the pump `FS1__end_shift` rule as a promising but still within-experiment screening branch;
4. retain multi-signal/physical confirmation for accumulator or conflicting evidence;
5. preserve an explicit inconclusive/escalate state;
6. prohibit automatic equipment action.

The pump result is stronger than the earlier broad cross-sensitivity screen, but it does not establish field diagnostic accuracy or production causality.

## Key methodology artifacts

- `MEASURE_SNAPSHOT.md` — frozen Measure population, primary Y, hard gate, and validation partitions.
- `analysis/ANALYSIS_PLAN.md` — Analyze questions, evidence hierarchy, and tollgate to Improve.
- `state.json` — canonical typed evidence/claims/hypotheses/records.
- `evidence/pump-leak-rule-summary.json` — secondary nuisance-condition holdout.
- `ci/dmaic.md` — explicit DMAIC phase boundaries.

## Reproduce

From the repository root:

```bash
python3 projects/hydraulic-troubleshooting-signal/analysis/analyze.py
node --import tsx projects/hydraulic-troubleshooting-signal/analysis/analyze.ts
npm run study:hydraulic:verify
```

The primary analysis uses the Python standard library. The raw UCI ZIP is intentionally ignored by Git; derived evidence and exact acquisition identity are retained.

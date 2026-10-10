# DMAIC

## Define — COMPLETE FOR CURRENT RESEARCH SCOPE

### Problem

Troubleshooting across fragmented equipment signals can extend downtime, repeat fault-finding work, and increase cognitive load. This project tests whether public experimental hydraulic data contain **interpretable, repeatable evidence** that can narrow competing component hypotheses without treating prediction as proven root cause.

### Research question

Which cycle-level sensor features most reliably separate stable healthy hydraulic component states from degraded cooler, valve, pump, and accumulator states, and can those verified signals support an interpretable troubleshooting sequence without a black-box model?

### Scope

In:
- UCI/ZeMA public hydraulic test-rig data;
- four deliberately varied component conditions;
- source-flagged stable cycles for stable-state analysis;
- deterministic statistics, stratification, matched comparisons, and held-out validation.

Out:
- confidential employer information;
- field failure rates or maintenance economics;
- autonomous equipment control;
- realized savings or downtime claims.

## Measure — COMPLETE FOR PUBLIC-DATA RESEARCH POPULATION

Frozen in `../MEASURE_SNAPSHOT.md`:
- source identity and raw archive hash;
- 2,205 total cycles;
- 1,449 stable / 756 non-static cycles;
- all 144 stable component-state combinations;
- 10–19 stable repetitions per combination;
- primary replicate discovery/verification split;
- secondary pump nuisance-condition holdout;
- next-phase primary operational Y;
- hard quality/human gate.

### Primary Y for the next validation phase

**Median diagnostic candidate component families remaining after the staged screen.**

No operational baseline for this Y exists yet. The typed kernel therefore correctly stores the operational baseline as **InsufficientEvidence**.

### Measurement limitation

Only 10 cycles are simultaneously stable and fully healthy across all four components, and deployment-specific sensor MSA is unavailable.

Therefore **formal production SPC control limits are not established**.

## Analyze — COMPLETE FOR BOUNDED PUBLIC-DATA SIGNAL DISCOVERY

### Cycle A: simple whole-cycle statistics

Completed. Cooler was strong; valve, pump, and accumulator did not all meet the frozen first-pass screen.

### Cycle B: matched factorial + time-localized evidence

Completed. Cooler and valve show strong, specific holdout-repeatable signatures. Pump and accumulator show repeatable evidence but broad-screen cross-sensitivity.

### Cycle C: pump nuisance-condition holdout

Completed as supplementary within-experiment evidence.

A physical-sensor rule selected only on 39 development cooler/valve/accumulator groups used `FS1__end_shift`. On 9 completely held-out nuisance groups:
- healthy: 0 / 90 flagged;
- weak pump leak: 90 / 90 flagged;
- severe pump leak: 90 / 90 flagged.

This strengthens the pump-leak screening hypothesis **inside the source experiment**. It does not establish field diagnostic accuracy or production causality.

### Current Analyze conclusion

Supported in this experiment:
- settled/static-state gating;
- cooler-specific signal narrowing;
- valve-specific signal narrowing;
- a pump-leak screening rule robust to held-out nuisance-condition groups.

Still unresolved:
- accumulator isolation;
- interaction behavior under truly independent evidence;
- production sensor/MSA validity;
- field false-isolation performance;
- operational diagnostic-time/candidate-count improvement.

## Improve — CLOSED / PROPOSAL ONLY

Candidate workflow:
1. establish settled/static process state;
2. apply frozen high-specificity branches;
3. preserve multi-signal/physical confirmation where ambiguity remains;
4. preserve an explicit inconclusive/escalate state;
5. prohibit automatic maintenance/control action.

No countermeasure has been implemented on production equipment.

## Control — NOT STARTED / DESIGN ONLY

Future control candidates:
- process-state gate pass rate;
- candidate component count;
- false-isolation rate;
- diagnostic decision time;
- inconclusive/escalation rate;
- sensor-health/MSA status;
- rule-version identity.

No sustainment window exists.

## Tollgate to Improve

Do not enter Improve until:
- the staged diagnostic rule is frozen;
- independent validation protocol is frozen;
- false-isolation acceptance is predeclared;
- measurement-system and safety gates are explicit;
- the current UCI results remain labeled within-experiment evidence.

No realized benefit is claimable before implementation and sustainment.

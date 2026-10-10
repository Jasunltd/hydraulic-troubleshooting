# Analysis Plan

## Research question

Which cycle-level sensor features most reliably separate stable healthy hydraulic component states from degraded cooler, valve, pump, and accumulator states, and can those verified signals support an interpretable troubleshooting sequence without a black-box model?

## DMAIC boundary

This project is **closed at Analyze for the bounded public-data signal-discovery scope**.

Define, public-data Measure, and the three planned Analyze cycles are complete for this scope. The operational improvement baseline is explicitly not established. External validation, Improve, and Control remain unopened/proposal/design only.

See `../MEASURE_SNAPSHOT.md`.

## Frozen next-phase primary Y

**Median diagnostic candidate component families remaining after the staged screen.**

Hard quality/human gate:
- **forced diagnoses when evidence is inconclusive = 0**;
- false isolation must be measured before any improvement claim.

Secondary measures:
- troubleshooting decision time;
- signals/checks reviewed;
- false-isolation rate;
- inconclusive/escalation rate;
- unnecessary diagnostic intervention/test cycles.

## Measure rules

1. Verify the UCI archive identity and provenance.
2. Reconcile profile rows to every sensor file.
3. Verify expected samples per 60-second cycle.
4. Use source-flagged stable cycles for stable-state component analysis.
5. Preserve non-static cycles and count them explicitly.
6. Treat the 10 fully healthy stable cycles as descriptive reference evidence only.
7. Do not create production SPC control limits without deployment-appropriate MSA and a defensible reference process.
8. Freeze every analysis partition before assessing its holdout.

## Analyze cycle A — whole-cycle summaries

Features:
- mean;
- sample SD;
- range;
- end-minus-start delta.

Purpose: test whether simple whole-cycle summaries adequately expose the component-state signals.

Result:
- cooler passed strongly;
- valve, pump, and accumulator did not all satisfy the frozen first-pass evidence screen.

The negative result remains evidence. Thresholds were not relaxed after inspection.

## Analyze cycle B — matched factorial + time localization

Mechanism:
- add twelve equal five-second window means per sensor;
- hold the other three component states fixed;
- compare target healthy vs most-degraded state inside matched strata;
- split repeated cycles within every stable four-component cell into discovery and verification halves.

Primary questions:
- does the target signal repeat?
- does direction repeat across nuisance strata?
- is the signal specific enough to narrow a component hypothesis?
- does time localization recover information that whole-cycle aggregation hid?

Current result:
- cooler: strong, specific, verified signatures;
- valve: strong, time-localized, specific, verified signatures;
- pump: repeatable evidence but weak specificity in the broad matched-feature screen;
- accumulator: repeatable evidence with material cross-sensitivity.

Interpretation: repeatability does not equal root-cause proof.

## Analyze cycle C — pump nuisance-condition holdout

A secondary analysis was added after the broad pump screen remained ambiguous.

Design:
- physical sensors only;
- stable cycles only;
- nuisance condition = cooler × valve × accumulator;
- hold out complete nuisance-condition groups;
- select feature and threshold on development groups only;
- evaluate the frozen rule on held-out groups.

Development:
- 39 nuisance groups;
- 1,179 cycles.

Held-out validation:
- 9 nuisance groups;
- 270 cycles;
- 90 healthy pump, 90 weak leak, 90 severe leak.

Observed selected rule:
- feature: `FS1__end_shift`;
- 0 / 90 healthy held-out cycles flagged;
- 90 / 90 weak-leak held-out cycles flagged;
- 90 / 90 severe-leak held-out cycles flagged.

Interpretation:
- this materially strengthens the **within-experiment pump-leak discrimination** evidence;
- it addresses nuisance-condition generalization more directly than the replicate split;
- it does **not** prove production causality, field measurement-system adequacy, time-to-failure value, or external diagnostic accuracy.

The earlier broad-screen ambiguity is retained because the two analyses answer different questions: broad feature specificity across component effects versus performance of one development-selected pump rule across held-out nuisance-condition groups.

## Competing hypotheses

- H1: cooler degradation produces a repeatable thermal/cooling signature that remains specific after matching.
- H2: valve lag produces a repeatable time-localized pressure/flow signature that remains specific after matching.
- H3a: pump leakage produces repeatable signals, but broad hydraulic features can be cross-sensitive.
- H3b: a small pump-specific physical-sensor rule can discriminate pump leakage across unseen cooler/valve/accumulator combinations inside the source experiment.
- H4: accumulator pressure reduction produces repeatable signals but still requires ambiguity resolution.
- H5: non-static process state must be gated before stable-state interpretation.
- H6: a frozen hierarchical rule can reduce candidate count without forcing false isolation.

## Analyze questions before Improve opens

1. **Nuisance robustness:** Which candidate rules survive unseen nuisance-condition combinations?
2. **Incremental information:** Does each added signal reduce ambiguity beyond the signals already used?
3. **False isolation:** On what condition combinations does the rule point to the wrong component?
4. **Interaction sensitivity:** Which component interactions change rule behavior?
5. **State validity:** How should a future deployment independently determine that the process is settled?
6. **External validity:** What survives a semantically compatible independent dataset or independently specified experiment?
7. **Human use:** Can an engineer inspect why a branch fired and choose inconclusive/escalate without pressure to force an answer?

## Feasible alternatives

1. Single-sensor thresholds for every component.
2. Settled-state gate + staged deterministic signature matrix.
3. Deterministic signatures plus a later statistical/ML comparator.
4. Black-box classifier as the primary diagnostic mechanism.
5. Formal SPC control limits from the small fully healthy reference.

Current evidence supports continuing with option 2 as the **proposal to validate**, with option 3 retained as a later comparator. Options 1 and 5 do not satisfy current evidence/measurement gates. Option 4 is premature.

## Gate to Improve

Improve does not open until:
- staged decision logic is frozen;
- independent-validation population/protocol is frozen;
- false-isolation metric and acceptance rule are frozen;
- measurement-system gate is explicit;
- safety/human/data constraints are executable;
- no result from the current experiment is relabeled as field performance.

## Planned next experiment

Apply the frozen staged decision sequence to genuinely independent evidence:
- a semantically compatible public hydraulic dataset, if available; or
- an independently specified controlled simulation/experiment.

Primary Y:
- median candidate component families remaining.

Hard gates:
- zero forced diagnosis when evidence is inconclusive;
- false isolation explicitly measured and acceptable under the predeclared rule;
- no automatic equipment action;
- no safety-interlock bypass;
- no employer-confidential evidence;
- no field benefit claim from laboratory data.

## Sustainment

Not started.

A real Control phase requires an implemented workflow, owner, reaction plan, sensor-health checks, and longitudinal observation.

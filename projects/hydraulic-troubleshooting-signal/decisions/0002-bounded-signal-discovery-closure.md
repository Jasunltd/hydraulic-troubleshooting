# 0002 — Close the bounded hydraulic signal-discovery study

**Status:** Accepted
**Date:** 2026-10-05

## Context

The public UCI/ZeMA hydraulic study completed its planned Measure and Analyze work: source/measurement auditing, matched factorial discovery/verification, and a secondary pump nuisance-condition holdout. The remaining open work is a different epistemic level: genuinely independent validation, an implemented troubleshooting workflow, production MSA, operational baseline/benefit measurement, and Control.

Closure review found three reproducibility/contract issues rather than new research questions: the primary analysis did not explicitly fail on non-finite sensor values or an unexpected profile design; the secondary analysis receipt did not state its non-authority boundary; and canonical state referenced an older superseded primary receipt while a current content-bound receipt already existed.

## Decision

Close this lane as a **bounded public-data signal-discovery study**.

- Define, public-data Measure, and the three completed Analyze cycles are closed for this scope.
- External validation, Improve, field deployment, benefit verification, and Control remain unopened.
- Analysis inputs now fail closed on unexpected profile levels/factorial structure, wrong sensor widths, and non-finite values.
- Development/validation nuisance groups are checked for disjointness and complete stable-cycle coverage.
- Current analysis receipts explicitly carry `authority: none` and bind the exact analysis code and output hashes.
- Canonical state registers the current primary and pump receipts plus the closure receipt.
- The divergent `analysis/build-state.ts` and superseded pre-namespace analysis receipts are removed.

## Non-claims

This closure does not establish external hydraulic validation, field diagnostic accuracy, production causality, time-to-failure value, reduced troubleshooting time, downtime reduction, savings, safety improvement, ecological benefit, or sustainment.

## Verification

See `analysis/contracts/signal-discovery.v1.json` and `evidence/receipts/bounded-signal-discovery-closure-v1.json`.

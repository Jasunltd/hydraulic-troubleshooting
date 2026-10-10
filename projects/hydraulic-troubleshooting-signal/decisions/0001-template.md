# Decision 0001 — Use interpretable matched signal discovery before predictive AI

**Date:** 2026-10-03  
**Status:** accepted for current research phase

## Context

The lane is troubleshooting / causal-signal discovery. The UCI public hydraulic dataset contains raw cyclic sensor data and deliberately varied condition states for four components.

A predictive classifier could be trained immediately, but a high classification score would not by itself show:
- which signal changed;
- whether the signal is specific;
- whether transients were excluded;
- how a maintenance engineer should investigate conflicting evidence.

## Decision

Use:
1. source-state validity gate;
2. transparent time-localized features;
3. matched factorial comparisons;
4. holdout repeatability;
5. explicit cross-sensitivity.

Do not use AI/ML as the primary analysis method in this phase.

## Consequences

Positive:
- signal provenance is inspectable;
- failed hypotheses remain visible;
- dynamic valve behavior can be localized;
- pump/accumulator ambiguity is not hidden by an accuracy aggregate.

Limitations:
- no field diagnostic accuracy is established;
- interaction structure is not exhaustively modeled;
- independent validation is still required.

## Revisit condition

A classifier may be added later as a comparator only after the deterministic signal baseline is frozen and evaluated on independent evidence.

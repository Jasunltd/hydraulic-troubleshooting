# Analysis Method Iteration Record

This record preserves the fact that the first analysis method failed for several component families before a better mechanism was introduced.

## Pass 1 — whole-cycle features

Features:
- mean;
- sample SD;
- range;
- end-minus-start delta.

Frozen first-pass screen:
- discovery eta² ≥ 0.20;
- verification eta² ≥ 0.15;
- verification absolute severe-vs-healthy effect ≥ 0.50 pooled SD;
- discovery/verification direction must match.

Observed top results:
- **Cooler:** `CE_mean` — discovery eta² 0.9983; verification eta² 0.9983; passed.
- **Valve:** `FS1_range` — discovery eta² 0.2818; verification eta² 0.2768; standardized effect 0.177; failed effect gate.
- **Pump:** `EPS1_mean` — discovery eta² 0.1512; verification eta² 0.1562; standardized effect 1.017; failed discovery eta² gate.
- **Accumulator:** `FS1_delta` — discovery eta² 0.0881; verification eta² 0.1333; failed eta² gates.

Execution trace: `iexec-5c4bfa61a65d53d6baa3843e`.

## Engineering interpretation

The process is cyclic. Whole-cycle aggregates can destroy information about when pressure/flow transitions happen.

The next pass therefore changed the **measurement mechanism**, not the conclusion threshold:
- hold the other three component states fixed;
- compare healthy vs severe inside matched factorial strata;
- retain time localization using twelve five-second window means.

## Pass 2 — matched + time-localized features

Frozen second-pass screen:
- discovery absolute matched effect ≥ 1.00 within-cell SD;
- verification absolute matched effect ≥ 0.80;
- discovery direction consistency ≥ 90%;
- verification direction consistency ≥ 85%;
- direction must match.

Outcome:
- cooler and valve: verified, specific signatures;
- pump: verified repeatable signatures but weak specificity;
- accumulator: one verified repeatable pressure signature but weak specificity; other high-magnitude flow signals failed consistency.

Execution trace: `iexec-fa5234f50084c7215ec81eda`.

## Claim boundary

This is method iteration on a public experimental dataset. It is not a claim that the resulting rules have reduced field downtime or maintenance effort.

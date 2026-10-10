# AI Usage Record

## Models / tools used

- ChatGPT — public-source research, repository inspection, analysis design, code/document scaffolding, review.
- Deterministic Python standard-library analysis — numerical evidence.
- Existing TypeScript CI research kernel — semantic framing and record generation.

No AI/ML classifier is used to produce the component-signal findings.

## What AI was used for

- [x] public-source research
- [x] architecture alternatives
- [x] implementation scaffolding
- [x] test generation / validation planning
- [x] debugging hypotheses
- [x] statistical exploration design
- [x] documentation review
- [ ] video / visualization assistance
- [x] other: competing-hypothesis and claim-boundary review

## Engineer-owned decisions

| Decision | Alternatives considered | Why this choice | Verification |
|---|---|---|---|
| Use UCI hydraulic condition-monitoring data | generic synthetic maintenance table; black-box predictive-maintenance benchmark | source has raw cyclic sensors and deliberately varied component condition | source register + archive SHA |
| Gate source-flagged non-static cycles | pool all cycles | avoids treating unsettled process state as stable component evidence | source documentation + data audit |
| Use matched factorial comparisons | marginal group averages only | holds the other three component states fixed | full 144-cell stable design audit |
| Add 5-second window means after Pass 1 failure | lower thresholds; add ML classifier | preserves interpretable cyclic timing without changing failed results into success | method-iteration record + holdout |
| Do not establish SPC control limits | calculate limits from 10 fully healthy cycles | reference window is too thin and measurement-system adequacy is not independently established | healthy-reference summary + NIST method source |
| Do not estimate savings | convert diagnostic effect sizes into downtime dollars | no implementation or operational counterfactual exists | benefits ledger remains unverified |

## Rejected AI suggestions / paths

| Suggestion | Why rejected | Evidence |
|---|---|---|
| Start with a black-box classifier | would optimize predictive accuracy before establishing interpretable signals and CI meaning | analysis plan |
| Treat a strong single feature as a proven root cause | pump/accumulator features show cross-sensitivity; component labels do not create field causality | signal ranking |
| Call the 10 fully healthy cycles an SPC baseline | insufficient support for a production control-limit claim | data audit + healthy-reference summary |
| Translate signal detection into downtime savings | no implemented mechanism, baseline, counterfactual, or sustainment | benefits ledger |

## Independent verification

AI output is not treated as evidence.

Independent checks include:
- exact public archive hash;
- deterministic source-row and sample-width reconciliation;
- stable-factorial coverage check;
- discovery/verification split;
- matched-stratum repeatability;
- fixed acceptance gates;
- repository typecheck/tests and project validation.

Material numerical findings come from `analysis/analyze.py`, not from model-generated numbers.

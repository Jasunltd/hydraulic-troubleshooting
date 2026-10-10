# External data, authors, transformations, and license

The root [MIT license](LICENSE) applies to independently authored software
and associated original documentation, **not** the third-party source data
or data-derived tables. See [LICENSE-SCOPE.md](LICENSE-SCOPE.md).

## 1. UCI / ZeMA Hydraulic Condition Monitoring dataset

**Dataset:** *Condition monitoring of hydraulic systems*, UCI Machine
Learning Repository, dataset **447**, donated April 25, 2018.
Reference paper/dataset attribution cites work by **Nikolai Helwig,
Eliseo Pignanelli and Andreas Schütze**.

- Primary record: https://archive.ics.uci.edu/dataset/447/condition+monitoring+of+hydraulic+systems
- Dataset DOI and formal citation: https://doi.org/10.24432/C5CW21
- **Verified source license:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
- Historical method paper (a separate work with its own rights):
  *Condition Monitoring of a Complex Hydraulic System Using Multivariate
  Statistics*, https://doi.org/10.1109/I2MTC.2015.7151267
- Recorded upstream raw archive SHA-256:
  `24128aad2ee45eea7e6b63ebbd9992cdf25d0483a2cebefbfc13bc69079af1f2`.
  See [source and acquisition notice](projects/hydraulic-troubleshooting-signal/data/README.md)
  and [source register](projects/hydraulic-troubleshooting-signal/sources/source-register.csv).

**Modification/derivation notice:** From the original 2,205 cycles,
sensor streams and labeled component-condition profiles, this study
computed cycle-level summary statistics and 12-window sensor features,
separated source-marked stable and non-static cycles, checked all 144
stable condition combinations, computed matched factorial component
signatures, then evaluated deterministic within-experiment holdouts and
pump-leakage nuisance-condition groups. These features, tests and
reports are **derived research transformations**, not direct original
UCI sensor files and not separately field validated.

**Included derived artifacts** under
`projects/hydraulic-troubleshooting-signal/`:
- `data/processed/cycle-features.csv`
- `data/processed/feature-screen.csv`
- `data/processed/pump-leak-feature-screen.csv`
- `evidence/analysis-summary.json`
- `evidence/component-signal-ranking.csv`
- `evidence/verification-summary.csv`
- `evidence/pump-leak-rule-summary.json`, associated measurement audits,
  and content-addressed receipts.

These files contain or are derived from UCI data. Preserve the UCI
copyright/CC BY 4.0 credit, DOI/link, license URL and this indication
of changes whenever reproducing or republishing them. The large source
ZIP and full raw physical sensor streams are not redistributed here.

## 2. Methodological references

- Helwig et al. (2015) I2MTC hydraulic condition monitoring paper,
  DOI above: **cited only**, not republished.
- [NIST/SEMATECH Engineering Statistics Handbook — Control Charts](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc31.htm).
- [NIST/SEMATECH — Out of Control process response](https://itl.nist.gov/div898/handbook/pmc/section1/pmc14.htm).

These public sources inform analysis framing. They are not software
dependencies and are not MIT-licensed by inclusion of their URLs.

## 3. Independently authored study machinery

The Python/TypeScript analysis code, test harnesses, project-specific
algorithms and synthetic fixtures are in the root software MIT licensing
scope, provided the contributors actually possess the required rights.
The study uses [Effect](https://effect.website/) and
[XState](https://stately.ai/docs) for its separate supporting research
runtime and test infrastructure, plus other independently installed npm
packages; their licenses remain theirs.

## 4. Evidence and publication boundaries

CC BY 4.0 permits reuse with the required attribution and modifications
notice but does **not** grant a patent license, trademark endorsement,
employer rights, or authority for physical equipment action. This study
does not establish field diagnostic accuracy, realized maintenance benefit,
independent industrial sensor validation or safety certification.

The root software MIT license and the original UCI dataset's CC BY 4.0
terms remain distinct. Any reuse of derivative measurements must retain the
UCI authorship, DOI, source, original license and changes notice.

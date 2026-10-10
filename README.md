# Hydraulic Troubleshooting — Interpretable Signal Discovery

**Publication candidate — not yet publicly released or licensed.**

Can stable-state sensor measurements narrow hydraulic component-fault hypotheses without inventing a field diagnosis?

This is an isolated source snapshot extracted from a larger, private manufacturing
CI research program. It retains the original study directory under
`projects/hydraulic-troubleshooting-signal/` so frozen project-state and receipt paths remain meaningful.
Only the small imported shared research-kernel source closure under `src/` is
included; program-wide recruiting strategy, tooling, interview notes, other
studies, video assets, interactive demos and the original Git history are excluded.

## Start here

- [Study and results](projects/hydraulic-troubleshooting-signal/README.md)
- [Research data provenance](projects/hydraulic-troubleshooting-signal/data/README.md)
- [Source register](projects/hydraulic-troubleshooting-signal/sources/source-register.csv)
- [Evidence / receipts](projects/hydraulic-troubleshooting-signal/evidence/README.md)
- [Third-party dataset attribution](THIRD-PARTY-DATA.md)
- [Study tests](projects/hydraulic-troubleshooting-signal/analysis/test/)

## Reproduce the source-level checks

Install Node.js 22+ and Python 3.12+ (Python is needed for Hydraulic test seams):

```sh
npm ci
npm run verify
```

The `verify` command exercises source-level conformance, fixture integrity
and analysis seam tests. It does **not** run machine tools, live hardware,
production control, or any external data acquisition. Some independent research
tools (e.g. Julia, Gmsh, CalculiX) have distinct non-default setup requirements.

## Evidence boundaries

All analysis is based on one public experimental test rig. The holdout is within the same experiment; no independent field validation, production accuracy, achieved downtime reduction, or actuation authority is claimed.

### Frozen source and TypeScript note

The source file `analysis/analyze.ts` and the recorded analysis receipt
retain their exact historical SHA-256 identity. To typecheck that frozen
source without altering the receipt-bound bytes, this standalone
`tsconfig.json` uses `strict: true` but disables the optional
`noUncheckedIndexedAccess` diagnostic for array indexing. The
Python and Node conformance tests still verify the research behavior
and the existing receipt/source/data hashes. No new field study or
upstream experiment is implied.

The committed snapshots and measurement receipts are historical research
evidence and do not establish third-party reproducibility beyond the verified
test seams. Review provenance before republishing any third-party material.

## Publication and licensing

Source publication and code reuse licensing are **not yet approved**. There
is deliberately no open-source license in this candidate. A later Apache-2.0
or MIT decision for authored code **must not** be treated as licensing the
third-party datasets, third-party video assets, physical machine output or
research prose. The source register and originating dataset rights must be
reviewed independently.

No affiliation with source-data publishers, machinery vendors, research
institutions, or relevant prospective employers is implied.

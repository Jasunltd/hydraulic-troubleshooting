# Hard Constraints

These are feasibility gates. None may be traded away for faster diagnosis, higher apparent accuracy, lower cost, or a more impressive portfolio result.

## Safety

- The research output is advisory evidence only; it must not directly actuate equipment, bypass an interlock, or authorize a hazardous maintenance action.
- A real deployment must preserve lockout/tagout, machine-guarding, pressure-release, and site-specific safe-work requirements.
- Conflicting or non-static signals must default to containment/escalation rather than automatic action.

Verification: project artifacts contain no control command path; future experiment must record a human confirmation boundary.

## Legal / regulatory

- Use only material whose access and redistribution/analysis terms permit this work.
- Retain attribution for the UCI public dataset.
- Do not infer or expose hidden identities.

Verification: source register and data-provenance record.

## Quality

- Do not represent repeatable association as proven field causation.
- Do not claim component isolation when evidence is cross-sensitive.
- Do not suppress false-isolation or inconclusive cases.
- Do not use laboratory evidence to assert production diagnostic performance without independent validation.

Verification: matched-stratum specificity results, holdout results, claim-boundary review.

## Worker / human

- No blame inference from operator identity or behavior.
- Diagnostic logic must remain explainable enough for a maintainer/engineer to inspect the evidence.
- Workflow must preserve an "uncertain / escalate" state rather than forcing a diagnosis.

Verification: future workflow review and human-factors test.

## Ecological

- Do not deliberately create destructive or unsafe faults on live production equipment solely to generate portfolio evidence.
- Do not claim reduced scrap, energy, parts consumption, or emissions without observed evidence.

Verification: experimental protocol and benefits ledger.

## Data / privacy

- Public, synthetic, or independently observed evidence only.
- No employer screenshots, drawings, process parameters, schemas, part/customer identities, internal system names, URLs, or reconstructed proprietary values.
- Preserve source hashes, transformation logic, and derived-output provenance.

Verification: data provenance, archive hash, reproducible analysis, source register.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProject } from "../../../src/project/load.js";
import { frameProblem } from "../../../src/research/frame-problem.js";
import { establishBaseline } from "../../../src/research/baseline.js";
import { assessProcessSignal } from "../../../src/research/signal.js";
import { diagnoseProcess } from "../../../src/research/diagnosis.js";
import { planImprovementExperiment } from "../../../src/research/experiment.js";
import {
  admitEvidence,
  admitClaim,
  admitResearchRecord,
  recordPayload,
  type AdmissionDecision,
} from "../../../src/research/admission.js";
import { makeResearchRecord } from "../../../src/domain/research-record.js";
import type {
  EvidenceRef,
  HardConstraintState,
  HypothesisState,
  MetricDefinitionState,
  ResearchClaim,
  ResearchState,
} from "../../../src/domain/research-state.js";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const project = loadProject(projectDir);

const metrics: MetricDefinitionState[] = [
  {
    id: "E1",
    family: "economic",
    name: "Median diagnostic candidate component families after staged screen",
    unit: "count",
    direction: "minimize",
    hardConstraint: false,
    sourceOrFormula: "future independent validation; no operational baseline yet",
  },
  {
    id: "E2",
    family: "economic",
    name: "Troubleshooting decision time",
    unit: "minutes",
    direction: "minimize",
    hardConstraint: false,
    sourceOrFormula: "future timed validation; not yet measured",
  },
  {
    id: "H1",
    family: "human",
    name: "Signals or checks reviewed before escalation",
    unit: "count",
    direction: "minimize",
    hardConstraint: false,
    sourceOrFormula: "future workflow observation; not yet measured",
  },
  {
    id: "H2",
    family: "human",
    name: "Forced diagnoses when evidence is inconclusive",
    unit: "count",
    direction: "target",
    hardConstraint: true,
    target: 0,
    sourceOrFormula: "future workflow audit; target is zero forced diagnoses",
  },
  {
    id: "S1",
    family: "ecological",
    name: "Unnecessary diagnostic intervention or test cycles",
    unit: "count",
    direction: "minimize",
    hardConstraint: false,
    sourceOrFormula: "future observed validation; no ecological benefit measured",
  },
];

const hardConstraints: HardConstraintState[] = [
  {
    id: "HC-SAFETY",
    family: "safety",
    statement: "Research output must not directly actuate equipment, bypass safety interlocks, or authorize hazardous maintenance.",
    verification: "No control command path exists; future validation requires human authorization and site safety review.",
  },
  {
    id: "HC-LEGAL",
    family: "legal",
    statement: "Use only public, licensed, synthetic, or independently observed evidence and retain required attribution.",
    verification: "Source register, UCI provenance, and clean-room review.",
  },
  {
    id: "HC-QUALITY",
    family: "quality",
    statement: "Do not claim component isolation when evidence is cross-sensitive or when false isolation has not been measured.",
    verification: "Matched specificity, holdout repeatability, and future false-isolation audit.",
  },
  {
    id: "HC-HUMAN",
    family: "human",
    statement: "The workflow must preserve an inconclusive/escalate state and may not infer blame from operator identity or behavior.",
    verification: "Workflow review and future human-factors validation.",
  },
  {
    id: "HC-ECO",
    family: "ecological",
    statement: "Do not induce destructive production faults solely to produce portfolio evidence or claim resource benefit without observation.",
    verification: "Experiment-protocol review and benefits ledger.",
  },
  {
    id: "HC-DATA",
    family: "data",
    statement: "No confidential employer data or reconstructed proprietary parameters, schemas, identities, system names, URLs, or artifacts.",
    verification: "Public-source provenance, archive hash, and repository review.",
  },
];

const hypotheses: HypothesisState[] = [
  {
    id: "HYP-COOLER",
    statement: "Cooler degradation produces a repeatable component-specific thermal/cooling signature after other component states are held fixed.",
    status: "supported",
    falsification: "Reject if the verification split loses direction/effect repeatability or the leading signal is materially stronger for another component.",
    evidenceIds: ["ev-signal-ranking", "ev-verification-summary"],
  },
  {
    id: "HYP-VALVE",
    statement: "Valve lag produces a repeatable time-localized pressure/flow signature after other component states are held fixed.",
    status: "supported",
    falsification: "Reject if the verification split loses direction/effect repeatability or the signal is not component-specific.",
    evidenceIds: ["ev-signal-ranking", "ev-verification-summary"],
  },
  {
    id: "HYP-PUMP",
    statement: "Pump leakage produces repeatable signals that are sufficiently component-specific for direct isolation.",
    status: "inconclusive",
    falsification: "Support only if genuinely independent evidence preserves discrimination and direct-isolation performance while measurement-system and false-isolation gates pass.",
    evidenceIds: ["ev-signal-ranking", "ev-verification-summary", "ev-pump-holdout-summary"],
  },
  {
    id: "HYP-PUMP-HOLDOUT",
    statement: "A development-selected FS1 end-shift rule discriminates pump-leak labels across held-out cooler, valve, and accumulator condition groups inside the UCI experiment.",
    status: "supported",
    falsification: "Reject if the frozen rule fails on the held-out nuisance-condition groups or if the split/feature/threshold was influenced by holdout outcomes.",
    evidenceIds: ["ev-pump-holdout-summary", "ev-pump-holdout-audit", "ev-pump-holdout-receipt"],
  },
  {
    id: "HYP-ACCUMULATOR",
    statement: "Accumulator pressure reduction produces repeatable signals that are sufficiently component-specific for direct isolation.",
    status: "inconclusive",
    falsification: "Support only if independent evidence preserves repeatability and cross-sensitivity is reduced or explicitly resolved.",
    evidenceIds: ["ev-signal-ranking", "ev-verification-summary"],
  },
  {
    id: "HYP-STATE-GATE",
    statement: "Non-static process state must be gated before stable-state component interpretation.",
    status: "supported",
    falsification: "Reject only if an independent measurement design shows transient/static state has no material effect on the diagnostic evidence.",
    evidenceIds: ["src-uci", "ev-data-audit"],
  },
  {
    id: "HYP-STAGED-WORKFLOW",
    statement: "A stability-gated hierarchical deterministic rule can reduce diagnostic candidate count without forcing a false isolation.",
    status: "open",
    falsification: "Reject if independent validation does not narrow the candidate set, increases false isolation, or violates a hard constraint.",
    evidenceIds: ["ev-signal-ranking", "ev-verification-summary"],
  },
];

const evidence: EvidenceRef[] = [
  {
    id: "src-uci",
    kind: "source",
    authority: "public-primary",
    value: "https://archive.ics.uci.edu/dataset/447/condition+monitoring+of+hydraulic+systems",
    note: "Primary dataset provenance, sensor/cycle description, component conditions, stable flag, and license.",
  },
  {
    id: "src-hydraulic-paper",
    kind: "source",
    authority: "public-primary",
    value: "https://doi.org/10.1109/I2MTC.2015.7151267",
    note: "Measurement setup and prior multivariate condition-monitoring context cited by the dataset.",
  },
  {
    id: "src-nist-control",
    kind: "source",
    authority: "public-primary",
    value: "https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc31.htm",
    note: "Control-chart method reference; not evidence that this dataset is an adequate production baseline.",
  },
  {
    id: "src-nist-ocap",
    kind: "source",
    authority: "public-primary",
    value: "https://itl.nist.gov/div898/handbook/pmc/section1/pmc14.htm",
    note: "Assignable-cause investigation/action-plan framing.",
  },
  {
    id: "ev-public-dataset",
    kind: "dataset",
    authority: "public-primary",
    value: "data/raw/hydraulic-systems.zip#sha256:24128aad2ee45eea7e6b63ebbd9992cdf25d0483a2cebefbfc13bc69079af1f2",
    note: "Git-ignored local copy of the public UCI source archive.",
  },
  {
    id: "ev-data-audit",
    kind: "artifact",
    authority: "verification",
    value: "evidence/data-quality-audit.json",
    note: "Deterministic profile/sensor alignment and stable-factorial coverage audit.",
  },
  {
    id: "ev-signal-ranking",
    kind: "statistical-result",
    authority: "verification",
    value: "evidence/component-signal-ranking.csv",
    note: "Matched discovery/verification component-signal ranking.",
  },
  {
    id: "ev-verification-summary",
    kind: "statistical-result",
    authority: "verification",
    value: "evidence/verification-summary.csv",
    note: "Top holdout signal evidence by component.",
  },
  {
    id: "ev-analysis-summary",
    kind: "artifact",
    authority: "verification",
    value: "evidence/analysis-summary.json",
    note: "Machine-readable analysis scope, criteria, findings, and claim boundaries.",
  },
  {
    id: "ev-healthy-reference",
    kind: "statistical-result",
    authority: "verification",
    value: "evidence/healthy-reference-summary.csv",
    note: "Descriptive summary of 10 simultaneously stable/fully healthy cycles; not formal control limits.",
  },
  {
    id: "ev-analysis-command",
    kind: "command",
    authority: "verification",
    value: "python3 projects/hydraulic-troubleshooting-signal/analysis/analyze.py",
    note: "Deterministic standard-library reproduction command.",
  },
  {
    id: "ev-analysis-receipt",
    kind: "artifact",
    authority: "verification",
    value: "evidence/receipts/primary-analysis-receipt.json",
    note: "Source/output hashes and execution identities.",
  },
  {
    id: "ev-pump-holdout-summary",
    kind: "statistical-result",
    authority: "verification",
    value: "evidence/pump-leak-rule-summary.json",
    note: "Development-selected physical-sensor pump-leak rule evaluated on complete held-out cooler/valve/accumulator condition groups within the same public experiment.",
  },
  {
    id: "ev-pump-holdout-audit",
    kind: "artifact",
    authority: "verification",
    value: "evidence/pump-leak-measurement-audit.json",
    note: "Stable-cycle population, physical-sensor set, nuisance-group split, and measurement-system boundary for the secondary pump study.",
  },
  {
    id: "ev-pump-holdout-receipt",
    kind: "artifact",
    authority: "verification",
    value: "evidence/receipts/pump-leak-rule-receipt.json",
    note: "Execution/output identity for the secondary pump nuisance-condition holdout.",
  },
  {
    id: "ev-bounded-closure",
    kind: "test",
    authority: "verification",
    value: "evidence/receipts/bounded-signal-discovery-closure-v1.json",
    note: "Closure receipt for the bounded public-data signal-discovery scope; no field or actuation authority.",
  },
];

const claims: ResearchClaim[] = [
  {
    id: "CLM-SOURCE-STRUCTURE",
    kind: "reported-fact",
    confidence: "source-stated",
    text: "The public UCI hydraulic test-rig dataset contains 2,205 60-second cycles, multiple process sensors, four varied component-condition dimensions, and a cycle-wise stable flag.",
    evidenceIds: ["src-uci"],
  },
  {
    id: "CLM-STABLE-FLAG",
    kind: "reported-fact",
    confidence: "source-stated",
    text: "The source stable flag distinguishes cycles reported as stable from cycles where static conditions might not yet have been reached.",
    evidenceIds: ["src-uci"],
  },
  {
    id: "ASM-WINDOWS",
    kind: "assumption",
    confidence: "declared-assumption",
    text: "Twelve equal five-second windows are an interpretable time-localization choice for each 60-second cycle.",
    evidenceIds: [],
  },
  {
    id: "CLM-DATA-AUDIT",
    kind: "derived",
    method: "deterministic source reconciliation",
    reproducible: true,
    text: "All 17 sensor files reconcile to 2,205 profile cycles with expected row widths; 1,449 cycles are stable, and those stable cycles cover all 144 component-state combinations with 10–19 repetitions each.",
    evidenceIds: ["ev-public-dataset", "ev-data-audit", "ev-analysis-command"],
  },
  {
    id: "CLM-COOLER",
    kind: "derived",
    method: "matched factorial discovery/verification",
    reproducible: true,
    text: "Cooler degradation has highly repeatable, highly component-specific thermal/pressure signatures in the source-flagged stable public test-rig cycles.",
    evidenceIds: ["ev-signal-ranking", "ev-verification-summary", "ev-analysis-receipt"],
  },
  {
    id: "CLM-VALVE",
    kind: "derived",
    method: "matched factorial discovery/verification with time-localized features",
    reproducible: true,
    text: "Valve degradation has highly repeatable, time-localized, component-specific pressure/flow signatures in the source-flagged stable public test-rig cycles.",
    evidenceIds: ["ev-signal-ranking", "ev-verification-summary", "ev-analysis-receipt"],
  },
  {
    id: "CLM-PUMP",
    kind: "derived",
    method: "matched factorial discovery/verification and cross-component specificity",
    reproducible: true,
    text: "The broad matched-feature screen found repeatable pump-leakage signal changes but did not establish clean direct isolation from effect magnitude/specificity alone.",
    evidenceIds: ["ev-signal-ranking", "ev-verification-summary"],
  },
  {
    id: "CLM-PUMP-HOLDOUT",
    kind: "derived",
    method: "development-selected physical-sensor threshold with complete nuisance-condition group holdout",
    reproducible: true,
    text: "A secondary within-experiment study selected FS1 end-shift using 39 cooler/valve/accumulator development groups and, on 9 completely held-out nuisance-condition groups, flagged 0 of 90 healthy, 90 of 90 weak-leak, and 90 of 90 severe-leak stable cycles. This is within-experiment validation, not field diagnostic accuracy.",
    evidenceIds: ["ev-pump-holdout-summary", "ev-pump-holdout-audit", "ev-pump-holdout-receipt"],
  },
  {
    id: "CLM-ACCUMULATOR",
    kind: "derived",
    method: "matched factorial discovery/verification and cross-component specificity",
    reproducible: true,
    text: "Accumulator degradation produces a repeatable early pressure signal, but material cross-sensitivity remains and several high-magnitude flow candidates fail direction-consistency gates.",
    evidenceIds: ["ev-signal-ranking", "ev-verification-summary"],
  },
  {
    id: "CLM-SPC-LIMIT",
    kind: "derived",
    method: "measurement-validity gate",
    reproducible: true,
    text: "A formal production SPC baseline is not established: only 10 cycles are simultaneously stable and fully healthy, and independent measurement-system adequacy is not established.",
    evidenceIds: ["ev-healthy-reference", "ev-data-audit", "src-nist-control"],
  },
  {
    id: "CLM-BOUNDED-CLOSURE",
    kind: "derived",
    method: "deterministic analysis rerun plus seam/receipt verification",
    reproducible: true,
    text: "The public-data hydraulic signal-discovery scope is closed through Analyze: source integrity, stable-state partitioning, matched factorial repeatability, nuisance-group pump holdout, and code/output receipt binding are verified. External validation, Improve, operational benefit, and Control remain unopened.",
    evidenceIds: ["ev-analysis-receipt", "ev-pump-holdout-receipt", "ev-bounded-closure"],
  },
  {
    id: "REC-STAGED-WORKFLOW",
    kind: "recommendation",
    authority: "proposal-only",
    text: "Independently test a staged deterministic workflow: settle-state gate; verified cooler/valve branches; a frozen pump screening branch treated as provisional until external validation; multi-signal or physical confirmation for accumulator/ambiguous cases; explicit escalation on conflict.",
    evidenceIds: ["ev-signal-ranking", "ev-verification-summary", "ev-pump-holdout-summary"],
    basedOnClaimIds: ["CLM-COOLER", "CLM-VALVE", "CLM-PUMP", "CLM-PUMP-HOLDOUT", "CLM-ACCUMULATOR", "CLM-SPC-LIMIT"],
  },
];

let state: ResearchState = {
  schemaVersion: 2,
  projectSlug: project.slug,
  evidence: [],
  claims: [],
  metrics,
  hardConstraints,
  hypotheses,
  records: [],
  verificationReceiptFiles: [
    "evidence/receipts/primary-analysis-receipt.json",
    "evidence/receipts/pump-leak-rule-receipt.json",
    "evidence/receipts/bounded-signal-discovery-closure-v1.json",
  ],
};

function admitted(decision: AdmissionDecision): ResearchState {
  if (decision._tag === "Refused") {
    throw new Error("research admission refused: " + decision.reasons.join(", "));
  }
  return decision.state;
}

for (const item of evidence) state = admitted(admitEvidence(state, item));
for (const claim of claims) state = admitted(admitClaim(state, claim));

const framed = frameProblem(project.problem, state);
if (framed._tag !== "Framed") throw new Error("problem framing refused: " + framed.reasons.join(", "));
state = admitted(admitResearchRecord(
  state,
  makeResearchRecord("REC-PROBLEM-FRAME", "problem-frame", ["src-uci"], recordPayload(framed.frame)),
));

const baseline = establishBaseline({ metricId: "E1", measurements: [], minimumSamples: 5 });
state = admitted(admitResearchRecord(
  state,
  makeResearchRecord("REC-OPERATIONAL-BASELINE", "baseline-assessment", baseline.evidenceIds, recordPayload(baseline)),
));

const spcSignal = assessProcessSignal({
  methodId: "formal-production-spc-reference",
  measurementSystem: "unknown",
  baselineStable: null,
  sampleRequirementSatisfied: false,
  violations: [],
  evidenceIds: ["ev-healthy-reference", "ev-data-audit", "src-nist-control"],
});
state = admitted(admitResearchRecord(
  state,
  makeResearchRecord("REC-SPC-VALIDITY", "signal-assessment", spcSignal.evidenceIds, recordPayload(spcSignal)),
));

const coolerDiagnosis = diagnoseProcess([{
  hypothesisId: "HYP-COOLER",
  supportingEvidenceIds: ["ev-signal-ranking", "ev-verification-summary"],
  contradictingEvidenceIds: [],
  confounders: [],
}]);
state = admitted(admitResearchRecord(
  state,
  makeResearchRecord("REC-DIAG-COOLER", "diagnostic-assessment", coolerDiagnosis.evidenceIds, recordPayload(coolerDiagnosis)),
));

const valveDiagnosis = diagnoseProcess([{
  hypothesisId: "HYP-VALVE",
  supportingEvidenceIds: ["ev-signal-ranking", "ev-verification-summary"],
  contradictingEvidenceIds: [],
  confounders: [],
}]);
state = admitted(admitResearchRecord(
  state,
  makeResearchRecord("REC-DIAG-VALVE", "diagnostic-assessment", valveDiagnosis.evidenceIds, recordPayload(valveDiagnosis)),
));

const pumpDiagnosis = diagnoseProcess([{
  hypothesisId: "HYP-PUMP",
  supportingEvidenceIds: ["ev-signal-ranking", "ev-verification-summary"],
  contradictingEvidenceIds: [],
  confounders: ["leading pump features are materially responsive to other component-condition changes"],
}]);
state = admitted(admitResearchRecord(
  state,
  makeResearchRecord("REC-DIAG-PUMP", "diagnostic-assessment", pumpDiagnosis.evidenceIds, recordPayload(pumpDiagnosis)),
));

const pumpHoldoutDiagnosis = diagnoseProcess([{
  hypothesisId: "HYP-PUMP-HOLDOUT",
  supportingEvidenceIds: ["ev-pump-holdout-summary", "ev-pump-holdout-audit", "ev-pump-holdout-receipt"],
  contradictingEvidenceIds: [],
  confounders: [],
}]);
state = admitted(admitResearchRecord(
  state,
  makeResearchRecord("REC-DIAG-PUMP-HOLDOUT", "diagnostic-assessment", pumpHoldoutDiagnosis.evidenceIds, recordPayload(pumpHoldoutDiagnosis)),
));

const accumulatorDiagnosis = diagnoseProcess([{
  hypothesisId: "HYP-ACCUMULATOR",
  supportingEvidenceIds: ["ev-signal-ranking", "ev-verification-summary"],
  contradictingEvidenceIds: [],
  confounders: ["leading accumulator features are materially responsive to other component-condition changes"],
}]);
state = admitted(admitResearchRecord(
  state,
  makeResearchRecord("REC-DIAG-ACCUMULATOR", "diagnostic-assessment", accumulatorDiagnosis.evidenceIds, recordPayload(accumulatorDiagnosis)),
));

const experiment = planImprovementExperiment(state, {
  id: "EXP-INDEPENDENT-STAGED-RCA",
  hypothesisId: "HYP-STAGED-WORKFLOW",
  intervention: "Apply a frozen settled-state gate, verified cooler/valve branches, a provisional frozen pump screening branch, and multi-signal or physical confirmation for accumulator/ambiguous cases to genuinely independent evidence.",
  primaryMetricId: "E1",
  criteria: [
    { id: "C-CANDIDATES", metricId: "E1", operator: "<=", threshold: 2 },
    { id: "C-NO-FORCED-DIAGNOSIS", metricId: "H2", operator: "==", threshold: 0 },
  ],
  hardConstraintIds: hardConstraints.map((item) => item.id),
  requiredEvidenceKinds: [
    "independent-validation-population",
    "false-isolation-audit",
    "measurement-system-check",
    "human-review",
  ],
});
if (experiment._tag !== "Planned") throw new Error("experiment planning refused: " + experiment.reasons.join(", "));
state = admitted(admitResearchRecord(
  state,
  makeResearchRecord(
    "REC-EXPERIMENT-PLAN",
    "experiment-plan",
    ["ev-signal-ranking", "ev-verification-summary", "ev-pump-holdout-summary"],
    recordPayload(experiment.plan),
  ),
));

fs.writeFileSync(path.join(projectDir, "state.json"), JSON.stringify(state, null, 2) + "\n");
console.log(JSON.stringify({
  project: state.projectSlug,
  evidence: state.evidence.length,
  claims: state.claims.length,
  metrics: state.metrics.length,
  hardConstraints: state.hardConstraints.length,
  hypotheses: state.hypotheses.length,
  records: state.records.map((record) => ({ id: record.id, kind: record.kind, digest: record.digest })),
  verificationReceiptFiles: state.verificationReceiptFiles,
}, null, 2));

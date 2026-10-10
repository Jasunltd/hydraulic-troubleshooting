import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";

const root = "projects/hydraulic-troubleshooting-signal";
const hash = (relative: string) =>
  createHash("sha256").update(fs.readFileSync(`${root}/${relative}`)).digest("hex");

test("registered analysis receipts bind exact code and output content with no authority", () => {
  for (const relative of [
    "evidence/receipts/primary-analysis-receipt.json",
    "evidence/receipts/pump-leak-rule-receipt.json",
  ]) {
    const receipt = JSON.parse(fs.readFileSync(`${root}/${relative}`, "utf8"));
    assert.equal(receipt.authority, "none", relative);
    assert.equal(receipt.effectReplay, false, relative);
    assert.equal(hash(receipt.analysisScript), receipt.analysisScriptSha256, relative);
    for (const [output, expected] of Object.entries(receipt.outputs)) {
      assert.equal(hash(output), expected, `${relative}:${output}`);
    }
  }
});

test("canonical state registers current receipts and keeps operational authority proposal-only", () => {
  const state = JSON.parse(fs.readFileSync(`${root}/state.json`, "utf8"));
  assert.deepEqual(
    state.verificationReceiptFiles,
    [
      "evidence/receipts/primary-analysis-receipt.json",
      "evidence/receipts/pump-leak-rule-receipt.json",
      "evidence/receipts/bounded-signal-discovery-closure-v1.json",
    ],
  );
  const workflow = state.claims.find((claim: { id: string }) => claim.id === "REC-STAGED-WORKFLOW");
  assert.ok(workflow);
  assert.equal(workflow.kind, "recommendation");
  assert.equal(workflow.authority, "proposal-only");
});

test("closure contract freezes two non-authoritative analysis seams", () => {
  const contract = JSON.parse(
    fs.readFileSync(`${root}/analysis/contracts/signal-discovery.v1.json`, "utf8"),
  );
  assert.equal(contract.schema, "hydraulic.signal-discovery-contract/v1");
  assert.equal(contract.authority, "none");
  assert.equal(contract.seams.length, 2);
  assert.ok(contract.seams.every((seam: { guarantees: string[] }) => seam.guarantees.length >= 5));
});

test("bounded closure preserves within-experiment holdout and explicit non-claims", () => {
  const summary = JSON.parse(
    fs.readFileSync(`${root}/evidence/pump-leak-rule-summary.json`, "utf8"),
  );
  assert.equal(summary.data.counts.development_nuisance_groups, 39);
  assert.equal(summary.data.counts.validation_nuisance_groups, 9);
  assert.equal(summary.validationRules.single_top_feature.healthy_false_alarm.flagged, 0);
  assert.equal(summary.validationRules.single_top_feature.weak_leak_detection.flagged, 90);
  assert.equal(summary.validationRules.single_top_feature.severe_leak_detection.flagged, 90);
  for (const nonClaim of [
    "field measurement-system adequacy",
    "time-to-failure or warning lead time",
    "causal mechanism in production equipment",
    "implemented downtime reduction",
    "realized savings",
    "sustainment",
  ]) {
    assert.ok(summary.interpretation.whatIsNotEstablished.includes(nonClaim), nonClaim);
  }
});

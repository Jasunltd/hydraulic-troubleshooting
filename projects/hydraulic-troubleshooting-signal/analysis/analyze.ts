import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createHash } from "node:crypto";

const PROJECT = path.resolve("projects/hydraulic-troubleshooting-signal");
const RAW = path.join(PROJECT, "data", "raw", "uci-hydraulic-447");
const PROCESSED = path.join(PROJECT, "data", "processed");
const EVIDENCE = path.join(PROJECT, "evidence");
const RECEIPTS = path.join(EVIDENCE, "receipts");

type SensorMeta = { quantity: string; unit: string; hz: number };
const SENSORS: Record<string, SensorMeta> = {
  PS1: { quantity: "pressure", unit: "bar", hz: 100 },
  PS2: { quantity: "pressure", unit: "bar", hz: 100 },
  PS3: { quantity: "pressure", unit: "bar", hz: 100 },
  PS4: { quantity: "pressure", unit: "bar", hz: 100 },
  PS5: { quantity: "pressure", unit: "bar", hz: 100 },
  PS6: { quantity: "pressure", unit: "bar", hz: 100 },
  EPS1: { quantity: "motor_power", unit: "W", hz: 100 },
  FS1: { quantity: "volume_flow", unit: "l/min", hz: 10 },
  FS2: { quantity: "volume_flow", unit: "l/min", hz: 10 },
  TS1: { quantity: "temperature", unit: "degC", hz: 1 },
  TS2: { quantity: "temperature", unit: "degC", hz: 1 },
  TS3: { quantity: "temperature", unit: "degC", hz: 1 },
  TS4: { quantity: "temperature", unit: "degC", hz: 1 },
  VS1: { quantity: "vibration", unit: "mm/s", hz: 1 },
};
const STATS = ["mean", "std", "min", "max", "end_shift"] as const;

function sha256(file: string): string {
  const h = createHash("sha256");
  h.update(fs.readFileSync(file));
  return h.digest("hex");
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sampleStd(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1));
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) throw new Error("quantile on empty array");
  const s = [...values].sort((a, b) => a - b);
  if (s.length === 1) return s[0]!;
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return s[lo]!;
  const w = pos - lo;
  return s[lo]! * (1 - w) + s[hi]! * w;
}

function median(values: number[]): number {
  return quantile(values, 0.5);
}

function wilson(k: number, n: number): [number | null, number | null] {
  if (n <= 0) return [null, null];
  const z = 1.959963984540054;
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n)) / denom;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

function mannWhitneyAuc(x: number[], y: number[]): number {
  const combined = [
    ...x.map((value) => ({ value, x: true })),
    ...y.map((value) => ({ value, x: false })),
  ].sort((a, b) => a.value - b.value);
  let rankSumX = 0;
  let i = 0;
  while (i < combined.length) {
    let j = i + 1;
    while (j < combined.length && combined[j]!.value === combined[i]!.value) j++;
    const avgRank = ((i + 1) + j) / 2;
    for (let k = i; k < j; k++) if (combined[k]!.x) rankSumX += avgRank;
    i = j;
  }
  const nx = x.length;
  const ny = y.length;
  const u = rankSumX - (nx * (nx + 1)) / 2;
  return u / (nx * ny);
}

function alert(value: number, threshold: number, direction: 1 | -1): boolean {
  return direction > 0 ? value >= threshold : value <= threshold;
}

function rate(indices: number[], flags: boolean[]) {
  const n = indices.length;
  const k = indices.reduce((s, i) => s + (flags[i] ? 1 : 0), 0);
  return { n, flagged: k, rate: n ? k / n : null, wilson95: wilson(k, n) };
}

async function summarizeSensor(file: string, expectedRows: number, expectedSamples: number) {
  const stats: Record<(typeof STATS)[number], number[]> = {
    mean: [], std: [], min: [], max: [], end_shift: [],
  };
  const input = fs.createReadStream(file, { encoding: "utf8" });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  let row = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const tokens = line.trim().split(/\s+/);
    if (tokens.length !== expectedSamples) {
      throw new Error(`${path.basename(file)} row ${row + 1}: expected ${expectedSamples} samples, got ${tokens.length}`);
    }
    const edge = Math.max(1, Math.floor(expectedSamples / 10));
    let sum = 0;
    let sumSq = 0;
    let min = Infinity;
    let max = -Infinity;
    let first = 0;
    let last = 0;
    for (let i = 0; i < tokens.length; i++) {
      const v = Number(tokens[i]);
      if (!Number.isFinite(v)) throw new Error(`${path.basename(file)} row ${row + 1}: non-finite value`);
      sum += v;
      sumSq += v * v;
      if (v < min) min = v;
      if (v > max) max = v;
      if (i < edge) first += v;
      if (i >= tokens.length - edge) last += v;
    }
    const n = tokens.length;
    const m = sum / n;
    const variance = n > 1 ? Math.max(0, (sumSq - n * m * m) / (n - 1)) : 0;
    stats.mean.push(m);
    stats.std.push(Math.sqrt(variance));
    stats.min.push(min);
    stats.max.push(max);
    stats.end_shift.push(last / edge - first / edge);
    row++;
  }
  if (row !== expectedRows) throw new Error(`${path.basename(file)}: expected ${expectedRows} rows, got ${row}`);
  return stats;
}

function parseProfile(file: string): number[][] {
  const rows = fs.readFileSync(file, "utf8").trim().split(/\r?\n/).filter(Boolean).map((line) => line.trim().split(/\s+/).map(Number));
  if (rows.some((r) => r.length !== 5 || r.some((v) => !Number.isFinite(v)))) throw new Error("Invalid profile.txt");
  return rows;
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function nuisanceConsistency(values: number[], profile: number[][], dev: number[], direction: 1 | -1) {
  const groups = new Map<string, number[]>();
  for (const i of dev) {
    const p = profile[i]!;
    const key = `${p[0]}|${p[1]}|${p[3]}`;
    const list = groups.get(key) ?? [];
    list.push(i);
    groups.set(key, list);
  }
  let compared = 0;
  let consistent = 0;
  for (const idx of groups.values()) {
    const healthy = idx.filter((i) => profile[i]![2] === 0).map((i) => values[i]!);
    const leak = idx.filter((i) => profile[i]![2] > 0).map((i) => values[i]!);
    if (healthy.length < 3 || leak.length < 3) continue;
    compared++;
    const delta = median(leak) - median(healthy);
    if (delta * direction > 0) consistent++;
  }
  return { compared, consistency: compared ? consistent / compared : null };
}

async function main() {
  fs.mkdirSync(PROCESSED, { recursive: true });
  fs.mkdirSync(RECEIPTS, { recursive: true });

  const profilePath = path.join(RAW, "profile.txt");
  if (!fs.existsSync(profilePath)) throw new Error("Raw dataset missing; run analysis/acquire.py first");
  const profile = parseProfile(profilePath);
  const n = profile.length;
  const cooler = profile.map((r) => r[0]!);
  const valve = profile.map((r) => r[1]!);
  const pump = profile.map((r) => r[2]!);
  const accumulator = profile.map((r) => r[3]!);
  const stableFlag = profile.map((r) => r[4]!);

  const featureValues = new Map<string, number[]>();
  const featureMeta: Record<string, Record<string, unknown>> = {};
  const sensorAudit: Record<string, unknown> = {};

  for (const [sensor, meta] of Object.entries(SENSORS)) {
    const file = path.join(RAW, `${sensor}.txt`);
    const expectedSamples = meta.hz * 60;
    const summaries = await summarizeSensor(file, n, expectedSamples);
    for (const stat of STATS) {
      const feature = `${sensor}__${stat}`;
      featureValues.set(feature, summaries[stat]);
      featureMeta[feature] = { feature, sensor, stat, ...meta };
    }
    sensorAudit[sensor] = { rows: n, samplesPerCycle: expectedSamples, finite: true, file: path.relative(PROJECT, file) };
  }

  const stable = Array.from({ length: n }, (_, i) => stableFlag[i] === 0);
  const nuisanceKey = (i: number) => `${cooler[i]}|${valve[i]}|${accumulator[i]}`;
  const stableGroups = [...new Set(Array.from({ length: n }, (_, i) => i).filter((i) => stable[i]).map(nuisanceKey))].sort();
  const validationGroups = new Set(stableGroups.filter((_, i) => ((i + 1) % 5) === 0));
  const dev = Array.from({ length: n }, (_, i) => i).filter((i) => stable[i] && !validationGroups.has(nuisanceKey(i)));
  const val = Array.from({ length: n }, (_, i) => i).filter((i) => stable[i] && validationGroups.has(nuisanceKey(i)));
  const byPump = (idx: number[], k: number) => idx.filter((i) => pump[i] === k);

  const counts = {
    all_cycles: n,
    stable_cycles: stable.filter(Boolean).length,
    not_stabilized_cycles: stable.filter((v) => !v).length,
    development_cycles: dev.length,
    validation_cycles: val.length,
    nuisance_groups_total: stableGroups.length,
    development_nuisance_groups: stableGroups.length - validationGroups.size,
    validation_nuisance_groups: validationGroups.size,
    development_by_pump: Object.fromEntries([0, 1, 2].map((k) => [String(k), byPump(dev, k).length])),
    validation_by_pump: Object.fromEntries([0, 1, 2].map((k) => [String(k), byPump(val, k).length])),
  };

  type Row = Record<string, any>;
  const rows: Row[] = [];
  for (const [feature, values] of featureValues) {
    const h = byPump(dev, 0).map((i) => values[i]!);
    const w = byPump(dev, 1).map((i) => values[i]!);
    const s = byPump(dev, 2).map((i) => values[i]!);
    const leak = dev.filter((i) => pump[i]! > 0).map((i) => values[i]!);
    if (Math.min(h.length, w.length, s.length) < 5) continue;
    const m0 = median(h), m1 = median(w), m2 = median(s);
    const direction: 1 | -1 = median(leak) >= m0 ? 1 : -1;
    const monotonic = direction > 0 ? (m0 <= m1 && m1 <= m2) : (m0 >= m1 && m1 >= m2);
    const aucSigned = mannWhitneyAuc(leak, h);
    const separationAuc = Math.max(aucSigned, 1 - aucSigned);
    const threshold = quantile(h, direction > 0 ? 0.99 : 0.01);
    const flags = values.map((v) => alert(v, threshold, direction));
    const nuisance = nuisanceConsistency(values, profile, dev, direction);
    rows.push({
      ...featureMeta[feature],
      direction: direction > 0 ? "high" : "low",
      direction_code: direction,
      healthy_median: m0,
      weak_median: m1,
      severe_median: m2,
      monotonic_medians: monotonic,
      separation_auc: separationAuc,
      cliffs_delta: 2 * aucSigned - 1,
      healthy_control_limit: threshold,
      healthy_control_quantile: direction > 0 ? 0.99 : 0.01,
      dev_healthy_false_alarm_rate: rate(byPump(dev, 0), flags).rate,
      dev_weak_detection_rate: rate(byPump(dev, 1), flags).rate,
      dev_severe_detection_rate: rate(byPump(dev, 2), flags).rate,
      nuisance_strata_compared: nuisance.compared,
      nuisance_sign_consistency: nuisance.consistency,
    });
  }

  rows.sort((a, b) => {
    const ka = [a.monotonic_medians ? 1 : 0, a.nuisance_sign_consistency ?? -1, a.separation_auc, Math.min(a.dev_weak_detection_rate, a.dev_severe_detection_rate), Math.abs(a.cliffs_delta)];
    const kb = [b.monotonic_medians ? 1 : 0, b.nuisance_sign_consistency ?? -1, b.separation_auc, Math.min(b.dev_weak_detection_rate, b.dev_severe_detection_rate), Math.abs(b.cliffs_delta)];
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i]! - ka[i]!;
    return String(a.feature).localeCompare(String(b.feature));
  });
  const top = rows[0]!;
  const second = rows.find((r, i) => i > 0 && r.sensor !== top.sensor) ?? rows[1] ?? top;

  const makeFlags = (row: Row) => featureValues.get(row.feature)!.map((v) => alert(v, row.healthy_control_limit, row.direction_code));
  const topFlags = makeFlags(top);
  const secondFlags = makeFlags(second);
  const rules: Record<string, boolean[]> = {
    single_top_feature: topFlags,
    two_feature_and: topFlags.map((v, i) => v && secondFlags[i]!),
    two_feature_or: topFlags.map((v, i) => v || secondFlags[i]!),
  };
  const validationRules: Record<string, unknown> = {};
  for (const [name, flags] of Object.entries(rules)) {
    validationRules[name] = {
      healthy_false_alarm: rate(byPump(val, 0), flags),
      weak_leak_detection: rate(byPump(val, 1), flags),
      severe_leak_detection: rate(byPump(val, 2), flags),
      any_leak_detection: rate(val.filter((i) => pump[i]! > 0), flags),
    };
  }

  const topValues = featureValues.get(top.feature)!;
  const healthyDev = byPump(dev, 0).map((i) => topValues[i]!);
  const baseline = {
    metric: top.feature,
    n: healthyDev.length,
    mean: mean(healthyDev),
    sample_std: sampleStd(healthyDev),
    median: median(healthyDev),
    p01: quantile(healthyDev, 0.01),
    p99: quantile(healthyDev, 0.99),
    note: "Healthy, source-labeled stable cycles in the development subset; nuisance component conditions are intentionally varied.",
  };

  const expectedValueSets = {
    cooler: [3, 20, 100], valve: [73, 80, 90, 100], pump: [0, 1, 2], accumulator: [90, 100, 115, 130], stable_flag: [0, 1],
  };
  const observedValueSets = {
    cooler: uniqueSorted(cooler), valve: uniqueSorted(valve), pump: uniqueSorted(pump), accumulator: uniqueSorted(accumulator), stable_flag: uniqueSorted(stableFlag),
  };
  if (JSON.stringify(expectedValueSets) !== JSON.stringify(observedValueSets)) {
    throw new Error("profile value sets do not match the frozen hydraulic study contract");
  }
  const devGroups = new Set(dev.map(nuisanceKey));
  const valGroups = new Set(val.map(nuisanceKey));
  if (dev.some((index) => val.includes(index)) || [...devGroups].some((group) => valGroups.has(group))) {
    throw new Error("development/validation nuisance-group split overlaps");
  }
  if (dev.length + val.length !== stable.filter(Boolean).length) {
    throw new Error("development/validation split does not cover every stable cycle exactly once");
  }
  const measurementAudit = {
    schema: "ci-research.measurement-audit/v1",
    profileFile: path.relative(PROJECT, profilePath),
    profileShape: [n, 5],
    expectedValueSets,
    observedValueSets,
    valueSetsMatchExpected: JSON.stringify(expectedValueSets) === JSON.stringify(observedValueSets),
    sensors: sensorAudit,
    physicalSensorsUsed: Object.keys(SENSORS).sort(),
    virtualSensorsExcluded: ["CE", "CP", "SE"],
    splitRule: "stable_flag == 0; every fifth sorted cooler|valve|accumulator condition group is held out in full for validation",
    counts,
    measurementSystemBoundary: "Raw-file integrity, row alignment, finite values, and expected sampling counts are verified; calibration/repeatability metadata are not available, so field MSA adequacy is not established.",
  };
  const measurementPath = path.join(EVIDENCE, "pump-leak-measurement-audit.json");
  fs.writeFileSync(measurementPath, JSON.stringify(measurementAudit, null, 2) + "\n");

  const csvFields = ["rank","feature","sensor","stat","quantity","unit","hz","direction","healthy_median","weak_median","severe_median","monotonic_medians","separation_auc","cliffs_delta","healthy_control_limit","healthy_control_quantile","dev_healthy_false_alarm_rate","dev_weak_detection_rate","dev_severe_detection_rate","nuisance_strata_compared","nuisance_sign_consistency"];
  const csv = [csvFields.join(",")];
  rows.forEach((row, i) => csv.push(csvFields.map((f) => csvEscape(f === "rank" ? i + 1 : row[f])).join(",")));
  const featurePath = path.join(PROCESSED, "pump-leak-feature-screen.csv");
  fs.writeFileSync(featurePath, csv.join("\n") + "\n");

  const stripInternal = (row: Row) => Object.fromEntries(Object.entries(row).filter(([k]) => k !== "direction_code"));
  const summary = {
    schema: "ci-research.analysis-summary/v1",
    researchQuestion: "Which small, interpretable physical-sensor features separate healthy from internally leaking pump cycles on the public hydraulic test rig, and does a healthy-baseline threshold hold out with low false alarms across varying cooler, valve, and accumulator conditions?",
    status: "secondary_pump_leak_holdout_complete",
    data: { source: "UCI Condition monitoring of hydraulic systems, dataset 447", doi: "10.24432/C5CW21", license: "CC BY 4.0", counts },
    measurementValidity: measurementAudit.measurementSystemBoundary,
    featureSelection: {
      policy: "Development subset only. Rank monotonic pump-severity medians first, then nuisance-stratum sign consistency, then healthy-vs-leak separation AUC. Threshold is the healthy development 99th/1st percentile according to signal direction. Validation holds out complete cooler/valve/accumulator condition groups unseen during feature or threshold selection.",
      topFeature: stripInternal(top),
      secondDistinctSensorFeature: stripInternal(second),
    },
    baseline,
    validationRules,
    interpretation: {
      whatIsObserved: "Sensor traces and component-condition labels are public experimental observations from the source dataset.",
      whatIsDerived: "Per-cycle summary features, effect/separation statistics, thresholds, and holdout rates are derived reproducibly by this analysis.",
      whatIsNotEstablished: ["field measurement-system adequacy","time-to-failure or warning lead time","causal mechanism in production equipment","implemented downtime reduction","realized savings","sustainment"],
    },
    competingHypotheses: [
      "H1: pump leakage severity produces a repeatable signal in one or more physical sensor summaries.",
      "H2: apparent pump signal is primarily explained by cooler, valve, accumulator, or thermal-state variation.",
      "H3: cycles that had not reached static conditions create the apparent signal.",
      "H4: a fixed single-feature threshold is too brittle and requires corroborating evidence or condition-aware logic.",
    ],
  };
  const summaryPath = path.join(EVIDENCE, "pump-leak-rule-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n");

  const acquisitionPath = path.join(RECEIPTS, "acquisition-receipt.json");
  const receipt = {
    schema: "ci-research.analysis-receipt/v1",
    authority: "none",
    effectReplay: false,
    claimBoundary: "Receipt binds the within-experiment pump-screening analysis code and derived outputs only; it does not establish external validation, field diagnostic accuracy, or actuation authority.",
    completedAtUtc: new Date().toISOString(),
    analysisScript: path.relative(PROJECT, path.resolve("projects/hydraulic-troubleshooting-signal/analysis/analyze.ts")),
    analysisScriptSha256: sha256(path.resolve("projects/hydraulic-troubleshooting-signal/analysis/analyze.ts")),
    acquisitionReceiptSha256: fs.existsSync(acquisitionPath) ? sha256(acquisitionPath) : null,
    runtime: process.version,
    outputs: {
      [path.relative(PROJECT, measurementPath)]: sha256(measurementPath),
      [path.relative(PROJECT, featurePath)]: sha256(featurePath),
      [path.relative(PROJECT, summaryPath)]: sha256(summaryPath),
    },
  };
  const receiptPath = path.join(RECEIPTS, "pump-leak-rule-receipt.json");
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + "\n");

  console.log(JSON.stringify({ counts, topFeature: summary.featureSelection.topFeature, secondFeature: summary.featureSelection.secondDistinctSensorFeature, validationRules, receipt: path.relative(PROJECT, receiptPath) }, null, 2));
}

await main();

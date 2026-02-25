const fs = require("fs");
const path = require("path");

const env = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const urlMatch = env.match(/VITE_SUPABASE_URL="([^"]+)"/);
const keyMatch = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="([^"]+)"/);
const SUPABASE_URL = urlMatch[1];
const ANON_KEY = keyMatch[1];
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/analyze-case`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const testCases = [
  {
    name: "Case 1: Voluntary Noise Reduction (expect Stable, high composite)",
    body: {
      title: "Voluntary Noise Reduction Implementation",
      narrative: "A manufacturing company identifies that employee exposure to intermittent impulse noise is below regulatory limits but still associated with potential long-term hearing damage. The company voluntarily installs additional acoustic dampening panels and upgrades personal protective equipment without waiting for regulatory mandate. Workers are informed transparently about risks and mitigation steps.",
      stakeholders: "Workers, Management, Safety Committee, Regulatory Bodies",
      selectedCodes: ["BCSP/ASSP", "AIHA/ABIH"],
    },
    expect: { stability: "Stable", compositeMin: 7.0, violation: false },
  },
  {
    name: "Case 2: Suppressed Exposure Data (expect Ethically Unstable, cap <= 4.9)",
    body: {
      title: "Suppressed Exposure Data",
      narrative: "An industrial hygienist discovers airborne contaminant measurements exceeding internal safety guidelines but below regulatory limits. Senior management instructs the hygienist not to disclose the findings to employees to avoid 'unnecessary alarm.' The hygienist complies and omits the data from the report.",
      stakeholders: "Industrial Hygienist, Senior Management, Workers, Regulatory Bodies",
      selectedCodes: ["AIHA/ABIH", "BCSP/ASSP"],
    },
    expect: { stability: "Ethically Unstable", compositeMax: 4.9, violation: true },
  },
  {
    name: "Case 3: Resource Allocation Trade-Off (expect Contested)",
    body: {
      title: "Resource Allocation Trade-Off",
      narrative: "A safety director must allocate limited budget between upgrading outdated ventilation systems at one facility or implementing a company-wide mental health support program. Both initiatives would improve worker well-being, but only one can be funded this year.",
      stakeholders: "Safety Director, Workers, Management, Community",
      selectedCodes: ["BCSP/ASSP", "ACOEM"],
    },
    expect: { stability: "Contested", violation: false },
  },
];

async function callWithRetry(tc, attempt = 1) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON_KEY}`,
      "apikey": ANON_KEY,
    },
    body: JSON.stringify(tc.body),
  });

  if (res.status === 429 && attempt <= 3) {
    const wait = attempt * 15;
    console.log(`  Rate limited (attempt ${attempt}). Waiting ${wait}s...`);
    await sleep(wait * 1000);
    return callWithRetry(tc, attempt + 1);
  }
  return res;
}

async function runTest(tc) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`TEST: ${tc.name}`);
  console.log("=".repeat(70));

  const start = Date.now();
  const res = await callWithRetry(tc);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (!res.ok) {
    const errText = await res.text();
    console.log(`  FAIL: HTTP ${res.status} - ${errText} (${elapsed}s)`);
    return { name: tc.name, pass: false, reason: `HTTP ${res.status}` };
  }

  const data = await res.json();
  console.log(`  Response time: ${elapsed}s`);
  console.log(`  Algorithm version: ${data._algorithmVersion}`);
  console.log(`  Guardrails applied: ${data._guardrailsApplied}`);
  console.log(`  Composite score: ${data.compositeScore}`);
  console.log(`  Ethical stability: ${data.ethicalStability}`);
  console.log(`  Conflict level: ${data.conflictLevel}`);
  console.log(`  Lens scores:`);
  for (const [key, val] of Object.entries(data.lensScores)) {
    console.log(`    ${key}: ${val.score}/10`);
  }
  const vd = data.violationDetection || {};
  console.log(`  Violation: ${vd.hasViolation} (severity: ${vd.violationSeverity})`);
  if (vd.violatedCodes && vd.violatedCodes.length > 0) console.log(`  Violated codes: ${vd.violatedCodes.join(", ")}`);
  if (data._internal) {
    const i = data._internal;
    console.log(`  _internal: lensAvg=${i.lensAverage} codeSc=${i.codeScore} lensComp=${i.lensComponent} codeComp=${i.codeComponent} stdDev=${i.lensStdDev}`);
  }
  if (data.warningFlags && data.warningFlags.length > 0) console.log(`  Warnings: ${data.warningFlags.join("; ")}`);
  const firstReasoning = Object.values(data.lensScores)[0].reasoning;
  console.log(`  Sample reasoning (first lens): ${firstReasoning.substring(0, 200)}...`);

  const checks = [];
  if (tc.expect.stability && data.ethicalStability !== tc.expect.stability) checks.push(`stability: expected ${tc.expect.stability}, got ${data.ethicalStability}`);
  if (tc.expect.compositeMin !== undefined && data.compositeScore < tc.expect.compositeMin) checks.push(`compositeMin: expected >= ${tc.expect.compositeMin}, got ${data.compositeScore}`);
  if (tc.expect.compositeMax !== undefined && data.compositeScore > tc.expect.compositeMax) checks.push(`compositeMax: expected <= ${tc.expect.compositeMax}, got ${data.compositeScore}`);
  if (tc.expect.violation !== undefined && vd.hasViolation !== tc.expect.violation) checks.push(`violation: expected ${tc.expect.violation}, got ${vd.hasViolation}`);

  if (checks.length === 0) {
    console.log(`  >> PASS`);
    return { name: tc.name, pass: true };
  } else {
    for (const c of checks) console.log(`  >> FAIL: ${c}`);
    return { name: tc.name, pass: false, reason: checks.join("; ") };
  }
}

(async () => {
  console.log("Ethical Insight Pro - Algorithm v2.1 Test Suite");
  console.log(`Endpoint: ${FUNCTION_URL}\n`);
  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    if (i > 0) {
      console.log(`\n  -- Waiting 20s between tests to avoid rate limits --`);
      await sleep(20000);
    }
    try { results.push(await runTest(testCases[i])); }
    catch (err) { console.log(`  ERROR: ${err.message}`); results.push({ name: testCases[i].name, pass: false, reason: err.message }); }
  }
  console.log(`\n${"=".repeat(70)}`);
  console.log("SUMMARY");
  console.log("=".repeat(70));
  for (const r of results) console.log(`  ${r.pass ? "PASS" : "FAIL"} - ${r.name}${r.reason ? ` (${r.reason})` : ""}`);
  console.log(`\n  ${results.filter(r => r.pass).length}/${results.length} tests passed.`);
})();

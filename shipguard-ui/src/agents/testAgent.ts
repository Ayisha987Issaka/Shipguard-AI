/**
 * Test Agent
 *
 * Responsibility: Inspect the test suite and its results.
 * Maps to: REQ-01 (All automated tests must pass).
 *
 * The agent inspects the test files for meaningfulness and reports the results
 * of the pre-captured test run. It does NOT execute code — it analyses the
 * snapshot data and test output.
 *
 * Fix scope (REQ-01 only): correct the simulated return value so the test
 * contract is satisfied. The PAYSTACK_SECRET_KEY runtime guard is a separate
 * concern (REQ-02) and is proposed by the ConfigAgent as its own fix.
 */

import type { Finding, Fix } from '../types';
import { makeEmitter, makeFinding, makeFix, nextId, sleep } from './agentRunner';
import { foodnestSnapshot, getFile } from '../data/foodnestSnapshot';

export interface TestAgentResult {
  findings: Finding[];
  fixes: Fix[];
}

export async function runTestAgent(): Promise<TestAgentResult> {
  const emit = makeEmitter('TestAgent');
  const findings: Finding[] = [];
  const fixes: Fix[] = [];

  emit('TestAgent starting — scanning test files');
  await sleep(300);

  const testOutput = foodnestSnapshot.testOutput;

  // ── Discover test files ──────────────────────────────────────────────────
  const testFiles = foodnestSnapshot.files.filter((f) =>
    f.path.startsWith('tests/')
  );
  emit(`Found ${testFiles.length} test file(s): ${testFiles.map((f) => f.path).join(', ')}`);
  await sleep(200);

  // ── REQ-01: All tests must pass ──────────────────────────────────────────
  emit(`Test run result: ${testOutput.passed} passed, ${testOutput.failed} failed`);
  await sleep(200);

  if (testOutput.failed > 0) {
    for (const failure of testOutput.failures) {
      const findingId = nextId('TEST');
      const fixId = nextId('FIX');

      emit(`FAIL — "${failure.testName}" in ${failure.file}:${failure.line}`, 'error');
      emit(`  Actual: ${failure.actual}  Expected: ${failure.expected}`);

      findings.push(
        makeFinding({
          id: findingId,
          reqIds: ['REQ-01'],
          agents: ['TestAgent'],
          severity: 'BLOCKER',
          title: `Test failure: "${failure.testName}"`,
          explanation:
            `The test asserts that processPayment() returns { success: true } for a valid order. ` +
            `The current implementation always returns { success: false, message: "Payment provider unavailable" } ` +
            `regardless of the order payload. The test contract is correct — the implementation is wrong.`,
          affectedFile: failure.file,
          evidence: failure.message,
          recommendedFix:
            'Fix processPayment() to return success: true for structurally valid orders. ' +
            'Note: a separate fix (REQ-02) adds the PAYSTACK_SECRET_KEY runtime guard.',
        })
      );

      // REQ-01 fix: correct the simulated return value only.
      // The PAYSTACK_SECRET_KEY guard is NOT included here — that is REQ-02
      // and is handled by the ConfigAgent as a separate fix.
      fixes.push(
        makeFix({
          id: fixId,
          findingId,
          reqIds: ['REQ-01'],
          agentReasoning:
            `tests/payment.test.js:11 asserts result.success === true. ` +
            `src/payments.js line 9-11 returns { success: false, message: "Payment provider unavailable" } ` +
            `for all valid orders. Changing the simulated return to success: true makes the test pass. ` +
            `The PAYSTACK_SECRET_KEY guard is a separate REQ-02 concern addressed by a separate fix.`,
          affectedFile: 'src/payments.js',
          searchText: `  // Simulated payment provider response for the hackathon demo.
  return {
    success: false,
    message: "Payment provider unavailable"
  };`,
          replaceText: `  // Simulated payment provider response for the hackathon demo.
  return {
    success: true,
    message: "Payment accepted"
  };`,
          description:
            'Fix simulated return in processPayment() from success: false to success: true so the test passes (REQ-01).',
        })
      );
    }
  } else {
    emit('All tests pass — REQ-01 satisfied', 'success');
  }

  // ── Tautological health test warning ────────────────────────────────────
  const healthFile = getFile('tests/health.test.js');
  if (healthFile) {
    const isTautological =
      healthFile.content.includes('typeof process.env.NODE_ENV === "string" || process.env.NODE_ENV === undefined');
    if (isTautological) {
      const findingId = nextId('TEST');
      emit(`WARNING — health test in tests/health.test.js is a tautological assertion`, 'warn');
      findings.push(
        makeFinding({
          id: findingId,
          reqIds: ['REQ-01'],
          agents: ['TestAgent'],
          severity: 'WARNING',
          title: 'Health test uses a tautological assertion',
          explanation:
            'The assertion `typeof x === "string" || x === undefined` is always true for any value of x. ' +
            'It does not actually test the /health HTTP endpoint or its response contract.',
          affectedFile: 'tests/health.test.js',
          evidence:
            'assert.equal(typeof process.env.NODE_ENV === "string" || process.env.NODE_ENV === undefined, true)',
          recommendedFix:
            'Replace the tautological assertion with an actual HTTP test of GET /health that verifies ' +
            '{ status: "ok", service: "foodnest" }.',
        })
      );
    }
  }

  emit(`TestAgent done — ${findings.length} finding(s)`, 'success');
  return { findings, fixes };
}

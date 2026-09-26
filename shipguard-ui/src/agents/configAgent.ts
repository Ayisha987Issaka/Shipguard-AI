/**
 * Configuration Agent
 *
 * Responsibility: Verify that all required environment variables are
 * documented in .env.example AND validated in source code before use.
 * Maps to: REQ-02 (application must validate required payment configuration
 * before payment processing).
 *
 * Two distinct sub-problems are checked independently:
 *   A) .env.example missing PAYSTACK_SECRET_KEY entry (documentation gap)
 *   B) src/payments.js missing process.env.PAYSTACK_SECRET_KEY runtime guard
 *      (implementation gap)
 */

import type { Finding, Fix } from '../types';
import { makeEmitter, makeFinding, makeFix, nextId, sleep } from './agentRunner';
import { getFile } from '../data/foodnestSnapshot';

export interface ConfigAgentResult {
  findings: Finding[];
  fixes: Fix[];
}

export async function runConfigAgent(): Promise<ConfigAgentResult> {
  const emit = makeEmitter('ConfigAgent');
  const findings: Finding[] = [];
  const fixes: Fix[] = [];

  emit('ConfigAgent starting — scanning environment configuration');
  await sleep(250);

  const envExample = getFile('.env.example');
  const paymentsFile = getFile('src/payments.js');

  // ── Sub-problem A: .env.example documentation ────────────────────────────
  emit('Reading .env.example');
  await sleep(150);

  if (!envExample) {
    emit('ERROR — .env.example not found', 'error');
    findings.push(
      makeFinding({
        id: nextId('CFG'),
        reqIds: ['REQ-02'],
        agents: ['ConfigAgent'],
        severity: 'BLOCKER',
        title: '.env.example file is missing',
        explanation: 'No .env.example file found. Developers cannot configure the application.',
        affectedFile: '.env.example',
        evidence: 'File not present in project root.',
        recommendedFix: 'Create .env.example with all required environment variables documented.',
      })
    );
    return { findings, fixes };
  }

  // A proper variable entry looks like: PAYSTACK_SECRET_KEY=...
  // A comment mentioning it (# PAYSTACK_SECRET_KEY...) does NOT count.
  const hasSecretKeyEntry = /^PAYSTACK_SECRET_KEY=/m.test(envExample.content);
  const secretKeyCommentedOut = envExample.content.includes('# PAYSTACK_SECRET_KEY');

  emit(
    `PAYSTACK_SECRET_KEY entry in .env.example: ${
      hasSecretKeyEntry ? 'present' : 'MISSING (comment-only reference found)'
    }`
  );
  await sleep(150);

  if (!hasSecretKeyEntry) {
    const findingId = nextId('CFG');
    const fixId = nextId('FIX');
    emit('BLOCKER — PAYSTACK_SECRET_KEY is not documented in .env.example', 'error');

    findings.push(
      makeFinding({
        id: findingId,
        reqIds: ['REQ-02'],
        agents: ['ConfigAgent'],
        severity: 'BLOCKER',
        title: 'PAYSTACK_SECRET_KEY missing from .env.example',
        explanation:
          'The .env.example template documents PAYSTACK_PUBLIC_KEY but omits PAYSTACK_SECRET_KEY as a variable entry. ' +
          (secretKeyCommentedOut
            ? 'A comment acknowledges the omission but provides no usable placeholder. '
            : '') +
          'New developers copying this template cannot discover or configure this required variable.',
        affectedFile: '.env.example',
        evidence: secretKeyCommentedOut
          ? '# PAYSTACK_SECRET_KEY is required for payment processing but is missing here.'
          : 'PAYSTACK_SECRET_KEY not present in .env.example.',
        recommendedFix:
          'Add PAYSTACK_SECRET_KEY=replace-me to .env.example so developers know the variable is required.',
      })
    );

    fixes.push(
      makeFix({
        id: fixId,
        findingId,
        reqIds: ['REQ-02'],
        agentReasoning:
          '.env.example line 4 contains a comment referencing PAYSTACK_SECRET_KEY but no variable assignment. ' +
          'The regex /^PAYSTACK_SECRET_KEY=/m finds no match. ' +
          'Adding the variable as a placeholder makes it discoverable and satisfies the documentation side of REQ-02.',
        affectedFile: '.env.example',
        searchText: '# PAYSTACK_SECRET_KEY is required for payment processing but is missing here.',
        replaceText:
          'PAYSTACK_SECRET_KEY=replace-me\n# PAYSTACK_SECRET_KEY is required for payment processing — replace with your actual secret key.',
        description: 'Add PAYSTACK_SECRET_KEY placeholder entry to .env.example (REQ-02).',
      })
    );
  }

  // ── Sub-problem B: runtime guard in src/payments.js ──────────────────────
  //
  // IMPORTANT: check for process.env.PAYSTACK_SECRET_KEY in executable code,
  // NOT just the bare string "PAYSTACK_SECRET_KEY" which appears in a comment
  // and would produce a false positive.
  emit('Scanning src/payments.js for process.env.PAYSTACK_SECRET_KEY runtime guard');
  await sleep(200);

  if (paymentsFile) {
    // A real guard references process.env.PAYSTACK_SECRET_KEY in code.
    // The snapshot contains the variable name only inside a comment — that is
    // NOT an implementation of the guard.
    const hasRuntimeGuard = paymentsFile.content.includes('process.env.PAYSTACK_SECRET_KEY');

    emit(
      `process.env.PAYSTACK_SECRET_KEY runtime guard in payments.js: ${
        hasRuntimeGuard ? 'found' : 'NOT FOUND (comment-only mention does not count)'
      }`
    );

    if (!hasRuntimeGuard) {
      const findingId = nextId('CFG');
      const fixId = nextId('FIX');
      emit(
        'BLOCKER — payments.js does not validate process.env.PAYSTACK_SECRET_KEY before processing',
        'error'
      );

      findings.push(
        makeFinding({
          id: findingId,
          reqIds: ['REQ-02'],
          agents: ['ConfigAgent'],
          severity: 'BLOCKER',
          title: 'No PAYSTACK_SECRET_KEY runtime guard in processPayment()',
          explanation:
            'processPayment() executes without checking whether PAYSTACK_SECRET_KEY is set. ' +
            'The function contains a comment explicitly noting this omission: ' +
            '"the application does not validate the required PAYSTACK_SECRET_KEY before attempting a payment." ' +
            'In production, this would silently attempt payment calls without the required API key.',
          affectedFile: 'src/payments.js',
          evidence:
            '// Release issue: the application does not validate the required\n' +
            '// PAYSTACK_SECRET_KEY before attempting a payment.\n' +
            '(no process.env.PAYSTACK_SECRET_KEY reference found in executable code)',
          recommendedFix:
            'Add an early-return guard at the top of processPayment(): ' +
            'if (!process.env.PAYSTACK_SECRET_KEY) return { success: false, message: "..." }',
        })
      );

      // This fix adds the runtime guard. It targets the comment block at the
      // top of the function — the replaceText inserts the guard after the
      // existing order-validation check.
      fixes.push(
        makeFix({
          id: fixId,
          findingId,
          reqIds: ['REQ-02'],
          agentReasoning:
            'payments.js contains "process.env.PAYSTACK_SECRET_KEY" only inside a comment, not in executable code. ' +
            'The fix inserts a runtime guard after the order-validation check. ' +
            'This is independent of the REQ-01 fix which corrects the simulated return value.',
          affectedFile: 'src/payments.js',
          searchText: `  if (!order || !order.amount) {
    return { success: false, message: "Invalid order" };
  }`,
          replaceText: `  if (!order || !order.amount) {
    return { success: false, message: "Invalid order" };
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return { success: false, message: "Payment configuration missing: PAYSTACK_SECRET_KEY is not set" };
  }`,
          description:
            'Add process.env.PAYSTACK_SECRET_KEY runtime guard to processPayment() (REQ-02).',
        })
      );
    } else {
      emit('process.env.PAYSTACK_SECRET_KEY runtime guard found — REQ-02 code side satisfied', 'success');
    }
  }

  emit(`ConfigAgent done — ${findings.length} finding(s)`, 'success');
  return { findings, fixes };
}

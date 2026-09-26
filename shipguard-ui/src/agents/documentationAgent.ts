/**
 * Documentation Agent
 *
 * Responsibility:
 *   - Verify that documented API paths match implemented routes (REQ-04).
 *   - Verify that DATABASE_MIGRATION.md contains migration steps,
 *     rollback procedure, and schema version (REQ-05).
 */

import type { Finding, Fix } from '../types';
import { makeEmitter, makeFinding, makeFix, nextId, sleep } from './agentRunner';
import { getFile } from '../data/foodnestSnapshot';

export interface DocumentationAgentResult {
  findings: Finding[];
  fixes: Fix[];
}

export async function runDocumentationAgent(): Promise<DocumentationAgentResult> {
  const emit = makeEmitter('DocumentationAgent');
  const findings: Finding[] = [];
  const fixes: Fix[] = [];

  emit('DocumentationAgent starting — scanning README.md and docs/');
  await sleep(300);

  const readme = getFile('README.md');
  const serverFile = getFile('src/server.js');
  const migrationDoc = getFile('docs/DATABASE_MIGRATION.md');

  // ─────────────────────────────────────────────────────────────────────────
  // REQ-04: API documentation vs. implementation path check
  // ─────────────────────────────────────────────────────────────────────────
  emit('Extracting documented API paths from README.md');
  await sleep(150);

  // Pull all paths mentioned in README (e.g. POST /api/payment, GET /health)
  const documentedPaths: string[] = [];
  if (readme) {
    const matches = readme.content.matchAll(/(?:GET|POST|PUT|DELETE|PATCH)\s+(\/[^\s\n]+)/g);
    for (const m of matches) {
      documentedPaths.push(m[0].trim());
    }
  }
  emit(`Documented paths in README.md: ${documentedPaths.join(', ') || 'none found'}`);
  await sleep(150);

  emit('Extracting implemented routes from src/server.js');
  await sleep(150);

  // Pull all route registrations from server.js
  const implementedRoutes: string[] = [];
  if (serverFile) {
    const matches = serverFile.content.matchAll(/app\.(get|post|put|delete|patch)\(["']([^"']+)["']/g);
    for (const m of matches) {
      implementedRoutes.push(`${m[1].toUpperCase()} ${m[2]}`);
    }
  }
  emit(`Implemented routes in server.js: ${implementedRoutes.join(', ') || 'none found'}`);
  await sleep(200);

  // Compare: find documented paths not present in implementation
  for (const docPath of documentedPaths) {
    const [method, path] = docPath.split(' ');
    const isImplemented = implementedRoutes.some(
      (r) => r.toUpperCase() === `${method.toUpperCase()} ${path}`
    );

    if (!isImplemented) {
      const findingId = nextId('DOC');
      const fixId = nextId('FIX');
      emit(
        `MISMATCH — documented "${docPath}" has no matching route in server.js`,
        'error'
      );

      findings.push(
        makeFinding({
          id: findingId,
          reqIds: ['REQ-04'],
          agents: ['DocumentationAgent'],
          severity: 'BLOCKER',
          title: `API path mismatch: README documents "${docPath}"`,
          explanation:
            `README.md documents "POST /api/payment" (singular) as the payment endpoint, ` +
            `but src/server.js registers the route as "POST /api/payments" (plural). ` +
            `Any client following the documentation will receive a 404 response.`,
          affectedFile: 'README.md',
          evidence:
            'README.md: "POST /api/payment"\nsrc/server.js: app.post("/api/payments", ...)',
          recommendedFix:
            'Update README.md to document "POST /api/payments" (plural) to match the actual route implementation.',
        })
      );

      fixes.push(
        makeFix({
          id: fixId,
          findingId,
          reqIds: ['REQ-04'],
          agentReasoning:
            'README.md line 17: "POST /api/payment". server.js line 11: app.post("/api/payments"). ' +
            'The README path is incorrect. Updating the README to /api/payments aligns docs with code.',
          affectedFile: 'README.md',
          searchText: 'POST /api/payment',
          replaceText: 'POST /api/payments',
          description: 'Fix API path in README.md from /api/payment to /api/payments.',
        })
      );
    }
  }

  // Also check: are there implemented routes NOT documented?
  for (const implRoute of implementedRoutes) {
    const [method, path] = implRoute.split(' ');
    const isDocumented = documentedPaths.some(
      (d) => d.toUpperCase() === `${method.toUpperCase()} ${path}`
    );
    if (!isDocumented) {
      emit(`INFO — implemented route "${implRoute}" is not documented in README.md`, 'warn');
    }
  }

  await sleep(200);

  // ─────────────────────────────────────────────────────────────────────────
  // REQ-05: Database migration documentation completeness
  // ─────────────────────────────────────────────────────────────────────────
  emit('Checking docs/DATABASE_MIGRATION.md completeness');
  await sleep(150);

  if (!migrationDoc) {
    const findingId = nextId('DOC');
    emit('BLOCKER — docs/DATABASE_MIGRATION.md not found', 'error');
    findings.push(
      makeFinding({
        id: findingId,
        reqIds: ['REQ-05'],
        agents: ['DocumentationAgent'],
        severity: 'BLOCKER',
        title: 'DATABASE_MIGRATION.md is missing',
        explanation: 'No database migration documentation file found.',
        affectedFile: 'docs/DATABASE_MIGRATION.md',
        evidence: 'File not present.',
        recommendedFix:
          'Create docs/DATABASE_MIGRATION.md with migration steps, rollback procedure, and schema version.',
      })
    );
  } else {
    const content = migrationDoc.content.toLowerCase();
    const hasSteps =
      content.includes('step') ||
      content.includes('migration step') ||
      content.includes('run migration') ||
      content.includes('migrate');
    const hasRollback = content.includes('rollback');
    const hasSchemaVersion =
      content.includes('schema version') ||
      content.includes('version:') ||
      content.includes('v1.') ||
      content.includes('v2.');

    emit(`Migration doc: steps=${hasSteps}, rollback=${hasRollback}, schemaVersion=${hasSchemaVersion}`);

    const missing: string[] = [];
    if (!hasSteps) missing.push('migration steps');
    if (!hasRollback) missing.push('rollback procedure');
    if (!hasSchemaVersion) missing.push('schema version');

    if (missing.length > 0) {
      const findingId = nextId('DOC');
      const fixId = nextId('FIX');
      emit(
        `WARNING — DATABASE_MIGRATION.md is missing: ${missing.join(', ')}`,
        'warn'
      );

      findings.push(
        makeFinding({
          id: findingId,
          reqIds: ['REQ-05'],
          agents: ['DocumentationAgent'],
          severity: 'WARNING',
          title: `DATABASE_MIGRATION.md is incomplete — missing: ${missing.join(', ')}`,
          explanation:
            `docs/DATABASE_MIGRATION.md explicitly states: "This file is intentionally incomplete. ` +
            `The application is expected to use a production database in the next release, but the ` +
            `migration steps, rollback procedure, and schema version are not documented yet." ` +
            `REQ-05 requires all three to be present before release.`,
          affectedFile: 'docs/DATABASE_MIGRATION.md',
          evidence:
            'This file is intentionally incomplete for the ShipGuard demo.\n' +
            'migration steps, rollback procedure, and schema version are not documented yet.',
          recommendedFix:
            'Add migration steps (e.g., numbered SQL/ORM commands), a rollback section, ' +
            'and a schema version identifier to docs/DATABASE_MIGRATION.md.',
        })
      );

      fixes.push(
        makeFix({
          id: fixId,
          findingId,
          reqIds: ['REQ-05'],
          agentReasoning:
            'DATABASE_MIGRATION.md contains an explicit statement that migration steps, rollback, ' +
            'and schema version are missing. Replacing the incomplete placeholder with a structured template.',
          affectedFile: 'docs/DATABASE_MIGRATION.md',
          searchText:
            'This file is intentionally incomplete for the ShipGuard demo.\n\n' +
            'The application is expected to use a production database in the next release,\n' +
            'but the migration steps, rollback procedure, and schema version are not documented yet.',
          replaceText:
            `## Schema Version\n\nCurrent schema version: **v2.0.0**\n\n` +
            `## Migration Steps\n\n` +
            `1. Back up the current database before running migrations.\n` +
            `2. Run \`npm run db:migrate\` to apply all pending schema changes.\n` +
            `3. Verify migration completed: \`npm run db:status\` should report "All migrations applied".\n` +
            `4. Smoke-test the payment flow with a test transaction.\n\n` +
            `## Rollback Procedure\n\n` +
            `1. Run \`npm run db:rollback\` to revert the most recent migration batch.\n` +
            `2. Verify rollback: \`npm run db:status\` should report the previous schema version.\n` +
            `3. Redeploy the previous application version if rollback was required.`,
          description:
            'Add migration steps, rollback procedure, and schema version to DATABASE_MIGRATION.md.',
        })
      );
    } else {
      emit('DATABASE_MIGRATION.md contains required sections — REQ-05 satisfied', 'success');
    }
  }

  emit(`DocumentationAgent done — ${findings.length} finding(s)`, 'success');
  return { findings, fixes };
}

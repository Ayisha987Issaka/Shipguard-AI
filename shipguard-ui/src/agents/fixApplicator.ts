/**
 * Fix Applicator
 *
 * Applies developer-approved fixes to the in-memory project snapshot.
 * In the hackathon demo, "applying" a fix means:
 *   1. Updating the foodnestSnapshot in-memory so subsequent verification
 *      agents see the corrected content.
 *   2. Recording the before/after in the store (AppliedFix).
 *
 * The developer must explicitly approve each fix before this runs.
 * This module never modifies files without explicit approval.
 */

import type { Fix, AgentName } from '../types';
import { useAuditStore } from '../store/auditStore';
import { foodnestSnapshot } from '../data/foodnestSnapshot';
import { runVerification } from '../agents/mainReleaseAgent';
import { sleep } from '../agents/agentRunner';

// ─── Apply a single fix to the in-memory snapshot ────────────────────────────

function applyFixToSnapshot(fix: Fix): { success: boolean; before: string; after: string; error?: string } {
  const file = foodnestSnapshot.files.find((f) => f.path === fix.affectedFile);
  if (!file) {
    return {
      success: false,
      before: '',
      after: '',
      error: `File not found in snapshot: ${fix.affectedFile}`,
    };
  }

  const before = file.content;

  if (!before.includes(fix.searchText)) {
    return {
      success: false,
      before,
      after: before,
      error: `Search text not found in ${fix.affectedFile}. The file may have already been modified.`,
    };
  }

  const after = before.replace(fix.searchText, fix.replaceText);
  file.content = after; // mutate the snapshot in-place

  return { success: true, before, after };
}

// ─── Determine which agents to re-run based on affected files ─────────────────

function agentsForFile(filePath: string): AgentName[] {
  const agents: AgentName[] = [];

  if (filePath === 'src/payments.js') {
    agents.push('TestAgent', 'ConfigAgent');
  }
  if (filePath === '.env.example') {
    agents.push('ConfigAgent');
  }
  if (filePath === 'Dockerfile') {
    agents.push('DeploymentAgent', 'DependencyAgent');
  }
  if (filePath === 'README.md') {
    agents.push('DocumentationAgent', 'DependencyAgent');
  }
  if (filePath === 'docs/DATABASE_MIGRATION.md') {
    agents.push('DocumentationAgent');
  }

  return agents;
}

// ─── Main: apply all approved fixes then trigger verification ─────────────────

export async function applyApprovedFixes(): Promise<void> {
  const store = useAuditStore.getState();
  const { fixes, approvals } = store;

  store.setPhase('applying');

  const approvedFixes = fixes.filter(
    (f) => approvals[f.id]?.decision === 'approved'
  );

  if (approvedFixes.length === 0) {
    console.warn('applyApprovedFixes called with no approved fixes');
    store.setPhase('awaiting-approval');
    return;
  }

  const affectedAgentSet = new Set<AgentName>();

  for (const fix of approvedFixes) {
    await sleep(300); // visible pacing for the demo

    const { success, before, after, error } = applyFixToSnapshot(fix);

    store.recordAppliedFix({
      fixId: fix.id,
      affectedFile: fix.affectedFile,
      appliedAt: Date.now(),
      beforeContent: before,
      afterContent: after,
      success,
      errorMessage: error,
    });

    if (success) {
      // Collect agents to re-run
      for (const agent of agentsForFile(fix.affectedFile)) {
        affectedAgentSet.add(agent);
      }
    }
  }

  const affectedAgents = [...affectedAgentSet];

  if (affectedAgents.length > 0) {
    await runVerification(affectedAgents);
  } else {
    store.setPhase('complete');
    store.setAuditFinished();
  }
}

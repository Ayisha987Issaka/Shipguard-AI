import { useState } from 'react';
import { useAuditStore } from '../store/auditStore';
import type { Fix } from '../types';
import { severityClass } from '../utils/display';
import { applyApprovedFixes } from '../agents/fixApplicator';

export default function FixPlanPage() {
  const phase = useAuditStore((s) => s.phase);
  const fixes = useAuditStore((s) => s.fixes);
  const findings = useAuditStore((s) => s.findings);
  const approvals = useAuditStore((s) => s.approvals);
  const appliedFixes = useAuditStore((s) => s.appliedFixes);
  const setApproval = useAuditStore((s) => s.setApproval);
  const approveAll = useAuditStore((s) => s.approveAll);

  const [applying, setApplying] = useState(false);

  const approvedCount = fixes.filter(
    (f) => approvals[f.id]?.decision === 'approved'
  ).length;

  const isAwaitingApproval = phase === 'awaiting-approval';
  const isApplying = phase === 'applying' || applying;
  const isComplete = phase === 'complete' || phase === 'verifying';

  async function handleApply() {
    setApplying(true);
    await applyApprovedFixes();
    setApplying(false);
  }

  if (phase === 'idle') {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✎</div>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>No fix plan yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Run a release audit to generate proposed fixes.</div>
        </div>
      </div>
    );
  }

  if (fixes.length === 0 && phase !== 'running') {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
          <div style={{ fontWeight: 600, color: 'var(--pass)' }}>No fixes required</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>All release requirements are satisfied.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="row-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Fix Plan</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            Review and approve each proposed fix. Fixes are only applied after your explicit approval.
          </p>
        </div>
        <div className="row">
          {isAwaitingApproval && (
            <button className="btn-outline" onClick={approveAll}>
              Approve All
            </button>
          )}
          <button
            className="btn-primary"
            disabled={approvedCount === 0 || isApplying || !isAwaitingApproval}
            onClick={handleApply}
            style={{ minWidth: 180 }}
          >
            {isApplying
              ? '⟳ Applying…'
              : `Apply ${approvedCount} Approved Fix${approvedCount !== 1 ? 'es' : ''}`}
          </button>
        </div>
      </div>

      {/* Approval summary bar */}
      {fixes.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          gap: 16,
          fontSize: 13,
          alignItems: 'center',
        }}>
          <span>
            <strong>{fixes.length}</strong> proposed fix{fixes.length !== 1 ? 'es' : ''}
          </span>
          <span style={{ color: 'var(--pass)', fontWeight: 600 }}>
            {approvedCount} approved
          </span>
          <span style={{ color: 'var(--blocker)', fontWeight: 600 }}>
            {fixes.filter((f) => approvals[f.id]?.decision === 'rejected').length} rejected
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            {fixes.filter((f) => !approvals[f.id] || approvals[f.id].decision === 'pending').length} pending
          </span>
          {!isAwaitingApproval && (
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}>
              {isComplete ? 'Fixes applied — see Release Gate for verdict' : 'Audit running…'}
            </span>
          )}
        </div>
      )}

      {/* Fix cards */}
      {fixes.map((fix) => {
        const finding = findings.find((f) => f.id === fix.findingId);
        const decision = approvals[fix.id]?.decision ?? 'pending';
        const applied = appliedFixes.find((af) => af.fixId === fix.id);

        return (
          <FixCard
            key={fix.id}
            fix={fix}
            decision={decision}
            applied={applied}
            findingSeverity={finding?.severity}
            editable={isAwaitingApproval}
            onApprove={() => setApproval(fix.id, 'approved')}
            onReject={() => setApproval(fix.id, 'rejected')}
            onDefer={() => setApproval(fix.id, 'deferred')}
          />
        );
      })}
    </div>
  );
}

function FixCard({
  fix,
  decision,
  applied,
  findingSeverity,
  editable,
  onApprove,
  onReject,
  onDefer,
}: {
  fix: Fix;
  decision: string;
  applied: { success: boolean; beforeContent: string; afterContent: string; errorMessage?: string } | undefined;
  findingSeverity: string | undefined;
  editable: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDefer: () => void;
}) {
  const [showReasoning, setShowReasoning] = useState(false);

  const borderColor =
    decision === 'approved' ? 'var(--pass)'
    : decision === 'rejected' ? 'var(--blocker)'
    : decision === 'deferred' ? 'var(--warning)'
    : 'var(--border)';

  return (
    <div style={{
      background: 'var(--bg)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius)',
      marginBottom: 14,
      boxShadow: 'var(--shadow)',
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <div>
          <div className="row" style={{ gap: 6, marginBottom: 4 }}>
            <span className="text-mono" style={{ fontWeight: 700, fontSize: 12 }}>{fix.id}</span>
            {findingSeverity && (
              <span className={severityClass(findingSeverity as any)}>{findingSeverity}</span>
            )}
            {fix.reqIds.map((r) => (
              <span key={r} style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 999,
                background: 'var(--surface-2)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}>{r}</span>
            ))}
          </div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{fix.description}</div>
          <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
            File: <span className="text-mono">{fix.affectedFile}</span>
          </div>
        </div>

        {/* Decision badge */}
        <DecisionBadge decision={decision} />
      </div>

      {/* Diff viewer */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
          Proposed Change
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--blocker)', fontWeight: 600, marginBottom: 3 }}>− BEFORE</div>
            <div className="code-block diff-before">{fix.searchText}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--pass)', fontWeight: 600, marginBottom: 3 }}>+ AFTER</div>
            <div className="code-block diff-after">{fix.replaceText}</div>
          </div>
        </div>

        {/* Agent reasoning (expandable) */}
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setShowReasoning((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 12,
              color: 'var(--accent)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {showReasoning ? '▾ Hide' : '▸ Show'} agent reasoning (IBM Bob)
          </button>
          {showReasoning && (
            <div style={{
              marginTop: 6,
              padding: '8px 12px',
              background: '#f0f6ff',
              border: '1px solid #bfd4f7',
              borderRadius: 'var(--radius)',
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--text)',
            }}>
              {fix.agentReasoning}
            </div>
          )}
        </div>

        {/* Applied result */}
        {applied && (
          <div style={{
            marginTop: 10,
            padding: '8px 12px',
            background: applied.success ? 'var(--pass-bg)' : 'var(--blocker-bg)',
            border: `1px solid ${applied.success ? '#a7f3c0' : '#ffc8c8'}`,
            borderRadius: 'var(--radius)',
            fontSize: 12,
          }}>
            {applied.success
              ? '✓ Fix applied successfully'
              : `✗ Fix failed: ${applied.errorMessage}`}
          </div>
        )}

        {/* Approval controls */}
        {editable && (
          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            <button
              className={decision === 'approved' ? 'btn-primary' : 'btn-outline'}
              onClick={onApprove}
            >
              {decision === 'approved' ? '✓ Approved' : 'Approve'}
            </button>
            <button
              className="btn-outline"
              onClick={onReject}
              style={{ color: decision === 'rejected' ? 'var(--blocker)' : undefined }}
            >
              {decision === 'rejected' ? '✗ Rejected' : 'Reject'}
            </button>
            <button
              className="btn-outline"
              onClick={onDefer}
              style={{ color: decision === 'deferred' ? 'var(--warning)' : undefined }}
            >
              Defer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const config: Record<string, { label: string; color: string; bg: string; border: string }> = {
    approved: { label: '✓ Approved', color: 'var(--pass)', bg: 'var(--pass-bg)', border: '#a7f3c0' },
    rejected: { label: '✗ Rejected', color: 'var(--blocker)', bg: 'var(--blocker-bg)', border: '#ffc8c8' },
    deferred: { label: '⏸ Deferred', color: 'var(--warning)', bg: 'var(--warning-bg)', border: '#ffe58f' },
    pending:  { label: 'Pending',    color: 'var(--text-muted)', bg: 'var(--surface)', border: 'var(--border)' },
  };
  const c = config[decision] ?? config.pending;
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: 999,
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {c.label}
    </span>
  );
}

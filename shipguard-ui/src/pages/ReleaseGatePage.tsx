import { type CSSProperties } from 'react';
import { useAuditStore } from '../store/auditStore';
import { reqStatusClass, verifClass, formatTime } from '../utils/display';

export default function ReleaseGatePage() {
  const gate = useAuditStore((s) => s.gate);
  const phase = useAuditStore((s) => s.phase);
  const requirements = useAuditStore((s) => s.requirements);
  const findings = useAuditStore((s) => s.findings);
  const appliedFixes = useAuditStore((s) => s.appliedFixes);
  const fixes = useAuditStore((s) => s.fixes);
  const auditStartedAt = useAuditStore((s) => s.auditStartedAt);

  if (phase === 'idle') {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⊛</div>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>No release gate evaluation yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Run an audit, review findings, apply approved fixes, and the gate will appear here.
          </div>
        </div>
      </div>
    );
  }

  const blockers = findings.filter((f) => f.severity === 'BLOCKER');
  const warnings = findings.filter((f) => f.severity === 'WARNING');
  const unresolvedBlockers = blockers.filter((f) => f.verificationStatus !== 'PASS');
  const unresolvedWarnings = warnings.filter((f) => f.verificationStatus !== 'PASS');

  const isVerifying = phase === 'verifying';
  const isApplying = phase === 'applying';

  return (
    <div className="page">
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Release Gate</h1>
      <p className="text-muted" style={{ marginBottom: 24, fontSize: 13 }}>
        Final release decision for <strong>FoodNest v2.0</strong>
        {auditStartedAt && <> · Audit started {formatTime(auditStartedAt)}</>}
      </p>

      {/* Gate verdict banner */}
      {isApplying || isVerifying ? (
        <div style={{
          padding: '24px 28px',
          borderRadius: 8,
          background: '#e8f0fe',
          border: '1px solid var(--accent)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <span style={{ fontSize: 36 }}>⟳</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>
              {isApplying ? 'Applying fixes…' : 'Verification running…'}
            </div>
            <div className="text-muted" style={{ marginTop: 4 }}>
              IBM Bob is re-running affected agents to verify the applied fixes.
            </div>
          </div>
        </div>
      ) : gate ? (
        <div style={{
          padding: '24px 28px',
          borderRadius: 8,
          background: gate === 'READY' ? 'var(--pass-bg)' : 'var(--blocker-bg)',
          border: `2px solid ${gate === 'READY' ? 'var(--pass)' : 'var(--blocker)'}`,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <span style={{ fontSize: 42 }}>{gate === 'READY' ? '✅' : '🚫'}</span>
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: 22,
              color: gate === 'READY' ? 'var(--ready)' : 'var(--blocked)',
              letterSpacing: '-0.5px',
            }}>
              {gate === 'READY'
                ? 'READY TO SHIP'
                : gate === 'BLOCKED_WITH_WARNINGS'
                ? 'BLOCKED — Warnings remain'
                : 'BLOCKED'}
            </div>
            <div style={{ marginTop: 6, color: 'var(--text)', fontSize: 14 }}>
              {gate === 'READY'
                ? 'All release requirements satisfied. The application is cleared for deployment.'
                : `${unresolvedBlockers.length} blocker(s) and ${unresolvedWarnings.length} warning(s) remain unresolved.`}
            </div>
            {gate === 'BLOCKED_WITH_WARNINGS' && (
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--warning)' }}>
                All blockers resolved. Warnings require acknowledgment before shipping.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 24, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Gate evaluation pending — complete the audit and apply fixes.
        </div>
      )}

      {/* Requirement-by-requirement status */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">Requirements Status (REQ-01 → REQ-06)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11 }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Requirement</th>
              <th style={thStyle}>Priority</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Findings</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => {
              const related = findings.filter((f) => f.reqIds.includes(req.id));
              return (
                <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{req.id}</span>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 320 }}>{req.description}</td>
                  <td style={tdStyle}>
                    <span className={`badge ${req.priority === 'Critical' ? 'badge-blocker' : req.priority === 'High' ? 'badge-warning' : 'badge-info'}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span className={reqStatusClass(req.status)}>{req.status}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {related.length > 0
                        ? related.map((f) => (
                          <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginRight: 4 }}>
                            <span className={`badge ${f.severity === 'BLOCKER' ? 'badge-blocker' : f.severity === 'WARNING' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: 9 }}>
                              {f.severity}
                            </span>
                            <span className={verifClass(f.verificationStatus)} style={{ fontSize: 9 }}>
                              {f.verificationStatus}
                            </span>
                          </span>
                        ))
                        : <span style={{ color: 'var(--pass)', fontWeight: 600, fontSize: 12 }}>✓ No issues</span>}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Applied fixes log */}
      {appliedFixes.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Applied Fixes Log</div>
          {appliedFixes.map((af) => {
            const fix = fixes.find((f) => f.id === af.fixId);
            return (
              <div key={af.fixId} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
              }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>
                  {af.success ? '✓' : '✗'}
                </span>
                <div>
                  <span className="text-mono" style={{ fontWeight: 600 }}>{af.fixId}</span>
                  {' — '}
                  <span className="text-mono">{af.affectedFile}</span>
                  {fix && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{fix.description}</span>}
                </div>
                <span className="text-muted" style={{ marginLeft: 'auto', fontSize: 11, flexShrink: 0 }}>
                  {formatTime(af.appliedAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* REQ-06 compliance note */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontSize: 12,
        color: 'var(--text-muted)',
      }}>
        <strong>REQ-06:</strong> This report lists {blockers.length} BLOCKER(s) separately from {warnings.length} WARNING(s).
        BLOCKERs are shown first throughout all tabs. Requirement satisfied by ShipGuard AI output structure.
      </div>
    </div>
  );
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  fontWeight: 600,
  fontSize: 11,
};

const tdStyle: CSSProperties = {
  padding: '8px 10px',
  verticalAlign: 'top',
};

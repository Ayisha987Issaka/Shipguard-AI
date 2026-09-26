import { useAuditStore, selectBlockers, selectWarnings, selectPassedRequirements } from '../store/auditStore';
import { reqStatusClass, formatDuration, formatTime } from '../utils/display';
import { runReleaseAudit } from '../agents/mainReleaseAgent';

export default function OverviewPage() {
  const phase = useAuditStore((s) => s.phase);
  const requirements = useAuditStore((s) => s.requirements);
  const findings = useAuditStore((s) => s.findings);
  const agentRuns = useAuditStore((s) => s.agentRuns);
  const auditStartedAt = useAuditStore((s) => s.auditStartedAt);
  const auditFinishedAt = useAuditStore((s) => s.auditFinishedAt);
  const gate = useAuditStore((s) => s.gate);
  const resetAudit = useAuditStore((s) => s.resetAudit);

  const blockers = selectBlockers({ findings } as any);
  const warnings = selectWarnings({ findings } as any);
  const passed = selectPassedRequirements({ requirements } as any);

  const duration =
    auditStartedAt && auditFinishedAt
      ? formatDuration(auditFinishedAt - auditStartedAt)
      : null;

  const isRunning = phase === 'running' || phase === 'applying' || phase === 'verifying';

  async function handleStart() {
    resetAudit();
    // Small tick to let state settle before agents start writing to it
    await new Promise((r) => setTimeout(r, 50));
    runReleaseAudit();
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="row-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Release Readiness Dashboard</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            Project: <strong>FoodNest v2.0</strong>
            {auditStartedAt && (
              <> &nbsp;·&nbsp; Started {formatTime(auditStartedAt)}</>
            )}
            {duration && <> &nbsp;·&nbsp; Duration: {duration}</>}
          </p>
        </div>
        <div className="row">
          {phase !== 'idle' && (
            <button className="btn-outline" onClick={resetAudit} disabled={isRunning}>
              Reset
            </button>
          )}
          <button
            className="btn-primary"
            onClick={handleStart}
            disabled={isRunning}
          >
            {isRunning ? '⟳ Running…' : phase === 'idle' ? '▶ Run Release Audit' : '↺ Re-run Audit'}
          </button>
        </div>
      </div>

      {/* Gate banner */}
      {gate && (
        <div style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius)',
          marginBottom: 20,
          background: gate === 'READY' ? 'var(--pass-bg)' : 'var(--blocker-bg)',
          border: `1px solid ${gate === 'READY' ? '#a7f3c0' : '#ffc8c8'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>{gate === 'READY' ? '✅' : '🚫'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: gate === 'READY' ? 'var(--ready)' : 'var(--blocked)' }}>
              {gate === 'READY'
                ? 'READY TO SHIP'
                : gate === 'BLOCKED_WITH_WARNINGS'
                ? 'BLOCKED — Warnings remain'
                : 'BLOCKED — Resolve all blockers before release'}
            </div>
            <div className="text-muted" style={{ marginTop: 2 }}>
              {gate === 'READY'
                ? 'All release requirements satisfied. The application is cleared for deployment.'
                : `${blockers.length} blocker(s) must be resolved. See Findings and Fix Plan tabs.`}
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <SummaryCard label="Blockers" value={blockers.length} color="var(--blocker)" bg="var(--blocker-bg)" />
        <SummaryCard label="Warnings" value={warnings.length} color="var(--warning)" bg="var(--warning-bg)" />
        <SummaryCard label="Reqs Passed" value={passed.length} suffix={`/ ${requirements.length}`} color="var(--pass)" bg="var(--pass-bg)" />
        <SummaryCard label="Total Findings" value={findings.length} color="var(--text-muted)" bg="var(--surface)" />
      </div>

      {/* Requirements status */}
      {requirements.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">Requirements Status (from release-requirements.pdf)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12 }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>ID</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Requirement</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Priority</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {req.id}
                  </td>
                  <td style={{ padding: '8px', color: 'var(--text)' }}>{req.description}</td>
                  <td style={{ padding: '8px' }}>
                    <span className={`badge ${req.priority === 'Critical' ? 'badge-blocker' : req.priority === 'High' ? 'badge-warning' : 'badge-info'}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span className={reqStatusClass(req.status)}>{req.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Agent timeline */}
      {phase !== 'idle' && (
        <div className="card">
          <div className="section-title">Agent Activity</div>
          <div className="col">
            {Object.values(agentRuns).map((run) => {
              const dur = run.startedAt && run.finishedAt
                ? formatDuration(run.finishedAt - run.startedAt)
                : run.status === 'RUNNING' ? 'running…' : '—';
              return (
                <div key={run.agent} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 14 }}>
                    {run.status === 'RUNNING' ? '⟳'
                      : run.status === 'DONE' ? '✓'
                      : run.status === 'ERROR' ? '✗'
                      : '○'}
                  </span>
                  <span style={{
                    width: 180,
                    fontWeight: 500,
                    color: run.status === 'IDLE' ? 'var(--text-muted)' : 'var(--text)',
                  }}>
                    {run.agent}
                  </span>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: run.status === 'RUNNING' ? '#e8f0fe'
                      : run.status === 'DONE' ? 'var(--pass-bg)'
                      : run.status === 'ERROR' ? 'var(--blocker-bg)'
                      : 'var(--surface)',
                    color: run.status === 'RUNNING' ? 'var(--accent)'
                      : run.status === 'DONE' ? 'var(--pass)'
                      : run.status === 'ERROR' ? 'var(--blocker)'
                      : 'var(--text-muted)',
                    fontWeight: 600,
                  }}>
                    {run.status}
                  </span>
                  <span className="text-muted" style={{ marginLeft: 'auto' }}>{dur}</span>
                  <span className="text-muted" style={{ fontSize: 11 }}>
                    {run.findingIds.length > 0 ? `${run.findingIds.length} finding(s)` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Idle state */}
      {phase === 'idle' && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
            No audit has been run yet
          </div>
          <div style={{ fontSize: 13 }}>
            Click <strong>Run Release Audit</strong> to start the parallel agent analysis.
          </div>
          <div style={{ marginTop: 8, fontSize: 12 }}>
            IBM Bob will spawn 5 specialist agents simultaneously — Test, Configuration,
            Dependency, Documentation, and Deployment.
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  suffix,
  color,
  bg,
}: {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  bg: string;
}) {
  return (
    <div style={{
      background: bg,
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px 20px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4 }}>
        {value}
        {suffix && <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>{suffix}</span>}
      </div>
    </div>
  );
}

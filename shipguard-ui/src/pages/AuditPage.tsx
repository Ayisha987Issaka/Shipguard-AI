import { useRef, useEffect } from 'react';
import { useAuditStore } from '../store/auditStore';
import type { AgentRun } from '../types';
import { formatDuration, formatTime } from '../utils/display';
import { runReleaseAudit } from '../agents/mainReleaseAgent';

const AGENT_DESCRIPTIONS: Record<string, string> = {
  TestAgent: 'Inspects test files, parses test run output, maps failures to REQ-01.',
  ConfigAgent: 'Scans .env.example and source for missing/unvalidated env vars (REQ-02).',
  DependencyAgent: 'Cross-checks Node.js version across package.json, Dockerfile, README (REQ-03).',
  DocumentationAgent: 'Compares documented API paths vs. implemented routes; checks migration docs (REQ-04, REQ-05).',
  DeploymentAgent: 'Validates Dockerfile base image, .dockerignore, EXPOSE/port alignment (REQ-03).',
  MainReleaseAgent: 'Orchestrates parallel agents, consolidates findings, classifies BLOCKER/WARNING, generates fix plan (REQ-06).',
};

export default function AuditPage() {
  const phase = useAuditStore((s) => s.phase);
  const agentRuns = useAuditStore((s) => s.agentRuns);
  const resetAudit = useAuditStore((s) => s.resetAudit);

  const isRunning = phase === 'running' || phase === 'verifying' || phase === 'applying';

  async function handleStart() {
    resetAudit();
    await new Promise((r) => setTimeout(r, 50));
    runReleaseAudit();
  }

  const specialists = Object.values(agentRuns).filter(
    (r) => r.agent !== 'MainReleaseAgent'
  );
  const mainAgent = agentRuns.MainReleaseAgent;

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Audit — Agent Execution</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            IBM Bob spawns 5 specialist agents simultaneously. All independent checks run in parallel.
          </p>
        </div>
        <div className="row">
          {phase !== 'idle' && (
            <button className="btn-outline" onClick={resetAudit} disabled={isRunning}>Reset</button>
          )}
          <button className="btn-primary" onClick={handleStart} disabled={isRunning}>
            {isRunning ? '⟳ Running…' : '▶ Start Audit'}
          </button>
        </div>
      </div>

      {/* Phase indicator */}
      {phase !== 'idle' && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '8px 16px',
          marginBottom: 16,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 11, color: 'var(--text-muted)' }}>
            Phase:
          </span>
          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{phase.toUpperCase()}</span>
        </div>
      )}

      {/* Parallel agent grid */}
      {phase !== 'idle' && (
        <>
          <div className="section-title" style={{ marginBottom: 10 }}>
            Parallel Specialist Agents (5 simultaneous)
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}>
            {specialists.map((run) => (
              <AgentCard key={run.agent} run={run} />
            ))}
          </div>

          {/* Main Release Agent */}
          <div className="section-title" style={{ marginBottom: 10 }}>
            Main Release Agent (Orchestrator)
          </div>
          <AgentCard run={mainAgent} expanded />
        </>
      )}

      {phase === 'idle' && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
            No audit running
          </div>
          <div style={{ fontSize: 13 }}>
            Click <strong>Start Audit</strong> to spawn all 5 specialist agents in parallel.
          </div>
        </div>
      )}
    </div>
  );
}

function AgentCard({ run, expanded = false }: { run: AgentRun; expanded?: boolean }) {
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log to bottom when new entries arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [run.logs.length]);

  const dur = run.startedAt && run.finishedAt
    ? formatDuration(run.finishedAt - run.startedAt)
    : run.status === 'RUNNING' ? 'running…' : null;

  const statusColor =
    run.status === 'RUNNING' ? 'var(--accent)'
    : run.status === 'DONE' ? 'var(--pass)'
    : run.status === 'ERROR' ? 'var(--blocker)'
    : 'var(--text-muted)';

  const statusBg =
    run.status === 'RUNNING' ? '#e8f0fe'
    : run.status === 'DONE' ? 'var(--pass-bg)'
    : run.status === 'ERROR' ? 'var(--blocker-bg)'
    : 'var(--surface)';

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
      boxShadow: 'var(--shadow)',
    }}>
      {/* Header */}
      <div className="row-between" style={{ marginBottom: 8 }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{run.agent}</span>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {AGENT_DESCRIPTIONS[run.agent]}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0, marginLeft: 8 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 999,
            background: statusBg,
            color: statusColor,
          }}>
            {run.status === 'RUNNING' ? '⟳ ' : run.status === 'DONE' ? '✓ ' : run.status === 'ERROR' ? '✗ ' : ''}
            {run.status}
          </span>
          {dur && <span className="text-muted">{dur}</span>}
        </div>
      </div>

      {/* Meta */}
      {run.startedAt && (
        <div className="text-muted" style={{ marginBottom: 6, fontSize: 11 }}>
          Started {formatTime(run.startedAt)}
          {run.findingIds.length > 0 && (
            <span style={{ marginLeft: 8, fontWeight: 600, color: 'var(--text)' }}>
              {run.findingIds.length} finding(s)
            </span>
          )}
        </div>
      )}

      {/* Log stream */}
      {run.logs.length > 0 && (
        <div
          ref={logRef}
          style={{
            background: '#1e1e2e',
            borderRadius: 4,
            padding: '8px 10px',
            maxHeight: expanded ? 280 : 160,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          {run.logs.map((entry, i) => (
            <div key={i} style={{
              color: entry.level === 'error' ? '#ff7b7b'
                : entry.level === 'warn' ? '#ffd966'
                : entry.level === 'success' ? '#7ce38b'
                : '#c9d1d9',
            }}>
              <span style={{ color: '#666', marginRight: 6 }}>
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              {entry.message}
            </div>
          ))}
          {run.status === 'RUNNING' && (
            <div style={{ color: '#888', animation: 'pulse 1s infinite' }}>▊</div>
          )}
        </div>
      )}
    </div>
  );
}

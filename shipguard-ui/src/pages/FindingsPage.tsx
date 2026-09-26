import { useState, type CSSProperties, type ReactNode } from 'react';
import { useAuditStore } from '../store/auditStore';
import type { Finding } from '../types';
import { severityClass, verifClass } from '../utils/display';

export default function FindingsPage() {
  const findings = useAuditStore((s) => s.findings);
  const phase = useAuditStore((s) => s.phase);

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [reqFilter, setReqFilter] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allReqIds = [...new Set(findings.flatMap((f) => f.reqIds))].sort();

  const filtered = findings.filter((f) => {
    const matchSev = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchReq = reqFilter === 'ALL' || f.reqIds.includes(reqFilter);
    return matchSev && matchReq;
  });

  // Blockers first, then warnings, then info
  const sorted = [...filtered].sort((a, b) => {
    const rank: Record<string, number> = { BLOCKER: 0, WARNING: 1, INFO: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  const selected = findings.find((f) => f.id === selectedId) ?? null;

  if (phase === 'idle') {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚑</div>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>No findings yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Run a release audit from the Overview tab.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* Left: table */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>
            Findings
            <span className="text-muted" style={{ fontWeight: 400, fontSize: 14, marginLeft: 8 }}>
              {sorted.length} of {findings.length}
            </span>
          </h1>
          <div className="row">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="ALL">All Severities</option>
              <option value="BLOCKER">🔴 BLOCKER</option>
              <option value="WARNING">⚠️ WARNING</option>
              <option value="INFO">ℹ️ INFO</option>
            </select>
            <select
              value={reqFilter}
              onChange={(e) => setReqFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="ALL">All Requirements</option>
              {allReqIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            No findings match the current filter.
          </div>
        ) : (
          <div>
            {sorted.map((finding) => (
              <FindingRow
                key={finding.id}
                finding={finding}
                selected={finding.id === selectedId}
                onClick={() =>
                  setSelectedId(finding.id === selectedId ? null : finding.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Right: detail drawer */}
      {selected && (
        <div style={{
          width: 380,
          flexShrink: 0,
          position: 'sticky',
          top: 70,
        }}>
          <FindingDetail finding={selected} onClose={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}

function FindingRow({
  finding,
  selected,
  onClick,
}: {
  finding: Finding;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? '#f0f6ff' : 'var(--bg)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '12px 16px',
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'background 0.1s, border 0.1s',
      }}
    >
      <div className="row-between">
        <div className="row" style={{ gap: 8, flex: 1, minWidth: 0 }}>
          <span className={severityClass(finding.severity)}>{finding.severity}</span>
          <span style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {finding.title}
          </span>
        </div>
        <div className="row" style={{ gap: 6, flexShrink: 0, marginLeft: 8 }}>
          {finding.reqIds.map((r) => (
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
          <span className={verifClass(finding.verificationStatus)} style={{ fontSize: 10 }}>
            {finding.verificationStatus}
          </span>
        </div>
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
        <span className="text-mono">{finding.affectedFile}</span>
        &nbsp;·&nbsp;
        <span>{finding.agents.join(', ')}</span>
      </div>
    </div>
  );
}

function FindingDetail({ finding, onClose }: { finding: Finding; onClose: () => void }) {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    }}>
      {/* Drawer header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
        background: 'var(--surface)',
      }}>
        <div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
            <span className={severityClass(finding.severity)}>{finding.severity}</span>
            {finding.reqIds.map((r) => (
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
          <div style={{ fontWeight: 600, fontSize: 13 }}>{finding.title}</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '14px 16px', maxHeight: '75vh', overflowY: 'auto' }}>
        {/* Explanation */}
        <Section label="Explanation">
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>{finding.explanation}</p>
        </Section>

        {/* Affected file */}
        <Section label="Affected File">
          <span className="text-mono">{finding.affectedFile}</span>
        </Section>

        {/* Evidence */}
        <Section label="Evidence (from file)">
          <div className="code-block">{finding.evidence}</div>
        </Section>

        {/* Recommended fix */}
        <Section label="Recommended Fix">
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>{finding.recommendedFix}</p>
        </Section>

        {/* Agents */}
        <Section label="Identified By">
          <div className="row">
            {finding.agents.map((a) => (
              <span key={a} style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                background: '#e8f0fe',
                color: 'var(--accent)',
                fontWeight: 600,
              }}>{a}</span>
            ))}
          </div>
        </Section>

        {/* Verification */}
        <Section label="Verification Status">
          <span className={verifClass(finding.verificationStatus)}>
            {finding.verificationStatus}
          </span>
        </Section>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 4,
      }}>{label}</div>
      {children}
    </div>
  );
}

const selectStyle: CSSProperties = {
  padding: '5px 10px',
  fontSize: 12,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--bg)',
  color: 'var(--text)',
  cursor: 'pointer',
};

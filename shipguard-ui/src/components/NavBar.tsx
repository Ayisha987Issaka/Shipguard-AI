type Tab = 'overview' | 'audit' | 'findings' | 'fixplan' | 'gate';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'audit',    label: 'Audit',    icon: '⟳' },
  { id: 'findings', label: 'Findings', icon: '⚑' },
  { id: 'fixplan',  label: 'Fix Plan', icon: '✎' },
  { id: 'gate',     label: 'Release Gate', icon: '⊛' },
];

export default function NavBar({ active, onChange }: Props) {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      background: '#fff',
      padding: '0 24px',
      gap: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{
        fontWeight: 700,
        fontSize: 15,
        color: 'var(--text)',
        marginRight: 32,
        padding: '14px 0',
        whiteSpace: 'nowrap',
        letterSpacing: '-0.2px',
      }}>
        🛡️ ShipGuard AI
        <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
          Powered by IBM Bob 2.0
        </span>
      </div>

      {/* Tabs */}
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            background: 'none',
            border: 'none',
            borderRadius: 0,
            padding: '14px 16px',
            fontSize: 13,
            fontWeight: active === tab.id ? 600 : 400,
            color: active === tab.id ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: active === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
        >
          <span style={{ marginRight: 5, fontSize: 12 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

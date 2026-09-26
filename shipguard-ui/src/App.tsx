import { useState } from 'react';
import NavBar from './components/NavBar';
import OverviewPage from './pages/OverviewPage';
import AuditPage from './pages/AuditPage';
import FindingsPage from './pages/FindingsPage';
import FixPlanPage from './pages/FixPlanPage';
import ReleaseGatePage from './pages/ReleaseGatePage';
import './styles/global.css';

type Tab = 'overview' | 'audit' | 'findings' | 'fixplan' | 'gate';

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar active={tab} onChange={setTab} />
      <main>
        {tab === 'overview' && <OverviewPage />}
        {tab === 'audit'    && <AuditPage />}
        {tab === 'findings' && <FindingsPage />}
        {tab === 'fixplan'  && <FixPlanPage />}
        {tab === 'gate'     && <ReleaseGatePage />}
      </main>
    </div>
  );
}

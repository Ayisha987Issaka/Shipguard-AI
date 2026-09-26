import { create } from 'zustand';
import type {
  AuditState,
  AuditPhase,
  AgentName,
  AgentStatus,
  Finding,
  Fix,
  AppliedFix,
  FixApproval,
  ApprovalDecision,
  GateVerdict,
  LogEntry,
  Requirement,
  AgentRun,
} from '../types';

// ─── Default agent run template ─────────────────────────────────────────────

function makeAgentRun(agent: AgentName): AgentRun {
  return {
    agent,
    status: 'IDLE',
    startedAt: null,
    finishedAt: null,
    logs: [],
    findingIds: [],
  };
}

// ─── Initial state ───────────────────────────────────────────────────────────

const INITIAL_STATE: AuditState = {
  phase: 'idle',
  projectPath: '../foodnest-demo',
  requirements: [],
  agentRuns: {
    TestAgent: makeAgentRun('TestAgent'),
    ConfigAgent: makeAgentRun('ConfigAgent'),
    DependencyAgent: makeAgentRun('DependencyAgent'),
    DocumentationAgent: makeAgentRun('DocumentationAgent'),
    DeploymentAgent: makeAgentRun('DeploymentAgent'),
    MainReleaseAgent: makeAgentRun('MainReleaseAgent'),
  },
  findings: [],
  fixes: [],
  approvals: {},
  appliedFixes: [],
  verificationRuns: {},
  gate: null,
  auditStartedAt: null,
  auditFinishedAt: null,
};

// ─── Store actions interface ─────────────────────────────────────────────────

interface AuditActions {
  // Lifecycle
  setPhase: (phase: AuditPhase) => void;
  resetAudit: () => void;
  startAudit: () => void;

  // Requirements
  setRequirements: (reqs: Requirement[]) => void;
  updateRequirementStatus: (id: string, status: Requirement['status']) => void;

  // Agent runs
  setAgentStatus: (agent: AgentName, status: AgentStatus) => void;
  appendAgentLog: (agent: AgentName, entry: LogEntry) => void;
  markAgentDone: (agent: AgentName, findingIds: string[]) => void;
  setVerificationRun: (agent: AgentName, run: AgentRun) => void;

  // Findings
  addFindings: (findings: Finding[]) => void;
  updateFindingVerification: (id: string, status: Finding['verificationStatus']) => void;

  // Fixes
  setFixes: (fixes: Fix[]) => void;

  // Approvals
  setApproval: (fixId: string, decision: ApprovalDecision) => void;
  approveAll: () => void;

  // Applied fixes
  recordAppliedFix: (fix: AppliedFix) => void;

  // Gate
  setGate: (verdict: GateVerdict) => void;
  setAuditFinished: () => void;
}

// ─── Zustand store ───────────────────────────────────────────────────────────

export const useAuditStore = create<AuditState & AuditActions>((set, get) => ({
  ...INITIAL_STATE,

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  setPhase: (phase) => set({ phase }),

  resetAudit: () =>
    set({
      ...INITIAL_STATE,
      agentRuns: {
        TestAgent: makeAgentRun('TestAgent'),
        ConfigAgent: makeAgentRun('ConfigAgent'),
        DependencyAgent: makeAgentRun('DependencyAgent'),
        DocumentationAgent: makeAgentRun('DocumentationAgent'),
        DeploymentAgent: makeAgentRun('DeploymentAgent'),
        MainReleaseAgent: makeAgentRun('MainReleaseAgent'),
      },
    }),

  startAudit: () =>
    set({
      phase: 'running',
      auditStartedAt: Date.now(),
      auditFinishedAt: null,
      findings: [],
      fixes: [],
      approvals: {},
      appliedFixes: [],
      gate: null,
      verificationRuns: {},
      agentRuns: {
        TestAgent: makeAgentRun('TestAgent'),
        ConfigAgent: makeAgentRun('ConfigAgent'),
        DependencyAgent: makeAgentRun('DependencyAgent'),
        DocumentationAgent: makeAgentRun('DocumentationAgent'),
        DeploymentAgent: makeAgentRun('DeploymentAgent'),
        MainReleaseAgent: makeAgentRun('MainReleaseAgent'),
      },
    }),

  // ── Requirements ──────────────────────────────────────────────────────────

  setRequirements: (requirements) => set({ requirements }),

  updateRequirementStatus: (id, status) =>
    set((state) => ({
      requirements: state.requirements.map((r) =>
        r.id === id ? { ...r, status } : r
      ),
    })),

  // ── Agent runs ────────────────────────────────────────────────────────────

  setAgentStatus: (agent, status) =>
    set((state) => ({
      agentRuns: {
        ...state.agentRuns,
        [agent]: {
          ...state.agentRuns[agent],
          status,
          startedAt:
            status === 'RUNNING' && state.agentRuns[agent].startedAt === null
              ? Date.now()
              : state.agentRuns[agent].startedAt,
        },
      },
    })),

  appendAgentLog: (agent, entry) =>
    set((state) => ({
      agentRuns: {
        ...state.agentRuns,
        [agent]: {
          ...state.agentRuns[agent],
          logs: [...state.agentRuns[agent].logs, entry],
        },
      },
    })),

  markAgentDone: (agent, findingIds) =>
    set((state) => ({
      agentRuns: {
        ...state.agentRuns,
        [agent]: {
          ...state.agentRuns[agent],
          status: 'DONE',
          finishedAt: Date.now(),
          findingIds,
        },
      },
    })),

  setVerificationRun: (agent, run) =>
    set((state) => ({
      verificationRuns: {
        ...state.verificationRuns,
        [agent]: run,
      },
    })),

  // ── Findings ──────────────────────────────────────────────────────────────

  addFindings: (newFindings) =>
    set((state) => {
      // Deduplicate by id
      const existing = new Set(state.findings.map((f) => f.id));
      const unique = newFindings.filter((f) => !existing.has(f.id));
      return { findings: [...state.findings, ...unique] };
    }),

  updateFindingVerification: (id, status) =>
    set((state) => ({
      findings: state.findings.map((f) =>
        f.id === id ? { ...f, verificationStatus: status } : f
      ),
    })),

  // ── Fixes ─────────────────────────────────────────────────────────────────

  setFixes: (fixes) => set({ fixes }),

  // ── Approvals ─────────────────────────────────────────────────────────────

  setApproval: (fixId, decision) =>
    set((state) => ({
      approvals: {
        ...state.approvals,
        [fixId]: { fixId, decision, timestamp: Date.now() },
      },
    })),

  approveAll: () => {
    const { fixes } = get();
    const approvals: Record<string, FixApproval> = {};
    for (const fix of fixes) {
      approvals[fix.id] = { fixId: fix.id, decision: 'approved', timestamp: Date.now() };
    }
    set({ approvals });
  },

  // ── Applied fixes ─────────────────────────────────────────────────────────

  recordAppliedFix: (fix) =>
    set((state) => ({ appliedFixes: [...state.appliedFixes, fix] })),

  // ── Gate ──────────────────────────────────────────────────────────────────

  setGate: (gate) => set({ gate }),

  setAuditFinished: () => set({ auditFinishedAt: Date.now() }),
}));

// ─── Derived selectors ────────────────────────────────────────────────────────

export const selectBlockers = (state: AuditState) =>
  state.findings.filter((f) => f.severity === 'BLOCKER');

export const selectWarnings = (state: AuditState) =>
  state.findings.filter((f) => f.severity === 'WARNING');

export const selectPassedRequirements = (state: AuditState) =>
  state.requirements.filter((r) => r.status === 'PASS');

export const selectPendingApprovals = (state: AuditState & AuditActions) =>
  state.fixes.filter(
    (f) =>
      !state.approvals[f.id] || state.approvals[f.id].decision === 'pending'
  );

export const selectApprovedFixes = (state: AuditState & AuditActions) =>
  state.fixes.filter((f) => state.approvals[f.id]?.decision === 'approved');

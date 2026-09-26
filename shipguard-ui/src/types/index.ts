// ─── Core domain types for ShipGuard AI ─────────────────────────────────────

export type Severity = 'BLOCKER' | 'WARNING' | 'INFO';

export type ReqStatus = 'PASS' | 'FAIL' | 'WARNING' | 'PENDING';

export type VerificationStatus = 'PENDING' | 'PASS' | 'FAIL' | 'PARTIAL' | 'NOT_CHECKED';

export type AgentName =
  | 'TestAgent'
  | 'ConfigAgent'
  | 'DependencyAgent'
  | 'DocumentationAgent'
  | 'DeploymentAgent'
  | 'MainReleaseAgent';

export type AgentStatus = 'IDLE' | 'RUNNING' | 'DONE' | 'ERROR';

export type AuditPhase =
  | 'idle'
  | 'running'
  | 'awaiting-approval'
  | 'applying'
  | 'verifying'
  | 'complete';

// ─── Release Requirement ─────────────────────────────────────────────────────

export interface Requirement {
  id: string;           // e.g. "REQ-01"
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: ReqStatus;
}

// ─── Agent Log Entry ─────────────────────────────────────────────────────────

export interface LogEntry {
  timestamp: number;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

// ─── Agent Run ───────────────────────────────────────────────────────────────

export interface AgentRun {
  agent: AgentName;
  status: AgentStatus;
  startedAt: number | null;
  finishedAt: number | null;
  logs: LogEntry[];
  findingIds: string[];   // IDs of findings produced by this run
}

// ─── Finding ─────────────────────────────────────────────────────────────────

export interface Finding {
  id: string;                      // e.g. "TEST-01", "CFG-01"
  reqIds: string[];                // e.g. ["REQ-01"]
  agents: AgentName[];             // which agents identified this
  severity: Severity;
  title: string;
  explanation: string;
  affectedFile: string;
  evidence: string;                // exact quoted text from the file
  recommendedFix: string;
  verificationStatus: VerificationStatus;
}

// ─── Proposed Fix ────────────────────────────────────────────────────────────

export interface Fix {
  id: string;                      // e.g. "FIX-01"
  findingId: string;
  reqIds: string[];
  agentReasoning: string;          // auditable reasoning — NOT internal chain-of-thought
  affectedFile: string;
  searchText: string;              // exact text to replace (for diff display)
  replaceText: string;             // replacement text
  description: string;             // human summary of the change
}

// ─── Developer Approval ──────────────────────────────────────────────────────

export type ApprovalDecision = 'approved' | 'rejected' | 'deferred' | 'pending';

export interface FixApproval {
  fixId: string;
  decision: ApprovalDecision;
  timestamp: number | null;
}

// ─── Applied Fix ─────────────────────────────────────────────────────────────

export interface AppliedFix {
  fixId: string;
  affectedFile: string;
  appliedAt: number;
  beforeContent: string;
  afterContent: string;
  success: boolean;
  errorMessage?: string;
}

// ─── Release Gate ────────────────────────────────────────────────────────────

export type GateVerdict =
  | 'READY'
  | 'BLOCKED'
  | 'BLOCKED_WITH_WARNINGS'
  | null;

// ─── Full Audit State ────────────────────────────────────────────────────────

export interface AuditState {
  phase: AuditPhase;
  projectPath: string;
  requirements: Requirement[];
  agentRuns: Record<AgentName, AgentRun>;
  findings: Finding[];
  fixes: Fix[];
  approvals: Record<string, FixApproval>;
  appliedFixes: AppliedFix[];
  verificationRuns: Partial<Record<AgentName, AgentRun>>;
  gate: GateVerdict;
  auditStartedAt: number | null;
  auditFinishedAt: number | null;
}

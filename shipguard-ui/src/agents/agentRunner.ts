/**
 * AgentRunner — shared utilities for all specialist agents.
 *
 * Each agent receives an `emit` function it calls to append log entries to the
 * store in real time. Agents are pure async functions: they read data, build
 * findings, and return them. They never modify files.
 */

import type { AgentName, Finding, Fix, LogEntry, Severity } from '../types';
import { useAuditStore } from '../store/auditStore';

// ─── Emit helper factory ──────────────────────────────────────────────────────

export type EmitFn = (msg: string, level?: LogEntry['level']) => void;

export function makeEmitter(agent: AgentName): EmitFn {
  return (msg, level = 'info') => {
    useAuditStore.getState().appendAgentLog(agent, {
      timestamp: Date.now(),
      message: msg,
      level,
    });
  };
}

// ─── Finding ID counter ───────────────────────────────────────────────────────

const counters: Record<string, number> = {};

export function nextId(prefix: string): string {
  counters[prefix] = (counters[prefix] ?? 0) + 1;
  return `${prefix}-${String(counters[prefix]).padStart(2, '0')}`;
}

export function resetCounters(): void {
  for (const k of Object.keys(counters)) {
    delete counters[k];
  }
}

// ─── Typed finding builder ────────────────────────────────────────────────────

export function makeFinding(
  partial: Omit<Finding, 'verificationStatus'>
): Finding {
  return { ...partial, verificationStatus: 'PENDING' };
}

// ─── Fix builder ─────────────────────────────────────────────────────────────

export function makeFix(partial: Fix): Fix {
  return partial;
}

// ─── Priority → Severity mapping ─────────────────────────────────────────────

export function priorityToSeverity(priority: 'Critical' | 'High' | 'Medium' | 'Low', status: 'PASS' | 'FAIL' | 'WARNING'): Severity {
  if (status === 'PASS') return 'INFO';
  if (priority === 'Critical') return 'BLOCKER';
  if (priority === 'High') return status === 'FAIL' ? 'BLOCKER' : 'WARNING';
  if (priority === 'Medium') return 'WARNING';
  return 'INFO';
}

// ─── Sleep utility (simulate async inspection steps) ─────────────────────────

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

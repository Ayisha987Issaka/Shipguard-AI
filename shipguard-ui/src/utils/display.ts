import type { Severity, ReqStatus, VerificationStatus } from '../types';

/** Return the badge CSS class for a given severity */
export function severityClass(s: Severity): string {
  if (s === 'BLOCKER') return 'badge badge-blocker';
  if (s === 'WARNING') return 'badge badge-warning';
  return 'badge badge-info';
}

/** Return the badge CSS class for a requirement status */
export function reqStatusClass(s: ReqStatus): string {
  if (s === 'PASS') return 'badge badge-pass';
  if (s === 'FAIL') return 'badge badge-blocker';
  if (s === 'WARNING') return 'badge badge-warning';
  return 'badge badge-pending';
}

/** Return the badge CSS class for verification status */
export function verifClass(s: VerificationStatus): string {
  if (s === 'PASS') return 'badge badge-pass';
  if (s === 'FAIL') return 'badge badge-blocker';
  if (s === 'PARTIAL') return 'badge badge-warning';
  return 'badge badge-pending';
}

/** Format ms duration to human string */
export function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Format epoch timestamp to HH:MM:SS */
export function formatTime(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString();
}

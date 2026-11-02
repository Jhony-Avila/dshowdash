// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.constants.error-recovery
// PURPOSE: Estratégias de recuperação para erros no RuntimeContext
// ───────────────────────────────────────────────────────────────
// PROVIDES: attemptRecovery, resetRecovery, getRecoveryState, healthCheck
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'core.runtime.constants.error-recovery' as const;
export const VERSION = '1.1.0-P2-ENTERPRISE' as const;

interface RecoveryMetrics {
  totalAttempts: number;
  successCount: number;
  failCount: number;
  lastAttemptAt: number | null;
  lastSuccessAt: number | null;
}

interface StartRecoveryResult {
  ok: boolean;
  reason?: string;
  attempt?: number;
  maxAttempts?: number;
  backoffMs?: number;
}

interface RecoveryFailedResult {
  canRetry: boolean;
  nextBackoffMs: number;
  attemptsRemaining: number;
}

interface RecoveryState {
  isRecovering: boolean;
  attempts: number;
  maxAttempts: number;
  canRetry: boolean;
  lastError: unknown;
  nextBackoffMs: number;
}

interface ErrorRecoveryInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  state: RecoveryState;
  metrics: RecoveryMetrics;
}

let _recoveryAttempts: number = 0;
const _maxAttempts: number = 3;
const _backoffBase: number = 1000;
let _isRecovering: boolean = false;
let _lastError: unknown = null;
const _metrics: RecoveryMetrics = {
  totalAttempts: 0,
  successCount: 0,
  failCount: 0,
  lastAttemptAt: null,
  lastSuccessAt: null
};

export function canAttemptRecovery(): boolean {
  return !_isRecovering && _recoveryAttempts < _maxAttempts;
}

export function getBackoffDelay(): number {
  return _backoffBase * Math.pow(2, _recoveryAttempts);
}

export function startRecovery(errorInfo?: unknown): StartRecoveryResult {
  if (!canAttemptRecovery()) {
    return { ok: false, reason: _isRecovering ? 'already-recovering' : 'max-attempts-reached' };
  }
  _isRecovering = true;
  _recoveryAttempts++;
  _lastError = errorInfo || null;
  _metrics.totalAttempts++;
  _metrics.lastAttemptAt = Date.now();
  return {
    ok: true,
    attempt: _recoveryAttempts,
    maxAttempts: _maxAttempts,
    backoffMs: getBackoffDelay()
  };
}

export function recoverySuccess(): void {
  _isRecovering = false;
  _recoveryAttempts = 0;
  _lastError = null;
  _metrics.successCount++;
  _metrics.lastSuccessAt = Date.now();
}

export function recoveryFailed(error?: unknown): RecoveryFailedResult {
  _isRecovering = false;
  _lastError = error || _lastError;
  _metrics.failCount++;
  return {
    canRetry: _recoveryAttempts < _maxAttempts,
    nextBackoffMs: getBackoffDelay(),
    attemptsRemaining: _maxAttempts - _recoveryAttempts
  };
}

export function resetRecovery(): void {
  _recoveryAttempts = 0;
  _isRecovering = false;
  _lastError = null;
}

export function isRecovering(): boolean {
  return _isRecovering;
}

export function getRecoveryState(): RecoveryState {
  return {
    isRecovering: _isRecovering,
    attempts: _recoveryAttempts,
    maxAttempts: _maxAttempts,
    canRetry: canAttemptRecovery(),
    lastError: _lastError,
    nextBackoffMs: getBackoffDelay()
  };
}

export function info(): ErrorRecoveryInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    state: getRecoveryState(),
    metrics: Object.assign({}, _metrics)
  };
}

export default {
  MODULE_ID,
  VERSION,
  canAttemptRecovery,
  getBackoffDelay,
  startRecovery,
  recoverySuccess,
  recoveryFailed,
  resetRecovery,
  isRecovering,
  getRecoveryState,
  info
};

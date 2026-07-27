// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-guards
// PURPOSE: Orchestrator Guards
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   isCriticalModule() — exported function
//   canMountModule() — exported function
//   shouldDegradeModule() — exported function
//   isTransientError() — exported function
//   isCircuitBreakerOpen() — exported function
//   shouldRetry() — exported function
//   isValidModuleId() — exported function
//   isValidPresetId() — exported function
//   isBrowser() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'orchestrator-guards';

export function getVersion() { return VERSION; }

export function isCriticalModule(moduleConfig: Record<string, unknown>) { return moduleConfig?.critical === true; }

export function canMountModule(moduleId: string, context: Record<string, unknown> = {}) {
  if (!moduleId) return false;
  if (context.authRequired && !context.isAuthenticated) return false;
  if (context.permissions && (context.permissions as string[]).length > 0) {
    const hasPermission = (context.userPermissions as string[])?.some((p: string) => (context.permissions as string[]).indexOf(p) !== -1);
    if (!hasPermission) return false;
  }
  if (context.featureFlags && (context.featureFlags as string[]).length > 0) {
    const flagsEnabled = (context.featureFlags as string[]).every((flag: string) => (context.enabledFlags as string[])?.indexOf(flag) !== -1);
    if (!flagsEnabled) return false;
  }
  return true;
}

export function shouldDegradeModule(healthState: string, errorCount: number = 0, threshold: number = 3) {
  if (healthState === 'ERROR' || healthState === 'CRITICAL') return true;
  if (errorCount >= threshold) return true;
  return false;
}

export function isTransientError(error: unknown) {
  const transientPatterns = ['network', 'timeout', 'fetch', 'ECONNREFUSED', 'ETIMEDOUT', 'AbortError', '503', '504'];
  const errorMessage = (error as Error)?.message?.toLowerCase() || '';
  const errorName = (error as Error)?.name?.toLowerCase() || '';
  return transientPatterns.some(pattern => errorMessage.indexOf(pattern) !== -1 || errorName.indexOf(pattern) !== -1);
}

export function isCircuitBreakerOpen(failures: Array<{ timestamp: number }>, threshold: number = 5, windowMs: number = 60000) {
  if (!Array.isArray(failures)) return false;
  const now = Date.now();
  const recentFailures = failures.filter(f => now - f.timestamp < windowMs);
  return recentFailures.length >= threshold;
}

export function shouldRetry(attempt: number, maxRetries: number, error: unknown) {
  if (attempt >= maxRetries) return false;
  if (!isTransientError(error)) return false;
  return true;
}

export function isValidModuleId(id: string) { if (!id || typeof id !== 'string') return false; return /^[a-z0-9-]+$/i.test(id); }
export function isValidPresetId(id: string) { if (!id || typeof id !== 'string') return false; return /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(id); }
export function isBrowser() { return typeof window !== 'undefined' && typeof document !== 'undefined'; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { guardsReady: true } }; }

export default { VERSION, MODULE_ID, getVersion, isCriticalModule, canMountModule, shouldDegradeModule, isTransientError, isCircuitBreakerOpen, shouldRetry, isValidModuleId, isValidPresetId, isBrowser, info, healthCheck };

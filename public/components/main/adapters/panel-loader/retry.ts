// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: retry-backoff
// PURPOSE: Retry com Exponential Backoff
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getMetrics() — exported function
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

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'retry-backoff';

let _metrics = { attempts: 0, successes: 0, failures: 0 };

export async function retryWithBackoff(fn: () => Promise<unknown>, options: { maxRetries?: number; baseDelay?: number; maxDelay?: number; onRetry?: ((info: Record<string, unknown>) => void) | null; [k: string]: unknown } = {}) {
  const { maxRetries = 3, baseDelay = 500, maxDelay = 5000, onRetry = null } = options;
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      _metrics.attempts++;
      const result = await fn();
      _metrics.successes++;
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        if (onRetry) onRetry({ attempt: attempt + 1, maxRetries, delay, error });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  _metrics.failures++;
  throw lastError;
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { retryReady: true }, metrics: getMetrics() }; }

export default { retryWithBackoff, getMetrics, info, healthCheck, VERSION, MODULE_ID };

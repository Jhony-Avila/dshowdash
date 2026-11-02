// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-retry
// PURPOSE: Logger Global - Retry v3.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   withRetry() — exported function
//   retryLogOperation() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '3.0.0-ENTERPRISE';
export const MODULE_ID = 'logger-global-retry';

export function getVersion() {
  return VERSION;
}

export async function withRetry(fn: (attempt: number) => Promise<unknown>, options: { retries?: number; baseDelayMs?: number; maxDelayMs?: number; backoffMultiplier?: number; shouldRetry?: (error: unknown, attempt?: number) => boolean } = {}) {
  const {
    retries = 3,
    baseDelayMs = 500,
    maxDelayMs = 5000,
    backoffMultiplier = 2,
    shouldRetry = () => true
  } = options;
  
  let lastError = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn(attempt);
      return { ok: true, result, attempts: attempt + 1 };
    } catch (error) {
      lastError = error;
      if (attempt < retries && shouldRetry(error, attempt)) {
        const delay = Math.min(baseDelayMs * Math.pow(backoffMultiplier, attempt), maxDelayMs);
        await sleep(delay);
      }
    }
  }
  
  return { ok: false, error: lastError, attempts: retries + 1 };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryLogOperation(operation: (attempt: number) => Promise<unknown>) {
  return withRetry(operation, {
    retries: 2,
    baseDelayMs: 200,
    maxDelayMs: 1000,
    shouldRetry: (error: unknown) => {
      if ((error as any)?.name === 'AbortError') return false;
      if ((error as any)?.status === 401 || (error as any)?.status === 403) return false;
      return true;
    }
  });
}

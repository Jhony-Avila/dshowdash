// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: utils
// PURPOSE: Bootstrap Helpers - Utils (Sanitizer, RateLimiter, Workers, Cache, Queue)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createUtilsHelpers() — exported function
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

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap.helpers.utils';

export function createUtilsHelpers(refs: Record<string, unknown>) {
  const r = refs as Record<string, import('../types.js').ManagerRef | null>;
  return {
    // Sanitizer
    sanitize(type: string, input: HTMLInputElement) { return r.sanitizer?.[type]?.(input) || input; },
    escapeHtml(input: HTMLInputElement) { return r.sanitizer?.escapeHtml(input) || input; },
    isSafe(input: HTMLInputElement) { return r.sanitizer?.isSafe(input) ?? true; },
    // RateLimiter
    checkRateLimit(key: string) { return r.rateLimiter?.check(key); },
    withRateLimit(fn: (...args: unknown[]) => void, key: string) { return r.rateLimiter?.attempt(fn, key); },
    // Workers
    runInWorker(type: string, payload: Record<string, unknown>, fn: (...args: unknown[]) => void, opts: Record<string, unknown>) { return r.workerManager?.execute(type, payload, fn, opts); },
    // Fallback
    withFallback(primaryFn: unknown, fallbackFn: unknown, opts: Record<string, unknown>) { return r.fallbackSystem?.withFallback(primaryFn, fallbackFn, opts); },
    registerFallbackChain(operationId: unknown, chain: unknown) { return r.fallbackSystem?.register(operationId, chain); },
    executeFallback(operationId: unknown, context: Record<string, unknown>) { return r.fallbackSystem?.execute(operationId, context); },
    // Request Queue
    queueRequest(url: string, options: Record<string, unknown>) { return r.requestQueue?.add(url, options); },
    // Cache
    cacheGet(key: string, defaultValue: string) { return r.cacheManager?.get(key, defaultValue); },
    cacheSet(key: string, value: unknown, options: Record<string, unknown>) { return r.cacheManager?.set(key, value, options); },
    // Event Recorder
    startRecording() { return r.eventRecorder?.start(); },
    stopRecording() { return r.eventRecorder?.stop(); }
  };
}

export default { createUtilsHelpers };

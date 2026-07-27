// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/performance/debounce
// PURPOSE: Panel-01 - Debounce Otimizado com AbortController
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createDebouncedFetch() — exported function
//   debounceWithCancel() — exported function
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
export const MODULE_ID = 'panel-01/utils/performance/debounce';

export class DebouncedRequest {
  [key: string]: any;
  constructor(fn: (...args: unknown[]) => Promise<unknown>, delay = 400) {
    this._fn = fn;
    this._delay = delay;
    this._timer = null;
    this._abortController = null;
    this._pending = null;
  }

  call(...args: unknown[]) {
    this.cancel();
    return new Promise((resolve, reject) => {
      this._timer = setTimeout(async () => {
        this._abortController = new AbortController();
        this._pending = { resolve, reject };
        try {
          const result = await this._fn(...args, this._abortController.signal);
          if (!this._abortController.signal.aborted) resolve(result);
        } catch (error: any) {
          if (error.name !== 'AbortError') reject(error);
        } finally {
          this._pending = null;
          this._abortController = null;
        }
      }, this._delay);
    });
  }

  cancel() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    if (this._abortController) { this._abortController.abort(); this._abortController = null; }
    if (this._pending) { this._pending = null; }
  }

  isPending() { return this._timer !== null || this._pending !== null; }
  destroy() { this.cancel(); }
}

export function createDebouncedFetch(fetchFn: (...args: unknown[]) => Promise<unknown>, delay = 400) {
  const debounced = new DebouncedRequest(fetchFn, delay);
  const wrapper = (...args: unknown[]) => debounced.call(...args);
  wrapper.cancel = () => debounced.cancel();
  wrapper.isPending = () => debounced.isPending();
  wrapper.destroy = () => debounced.destroy();
  return wrapper;
}

export function debounceWithCancel(fn: (...args: unknown[]) => unknown, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: unknown[] | null = null;
  const debounced = (...args: unknown[]) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    return new Promise((resolve) => {
      // @ts-expect-error strict migration — TS2488
      timer = setTimeout(() => { timer = null; resolve(fn(...lastArgs)); }, delay);
    });
  };
  debounced.cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
  debounced.flush = () => { if (timer && lastArgs) { clearTimeout(timer); timer = null; return fn(...lastArgs); } return null; };
  return debounced;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { DebouncedRequest, createDebouncedFetch, debounceWithCancel };

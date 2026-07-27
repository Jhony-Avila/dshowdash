// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-logo-lifecycle
// PURPOSE: logo Icon - Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   Lifecycle — exported value
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

const MODULE_ID = 'footer-icon-logo-lifecycle';
const VERSION = '1.1.0-ENTERPRISE';

// @ts-expect-error strict migration — TS7034
let _phase = 'idle', _container = null, _mountCount = 0;

export const Lifecycle = {
  getPhase() { return _phase; },
  isReady() { return _phase === 'ready' || _phase === 'mounted'; },
  isMounted() { return _phase === 'mounted'; },
  setInitializing() { _phase = 'initializing'; },
  setReady() { _phase = 'ready'; },
  setMounted(c: unknown) { _phase = 'mounted'; _container = c; _mountCount++; },
  setUnmounting() { _phase = 'unmounting'; },
  setDestroyed() { _phase = 'destroyed'; _container = null; },
  reset() { _phase = 'idle'; _container = null; },
  // @ts-expect-error strict migration — TS7005
  getContainer() { return _container; },
  info() { return { phase: _phase, isMounted: this.isMounted(), mountCount: _mountCount }; }
};

// @ts-expect-error strict migration — TS7005
export function getMetrics() { return { phase: _phase, mountCount: _mountCount, hasContainer: !!_container }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, lifecycle: Lifecycle.info(), metrics: getMetrics() }; }
export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { phase: _phase }, metrics: getMetrics() };
}

export { MODULE_ID, VERSION };
export default { ...Lifecycle, getMetrics, info, healthCheck, MODULE_ID, VERSION };

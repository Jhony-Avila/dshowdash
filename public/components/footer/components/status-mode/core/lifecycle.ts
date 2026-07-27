// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer/components/status-mode/core/lifecycle
// PURPOSE: Status Mode - Lifecycle Manager (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   setDebug() — exported function
//   getLogs() — exported function
//   LifecycleManager — exported class
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
export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'footer/components/status-mode/core/lifecycle';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export class LifecycleManager {
  [key: string]: any;
  constructor(component: Record<string,unknown>) { this.component = component; this.state = 'unmounted'; this.hooks = { beforeMount: [], mounted: [], beforeUnmount: [], unmounted: [] }; this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null }; }
  async mount() { this.state = 'mounting'; await this._runHooks('beforeMount'); this.state = 'mounted'; await this._runHooks('mounted'); this._metrics.mountCount++; this._metrics.lastTransitionAt = Date.now(); }
  async unmount() { this.state = 'unmounting'; await this._runHooks('beforeUnmount'); this.state = 'unmounted'; await this._runHooks('unmounted'); this._metrics.unmountCount++; this._metrics.lastTransitionAt = Date.now(); }
  async _runHooks(name: string) { for (const hook of this.hooks[name] || []) { try { await hook(this.component); } catch (e) { this._metrics.errorCount++; _log('error', `Hook ${name} error:`, e); } } }
  onBeforeMount(h: Record<string,unknown>) { this.hooks.beforeMount.push(h); }
  onMounted(h: Record<string,unknown>) { this.hooks.mounted.push(h); }
  onBeforeUnmount(h: Record<string,unknown>) { this.hooks.beforeUnmount.push(h); }
  onUnmounted(h: Record<string,unknown>) { this.hooks.unmounted.push(h); }
  getState() { return this.state; }
  healthCheck() { const checks = { validState: ['unmounted', 'mounting', 'mounted', 'unmounting'].includes(this.state), hasComponent: !!this.component }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default LifecycleManager;

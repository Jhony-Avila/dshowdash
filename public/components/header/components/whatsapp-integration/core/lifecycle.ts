// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/whatsapp-integration/core/lifecycle
// PURPOSE: WhatsApp Integration - Lifecycle Manager (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   setDebug() — exported function
//   getLogs() — exported function
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
export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/whatsapp-integration/core/lifecycle';
// @ts-expect-error strict migration — TS7034
let _debug = false; let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export class LifecycleManager {
  [key: string]: any;
  constructor(component: Record<string,unknown>) { this.component = component; this.state = 'unmounted'; this.hooks = { beforeMount: [], mounted: [], beforeUpdate: [], updated: [], beforeUnmount: [], unmounted: [] }; this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null }; }
  async mount() { if (this.state !== 'unmounted') throw new Error(`Cannot mount: component is ${this.state}`); this.state = 'mounting'; await this._runHooks('beforeMount'); this.state = 'mounted'; await this._runHooks('mounted'); this._metrics.mountCount++; this._metrics.lastTransitionAt = Date.now(); }
  async update() { if (this.state !== 'mounted') throw new Error(`Cannot update: component is ${this.state}`); await this._runHooks('beforeUpdate'); await this._runHooks('updated'); this._metrics.updateCount++; }
  async unmount() { if (this.state === 'unmounted') return; this.state = 'unmounting'; await this._runHooks('beforeUnmount'); this.state = 'unmounted'; await this._runHooks('unmounted'); this._metrics.unmountCount++; this._metrics.lastTransitionAt = Date.now(); }
  async _runHooks(hookName: string) { const hooks = this.hooks[hookName] || []; for (const hook of hooks) { try { await hook(this.component); } catch (error) { this._metrics.errorCount++; _log('error', `Error in ${hookName}:`, error); } } }
  onBeforeMount(hook: Function) { this.hooks.beforeMount.push(hook); }
  onMounted(hook: Function) { this.hooks.mounted.push(hook); }
  onBeforeUpdate(hook: Function) { this.hooks.beforeUpdate.push(hook); }
  onUpdated(hook: Function) { this.hooks.updated.push(hook); }
  onBeforeUnmount(hook: Function) { this.hooks.beforeUnmount.push(hook); }
  onUnmounted(hook: Function) { this.hooks.unmounted.push(hook); }
  getState() { return this.state; }
  healthCheck() { const checks = { validState: ['unmounted', 'mounting', 'mounted', 'unmounting'].includes(this.state), hasComponent: !!this.component }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { _debug = !!enabled; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default LifecycleManager;

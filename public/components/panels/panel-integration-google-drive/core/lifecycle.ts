// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-integration-google-drive/core/lifecycle
// PURPOSE: Integration Google Drive - Lifecycle Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
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
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-integration-google-drive/core/lifecycle';
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export class LifecycleManager {
  [key: string]: any;
  constructor(component: unknown) { this.component = component; this.state = 'unmounted'; this.hooks = { beforeMount: [], mounted: [], beforeUnmount: [], unmounted: [] }; this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null }; }
  async mount() { this.state = 'mounting'; await this._runHooks('beforeMount'); this.state = 'mounted'; await this._runHooks('mounted'); this._metrics.mountCount++; this._metrics.lastTransitionAt = Date.now(); }
  async unmount() { this.state = 'unmounting'; await this._runHooks('beforeUnmount'); this.state = 'unmounted'; await this._runHooks('unmounted'); this._metrics.unmountCount++; this._metrics.lastTransitionAt = Date.now(); }
  async _runHooks(name: string) { for (const hook of this.hooks[name] || []) { try { await hook(this.component); } catch (e) { this._metrics.errorCount++; _getPort('logger')?.error(`[${MODULE_ID}] Hook ${name} error:`, e); } } }
  onBeforeMount(h: (component: unknown) => void | Promise<void>) { this.hooks.beforeMount.push(h); }
  onMounted(h: (component: unknown) => void | Promise<void>) { this.hooks.mounted.push(h); }
  onBeforeUnmount(h: (component: unknown) => void | Promise<void>) { this.hooks.beforeUnmount.push(h); }
  onUnmounted(h: (component: unknown) => void | Promise<void>) { this.hooks.unmounted.push(h); }
  getState() { return this.state; }
  healthCheck() { const checks = { validState: ['unmounted', 'mounting', 'mounted', 'unmounting'].includes(this.state), hasComponent: !!this.component, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'healthy' : 'degraded', score: passed, maxScore: 3, checks, version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, state: this.state, metrics: this._metrics, portsInitialized: Ports.isInitialized() }; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null }; }
}
export default LifecycleManager;

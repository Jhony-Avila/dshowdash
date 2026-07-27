// ═════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.1.0-ENTERPRISE)
// ═════════════════════════════════════════════════════════════
// MODULE: header-panel-asaas-core-lifecycle
// PURPOSE: Module functionality
// ─────────────────────────────────────────────────────────────
// PROVIDES:
//   getMetrics()
//   LifecycleManager (class)
// ═════════════════════════════════════════════════════════════
// Lifecycle Manager - Enterprise
// @version 8.1.0-ENTERPRISE
'use strict';

export const MODULE_ID = 'header-panel-asaas-core-lifecycle';
import { VERSION } from '/core/version.js'; export { VERSION };

let _metrics = { mounts: 0, unmounts: 0 };

export class LifecycleManager {
  [key: string]: any;
  constructor(component: Record<string,unknown>) { this.component = component; this.state = 'created'; this._mountedAt = null; }
  async mount() { _metrics.mounts++; this.state = 'mounting'; this._mountedAt = Date.now(); this.state = 'mounted'; }
  async unmount() { _metrics.unmounts++; this.state = 'unmounting'; this.state = 'unmounted'; }
  getState() { return this.state; }
  getUptime() { return this._mountedAt ? Date.now() - this._mountedAt : 0; }
  getMetrics() { return { ..._metrics, state: this.state, uptime: this.getUptime() }; }
  info() { return { moduleId: MODULE_ID, version: VERSION, state: this.state, metrics: this.getMetrics() }; }
  healthCheck() { return { status: this.state === 'mounted' ? 'HEALTHY' : 'IDLE', version: VERSION, moduleId: MODULE_ID, checks: { lifecycleReady: true }, metrics: this.getMetrics() }; }
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { lifecycleReady: true } }; }

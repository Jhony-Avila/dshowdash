// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-analytics.core.polling
// PURPOSE: Analytics - Polling Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
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

export const MODULE_ID = 'panel-analytics.core.polling';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export class PollingManager {
  [key: string]: any;
  constructor(options: { interval?: number; callback?: () => Promise<void> | void } = {}) { this.interval = options.interval || 30000; this.callback = options.callback || (() => {}); this._timer = null; this._running = false; this._metrics = { pollCount: 0, errorCount: 0, lastPollAt: null }; }
  start() { if (this._running) return; this._running = true; this._poll(); this._timer = setInterval(() => this._poll(), this.interval); }
  stop() { if (this._timer) { clearInterval(this._timer); this._timer = null; } this._running = false; }
  async _poll() { if (document.hidden) return; this._metrics.pollCount++; this._metrics.lastPollAt = Date.now(); try { await this.callback(); } catch (e) { this._metrics.errorCount++; _getPort('logger')?.error(`[${MODULE_ID}] Poll error:`, e); } }
  setInterval(ms: number) { this.interval = ms; if (this._running) { this.stop(); this.start(); } }
  isRunning() { return this._running; }
  healthCheck() { return { status: 'healthy', running: this._running, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, running: this._running, interval: this.interval, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
}
export default PollingManager;

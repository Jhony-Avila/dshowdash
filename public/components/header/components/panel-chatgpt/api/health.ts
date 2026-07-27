// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-chatgpt/api/health
// PURPOSE: panel-chatgpt - Health API (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
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

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-chatgpt/api/health';

let _debug = false;
const _metrics = { checks: 0, passes: 0, failures: 0, lastCheckAt: (null as unknown|null) };

export class HealthAPI { [key: string]: any;
  constructor(options: { endpoint?: string } = {}) { this.endpoint = options.endpoint || '/api/health'; }

  async check() {
    _metrics.checks++;
    _metrics.lastCheckAt = Date.now();
    try {
      const response = await fetch(this.endpoint, { method: 'GET', cache: 'no-store' });
      if (response.ok) { _metrics.passes++; return { ok: true, status: response.status, timestamp: Date.now() }; }
      _metrics.failures++;
      return { ok: false, status: response.status, timestamp: Date.now() };
    } catch (error: any) {
      _metrics.failures++;
      return { ok: false, error: error.message, timestamp: Date.now() };
    }
  }

  getMetrics() { return { ..._metrics }; }
  resetMetrics() { _metrics.checks = 0; _metrics.passes = 0; _metrics.failures = 0; _metrics.lastCheckAt = null; }
  setDebug(enabled: boolean) { _debug = !!enabled; }

  healthCheck() {
    const successRate = _metrics.checks > 0 ? _metrics.passes / _metrics.checks : 1;
    const checks = { ready: true, goodSuccessRate: successRate > 0.5 };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, endpoint: this.endpoint, metrics: this.getMetrics() }; }
}

export default HealthAPI;

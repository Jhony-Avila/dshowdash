// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-status-currency-usd-cny/api/health
// PURPOSE: Status  - API Health Check
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getLastCheck() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
export const MODULE_ID = 'panels/panel-status-currency-usd-cny/api/health';

let _lastCheck: Record<string, unknown> | null = null;
let _status = 'unknown';

export async function check(endpoint = '/api/health', { signal }: { signal?: AbortSignal } = {}) {
  try {
    const start = Date.now();
    const response = await fetch(endpoint, { method: 'HEAD', cache: 'no-store', signal });
    const latency = Date.now() - start;
    
    _lastCheck = { timestamp: Date.now(), latency, status: response.ok ? 'healthy' : 'unhealthy' };
    _status = _lastCheck.status as string;
    
    return _lastCheck;
  } catch (error: any) {
    _lastCheck = { timestamp: Date.now(), latency: -1, status: 'error', error: error.message };
    _status = 'error';
    return _lastCheck;
  }
}

export function getLastCheck() { return _lastCheck; }
export function getStatus() { return _status; }

export function healthCheck() {
  const normalizedStatus = _status === 'healthy' ? 'HEALTHY' : (_status === 'unknown' ? 'DEGRADED' : 'UNHEALTHY');
  return { status: normalizedStatus, version: VERSION, moduleId: MODULE_ID, lastCheck: _lastCheck, rawStatus: _status };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, status: _status, lastCheck: _lastCheck, healthCheck: healthCheck() };
}

export default { check, getLastCheck, getStatus, healthCheck, info, VERSION, MODULE_ID };

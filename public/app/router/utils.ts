// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: router-utils
// PURPOSE: Router Global - Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   normalizePath() — exported function
//   createNavigationResult() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

const VERSION = '3.1.0-ENTERPRISE';
const MODULE_ID = 'router-utils';

function normalizePath(path: string): string {
  if (!path || typeof path !== 'string') return '/';
  let normalized = path.trim();
  if (normalized.charAt(0) === '#') normalized = normalized.substring(1);
  const queryIndex = normalized.indexOf('?');
  if (queryIndex !== -1) normalized = normalized.substring(0, queryIndex);
  if (normalized.charAt(0) !== '/') normalized = `/${normalized}`;
  normalized = normalized.replace(/\/+/g, '/');
  if (normalized.length > 1 && normalized.charAt(normalized.length - 1) === '/') normalized = normalized.slice(0, -1);
  return normalized || '/';
}

function createNavigationResult(ok: boolean, reason?: string | null, blockedBy?: string | null, route?: Record<string, unknown> | null) {
  return { ok, reason: reason || null, blockedBy: blockedBy || null, route: route || null, timestamp: Date.now() };
}

function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID }; }
function info() { return { moduleId: MODULE_ID, version: VERSION }; }

export { VERSION, MODULE_ID, normalizePath, createNavigationResult, healthCheck, info };
export default { normalizePath, createNavigationResult, healthCheck, info, VERSION, MODULE_ID };

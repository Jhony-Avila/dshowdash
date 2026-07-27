// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: phase5-utils
// PURPOSE: Phase 5 - Utils (Sanitizer, RateLimiter, Workers, etc)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createSanitizer from ../../utils/sanitizer.js
//   createRateLimiter from ../../utils/rate-limiter.js
//   createDevToolsPanel from ../../utils/devtools-panel/index.js
//   createWorkerManager from ../../utils/worker-manager.js
//   createConsoleCommands from ../../utils/console-commands.js
//   createTelemetryDashboard from ../../utils/telemetry-dashboard.js
//   createRequestQueue from ../../utils/request-queue.js
//   createCacheManager from ../../utils/cache-manager.js
//   createEventRecorder from ../../utils/event-recorder.js
//   registerLoaded from ../../core/dependency-map.js
//   getEnv, ENV from ../../config.js
//
// PROVIDES:
//   (none)
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

import { createSanitizer } from '../../utils/sanitizer.js';
import { createRateLimiter } from '../../utils/rate-limiter.js';
import { createDevToolsPanel } from '../../utils/devtools-panel/index.js';
// REMOVED 2026-04-29 — workers dormentes (ver /backup/remove-workers-20260429-183149/). 6 eval() sem consumidor real.
// import { createWorkerManager } from '../../utils/worker-manager.js';
import { createConsoleCommands } from '../../utils/console-commands.js';
import { createTelemetryDashboard } from '../../utils/telemetry-dashboard.js';
import { createRequestQueue } from '../../utils/request-queue.js';
import { createCacheManager } from '../../utils/cache-manager.js';
import { createEventRecorder } from '../../utils/event-recorder.js';
import { registerLoaded } from '../../core/dependency-map.js';
import { getEnv, ENV } from '../../config.js';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap.phases.phase5-utils';

export async function initPhase5(context: Record<string, unknown>) {
  const config = context.config as Record<string, unknown>;
  const bootMetrics = context.bootMetrics as import("../types.js").ManagerRef | null;
  const logger = context.logger as import("../types.js").ManagerRef | null;
  
  bootMetrics?.startPhase('phase5');
  logger?.debug('Phase 5 starting...');
  
  let sanitizer = null, rateLimiter = null, devToolsPanel = null;
  let workerManager = null, consoleCommands = null, telemetryDashboard = null;
  let requestQueue = null, cacheManager = null, eventRecorder = null;
  
  if (config.enableSanitizer) {
    sanitizer = createSanitizer({ logAttempts: getEnv() !== ENV.PRODUCTION });
    registerLoaded('sanitizer');
  }
  
  if (config.enableRateLimiter) {
    rateLimiter = createRateLimiter({ maxRequests: 100, windowMs: 60000 });
    registerLoaded('rate-limiter');
  }
  
  if (config.enableDevToolsPanel) {
    devToolsPanel = createDevToolsPanel({ position: 'bottom-right', collapsed: true, theme: 'dark' });
    registerLoaded('devtools-panel');
  }
  
  // REMOVED 2026-04-29 — workers dormentes (ver /backup/remove-workers-20260429-183149/).
  // if (config.enableWorkerManager) {
  //   workerManager = createWorkerManager({ poolSize: navigator?.hardwareConcurrency || 4 });
  //   registerLoaded('worker-manager');
  // }
  
  if (config.enableConsoleCommands) {
    consoleCommands = createConsoleCommands({ prefix: 'cm' });
    registerLoaded('console-commands');
  }
  
  if (config.enableTelemetryDashboard) {
    telemetryDashboard = createTelemetryDashboard({ position: 'top-right' });
    registerLoaded('telemetry-dashboard');
  }
  
  if (config.enableRequestQueue) {
    requestQueue = createRequestQueue({ maxConcurrent: 6, maxQueueSize: 100, defaultTimeout: 30000 });
    registerLoaded('request-queue');
  }
  
  if (config.enableCacheManager) {
    cacheManager = createCacheManager({ maxSize: 1000, defaultTTL: 300000, evictionStrategy: 'lru' });
    registerLoaded('cache-manager');
  }
  
  if (config.enableEventRecorder) {
    eventRecorder = createEventRecorder({ maxEvents: 1000, captureEventBus: true });
    registerLoaded('event-recorder');
  }
  
  bootMetrics?.endPhase('phase5');
  logger?.debug('Phase 5 ready');
  
  return { sanitizer, rateLimiter, devToolsPanel, workerManager, consoleCommands, telemetryDashboard, requestQueue, cacheManager, eventRecorder };
}

export default { initPhase5 };

import { createSanitizer } from "../../utils/sanitizer.js";
import { createRateLimiter } from "../../utils/rate-limiter.js";
import { createDevToolsPanel } from "../../utils/devtools-panel/index.js";
import { createConsoleCommands } from "../../utils/console-commands.js";
import { createTelemetryDashboard } from "../../utils/telemetry-dashboard.js";
import { createRequestQueue } from "../../utils/request-queue.js";
import { createCacheManager } from "../../utils/cache-manager.js";
import { createEventRecorder } from "../../utils/event-recorder.js";
import { registerLoaded } from "../../core/dependency-map.js";
import { getEnv, ENV } from "../../config.js";
const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.phases.phase5-utils";
async function initPhase5(context) {
  const config = context.config;
  const bootMetrics = context.bootMetrics;
  const logger = context.logger;
  bootMetrics?.startPhase("phase5");
  logger?.debug("Phase 5 starting...");
  let sanitizer = null, rateLimiter = null, devToolsPanel = null;
  let workerManager = null, consoleCommands = null, telemetryDashboard = null;
  let requestQueue = null, cacheManager = null, eventRecorder = null;
  if (config.enableSanitizer) {
    sanitizer = createSanitizer({ logAttempts: getEnv() !== ENV.PRODUCTION });
    registerLoaded("sanitizer");
  }
  if (config.enableRateLimiter) {
    rateLimiter = createRateLimiter({ maxRequests: 100, windowMs: 6e4 });
    registerLoaded("rate-limiter");
  }
  if (config.enableDevToolsPanel) {
    devToolsPanel = createDevToolsPanel({ position: "bottom-right", collapsed: true, theme: "dark" });
    registerLoaded("devtools-panel");
  }
  if (config.enableConsoleCommands) {
    consoleCommands = createConsoleCommands({ prefix: "cm" });
    registerLoaded("console-commands");
  }
  if (config.enableTelemetryDashboard) {
    telemetryDashboard = createTelemetryDashboard({ position: "top-right" });
    registerLoaded("telemetry-dashboard");
  }
  if (config.enableRequestQueue) {
    requestQueue = createRequestQueue({ maxConcurrent: 6, maxQueueSize: 100, defaultTimeout: 3e4 });
    registerLoaded("request-queue");
  }
  if (config.enableCacheManager) {
    cacheManager = createCacheManager({ maxSize: 1e3, defaultTTL: 3e5, evictionStrategy: "lru" });
    registerLoaded("cache-manager");
  }
  if (config.enableEventRecorder) {
    eventRecorder = createEventRecorder({ maxEvents: 1e3, captureEventBus: true });
    registerLoaded("event-recorder");
  }
  bootMetrics?.endPhase("phase5");
  logger?.debug("Phase 5 ready");
  return { sanitizer, rateLimiter, devToolsPanel, workerManager, consoleCommands, telemetryDashboard, requestQueue, cacheManager, eventRecorder };
}
var phase5_utils_default = { initPhase5 };
export {
  MODULE_ID,
  VERSION,
  phase5_utils_default as default,
  initPhase5
};

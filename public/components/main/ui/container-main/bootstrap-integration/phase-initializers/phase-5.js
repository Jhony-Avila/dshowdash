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
const MODULE_ID = "main.ui.container-main.bootstrap-integration.phase-initializers.phase-5";
async function initPhase5(context) {
  const config = context.config;
  const bootMetrics = context.bootMetrics;
  const managers = context.managers;
  const logger = context.logger;
  bootMetrics?.startPhase("phase5");
  logger?.debug("Phase 5 starting...");
  if (config.enableSanitizer) {
    managers.set("sanitizer", createSanitizer({ logAttempts: getEnv() !== ENV.PRODUCTION }));
    registerLoaded("sanitizer");
  }
  if (config.enableRateLimiter) {
    managers.set("rateLimiter", createRateLimiter({ maxRequests: 100, windowMs: 6e4 }));
    registerLoaded("rate-limiter");
  }
  if (config.enableDevToolsPanel) {
    managers.set("devToolsPanel", createDevToolsPanel({ position: "bottom-right", collapsed: true, theme: "dark" }));
    registerLoaded("devtools-panel");
  }
  if (config.enableConsoleCommands) {
    managers.set("consoleCommands", createConsoleCommands({ prefix: "cm" }));
    registerLoaded("console-commands");
  }
  if (config.enableTelemetryDashboard) {
    managers.set("telemetryDashboard", createTelemetryDashboard({ position: "top-right" }));
    registerLoaded("telemetry-dashboard");
  }
  if (config.enableRequestQueue) {
    managers.set("requestQueue", createRequestQueue({ maxConcurrent: 6, maxQueueSize: 100, defaultTimeout: 3e4 }));
    registerLoaded("request-queue");
  }
  if (config.enableCacheManager) {
    managers.set("cacheManager", createCacheManager({ maxSize: 1e3, defaultTTL: 3e5, evictionStrategy: "lru" }));
    registerLoaded("cache-manager");
  }
  if (config.enableEventRecorder) {
    managers.set("eventRecorder", createEventRecorder({ maxEvents: 1e3, captureEventBus: true }));
    registerLoaded("event-recorder");
  }
  bootMetrics?.endPhase("phase5");
  logger?.debug("Phase 5 ready");
}
var phase_5_default = { initPhase5 };
export {
  MODULE_ID,
  VERSION,
  phase_5_default as default,
  initPhase5
};

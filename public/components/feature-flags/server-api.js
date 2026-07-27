import { getPort, log } from "./ports.js";
import { FlagRegistry } from "./core/registry.js";
import { trackFlagEvent } from "./telemetry/tracker.js";
import { FEATURE_FLAGS_EVENTS } from "/core/runtime/events/catalog/feature-flags.events.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.feature-flags.server-api";
const CONFIG = {
  endpoints: {
    list: "/api/feature-flags/?action=list",
    check: "/api/feature-flags/?action=check&flag="
  },
  retry: { maxAttempts: 3, baseDelay: 1e3, maxDelay: 5e3 },
  timeout: 1e4
};
let serverFlags = {};
let lastFetchTime = 0;
let _abortController = null;
function getServerFlags() {
  return { ...serverFlags };
}
function getLastFetchTime() {
  return lastFetchTime;
}
function getAbortController() {
  return _abortController;
}
function setAbortController(ctrl) {
  _abortController = ctrl;
}
function resetServerState() {
  serverFlags = {};
  lastFetchTime = 0;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function fetchWithRetry(url, options = {}, attempt = 1) {
  const { maxAttempts, baseDelay, maxDelay } = CONFIG.retry;
  if (!_abortController || _abortController.signal.aborted) {
    _abortController = new AbortController();
  }
  const fetchOptions = {
    method: "GET",
    credentials: "include",
    headers: { "Accept": "application/json" },
    ...options,
    signal: _abortController.signal
  };
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      _abortController.abort();
    }, CONFIG.timeout);
    fetch(url, fetchOptions).then((response) => {
      clearTimeout(timeoutId);
      if (!response.ok && attempt < maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        log("warn", `Request failed (${response.status}), retry ${attempt}/${maxAttempts}`);
        return sleep(delay).then(() => fetchWithRetry(url, options, attempt + 1)).then(resolve).catch(reject);
      }
      resolve(response);
    }).catch((error) => {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        reject(new Error("REQUEST_TIMEOUT"));
        return;
      }
      if (attempt < maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        log("warn", `Request error, retry ${attempt}/${maxAttempts}`);
        sleep(delay).then(() => {
          _abortController = new AbortController();
          return fetchWithRetry(url, options, attempt + 1);
        }).then(resolve).catch(reject);
        return;
      }
      reject(error);
    });
  });
}
function fetchFlagsFromServer(environment = "production", metrics, emit, trackTelemetry) {
  return new Promise((resolve) => {
    const url = `${CONFIG.endpoints.list}&env=${environment}`;
    fetchWithRetry(url).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }).then((data) => {
      if (data.ok && data.flags) {
        serverFlags = data.flags;
        lastFetchTime = Date.now();
        metrics.fetchCount++;
        for (const [flagKey, flagData] of Object.entries(data.flags)) {
          if (flagData.enabled) FlagRegistry.enable(flagKey);
          else FlagRegistry.disable(flagKey);
          if (flagData.payload) {
            FlagRegistry.update(flagKey, { payload: flagData.payload });
          }
        }
        trackFlagEvent("flags:server:fetched", {
          count: Object.keys(data.flags).length,
          environment: data.environment
        });
        trackTelemetry("fetched", {
          count: Object.keys(data.flags).length,
          environment
        });
        const eventBus = getPort("eventBus");
        if (eventBus?.emit) {
          eventBus.emit(FEATURE_FLAGS_EVENTS.SERVER_UPDATED, {
            flags: data.flags,
            timestamp: Date.now()
          });
        }
      }
      resolve(data);
    }).catch((error) => {
      metrics.errorCount++;
      trackFlagEvent("flags:server:fetch-error", { error: error.message });
      trackTelemetry("error", { action: "fetch", error: error.message });
      const eventBus = getPort("eventBus");
      if (eventBus?.emit) {
        eventBus.emit(FEATURE_FLAGS_EVENTS.ERROR, {
          action: "fetch",
          error: error.message
        });
      }
      log("warn", "Server fetch error:", error.message);
      resolve({ ok: false, error: error.message });
    });
  });
}
function checkFlagOnServer(flagKey, metrics, emit, trackTelemetry) {
  return new Promise((resolve) => {
    fetchWithRetry(CONFIG.endpoints.check + encodeURIComponent(flagKey)).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }).then((data) => {
      if (data.ok) {
        metrics.checkCount++;
        if (data.enabled) FlagRegistry.enable(flagKey);
        else FlagRegistry.disable(flagKey);
        trackFlagEvent("flags:server:checked", {
          flag: flagKey,
          enabled: data.enabled,
          source: data.source
        });
        trackTelemetry("checked", {
          flag: flagKey,
          enabled: data.enabled
        });
      }
      resolve(data);
    }).catch((error) => {
      metrics.errorCount++;
      trackTelemetry("error", {
        action: "check",
        flag: flagKey,
        error: error.message
      });
      const eventBus = getPort("eventBus");
      if (eventBus?.emit) {
        eventBus.emit(FEATURE_FLAGS_EVENTS.ERROR, {
          action: "check",
          flag: flagKey,
          error: error.message
        });
      }
      resolve({ ok: false, error: error.message });
    });
  });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    serverFlagsCount: Object.keys(serverFlags).length,
    lastFetchTime,
    timestamp: Date.now()
  };
}
var server_api_default = {
  fetchFlagsFromServer,
  checkFlagOnServer,
  getServerFlags,
  getLastFetchTime,
  resetServerState,
  info,
  VERSION,
  MODULE_ID
};
export {
  CONFIG,
  MODULE_ID,
  VERSION,
  checkFlagOnServer,
  server_api_default as default,
  fetchFlagsFromServer,
  fetchWithRetry,
  getAbortController,
  getLastFetchTime,
  getServerFlags,
  info,
  resetServerState,
  setAbortController
};

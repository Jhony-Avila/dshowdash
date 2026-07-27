import { hasWindow, getPort, log } from "./ports.js";
import { DEVICE_EVENTS } from "/core/runtime/events/catalog/device.events.js";
import {
  generateDeviceId,
  generateFingerprint,
  detectDeviceType,
  detectBrowser,
  detectOS
} from "./device-detection.js";
const VERSION = "1.2.0-P2-ENTERPRISE";
const MODULE_ID = "components.device-manager.api-operations";
const ENDPOINTS = {
  list: "/api/devices/?action=list",
  current: "/api/devices/?action=current",
  register: "/api/devices/?action=register",
  trust: "/api/devices/?action=trust",
  rename: "/api/devices/?action=rename",
  delete: "/api/devices/"
};
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1e3,
  maxDelay: 5e3,
  timeout: 1e4
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function fetchWithRetry(url, options = {}, abortController, attempt = 1) {
  if (!hasWindow) return Promise.resolve(null);
  if (!abortController.current || abortController.current.signal.aborted) {
    abortController.current = new AbortController();
  }
  const fetchOptions = {
    ...options,
    credentials: "include",
    signal: abortController.current.signal
  };
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      abortController.current.abort();
    }, RETRY_CONFIG.timeout);
    fetch(url, fetchOptions).then((response) => {
      clearTimeout(timeoutId);
      if (!response.ok && attempt < RETRY_CONFIG.maxAttempts) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
          RETRY_CONFIG.maxDelay
        );
        log("warn", `Request failed (${response.status}), retry ${attempt}`);
        return sleep(delay).then(() => fetchWithRetry(url, options, abortController, attempt + 1)).then(resolve);
      }
      resolve(response);
    }).catch((error) => {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        reject(new Error("REQUEST_TIMEOUT"));
        return;
      }
      if (attempt < RETRY_CONFIG.maxAttempts) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
          RETRY_CONFIG.maxDelay
        );
        sleep(delay).then(() => {
          abortController.current = new AbortController();
          return fetchWithRetry(url, options, abortController, attempt + 1);
        }).then(resolve).catch(reject);
      } else {
        reject(error);
      }
    });
  });
}
function trackTelemetry(action, data = {}, metrics) {
  metrics.lastActivity = Date.now();
  const tt = getPort("telemetryTracker");
  if (hasWindow && tt && tt.track) {
    tt.track(`device-manager:${action}`, { timestamp: Date.now(), ...data });
  }
}
function listDevices(abortController, metrics, emit) {
  if (!hasWindow) return Promise.resolve([]);
  return fetchWithRetry(ENDPOINTS.list, {}, abortController).then((response) => response.json()).then((data) => {
    if (data.ok) {
      metrics.listCount++;
      trackTelemetry("list", { count: (data.devices || []).length }, metrics);
      emit(DEVICE_EVENTS.LIST, { devices: data.devices || [] });
      return data.devices || [];
    }
    throw new Error(data.error || "FETCH_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "list", error: error.message }, metrics);
    emit(DEVICE_EVENTS.ERROR, { action: "list", error: error.message });
    throw error;
  });
}
function getCurrentDevice(abortController, metrics, emit) {
  if (!hasWindow) return Promise.resolve(null);
  return fetchWithRetry(ENDPOINTS.current, {}, abortController).then((response) => response.json()).then((data) => {
    if (data.ok) {
      trackTelemetry("current", { deviceId: data.device ? data.device.id : null }, metrics);
      emit(DEVICE_EVENTS.CURRENT, { device: data.device });
      return data.device;
    }
    throw new Error(data.error || "FETCH_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "current", error: error.message }, metrics);
    emit(DEVICE_EVENTS.ERROR, { action: "current", error: error.message });
    throw error;
  });
}
function registerDevice(customName, abortController, metrics, emit) {
  if (!hasWindow) return Promise.resolve(null);
  const deviceId = generateDeviceId();
  return generateFingerprint().then((fingerprint) => {
    const payload = {
      device_id: deviceId,
      fingerprint,
      device_name: customName || `${detectBrowser()} em ${detectOS()}`,
      device_type: detectDeviceType(),
      browser: detectBrowser(),
      os: detectOS()
    };
    return fetchWithRetry(ENDPOINTS.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }, abortController);
  }).then((response) => response.json()).then((data) => {
    if (data.ok) {
      metrics.registerCount++;
      trackTelemetry("registered", { deviceId: data.device_id, action: data.action }, metrics);
      emit(DEVICE_EVENTS.REGISTERED, { device_id: data.device_id, action: data.action });
      return data;
    }
    throw new Error(data.error || "REGISTER_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "register", error: error.message }, metrics);
    emit(DEVICE_EVENTS.ERROR, { action: "register", error: error.message });
    throw error;
  });
}
function setDeviceTrust(deviceId, trustLevel, abortController, metrics, emit) {
  if (!hasWindow) return Promise.resolve(null);
  return fetchWithRetry(ENDPOINTS.trust, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: deviceId, trust_level: trustLevel })
  }, abortController).then((response) => response.json()).then((data) => {
    if (data.ok) {
      trackTelemetry("trust-updated", { deviceId, trustLevel }, metrics);
      emit(DEVICE_EVENTS.TRUST_UPDATED, { device_id: deviceId, trust_level: trustLevel });
      return data;
    }
    throw new Error(data.error || "TRUST_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "trust", error: error.message }, metrics);
    emit(DEVICE_EVENTS.ERROR, { action: "trust", error: error.message });
    throw error;
  });
}
function renameDevice(deviceId, newName, abortController, metrics, emit) {
  if (!hasWindow) return Promise.resolve(null);
  return fetchWithRetry(ENDPOINTS.rename, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: deviceId, device_name: newName })
  }, abortController).then((response) => response.json()).then((data) => {
    if (data.ok) {
      trackTelemetry("renamed", { deviceId, newName }, metrics);
      emit(DEVICE_EVENTS.RENAMED, { device_id: deviceId, device_name: newName });
      return data;
    }
    throw new Error(data.error || "RENAME_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "rename", error: error.message }, metrics);
    emit(DEVICE_EVENTS.ERROR, { action: "rename", error: error.message });
    throw error;
  });
}
function removeDevice(deviceId, abortController, metrics, emit) {
  if (!hasWindow) return Promise.resolve(null);
  return fetchWithRetry(`${ENDPOINTS.delete}?id=${deviceId}`, {
    method: "DELETE"
  }, abortController).then((response) => response.json()).then((data) => {
    if (data.ok) {
      trackTelemetry("removed", { deviceId }, metrics);
      emit(DEVICE_EVENTS.REMOVED, { device_id: deviceId });
      return data;
    }
    throw new Error(data.error || "DELETE_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "remove", error: error.message }, metrics);
    emit(DEVICE_EVENTS.ERROR, { action: "remove", error: error.message });
    throw error;
  });
}
function healthCheck() {
  return {
    status: "HEALTHY",
    score: 1,
    maxScore: 1,
    scoreDisplay: "1/1",
    checks: { available: true },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    endpoints: ENDPOINTS,
    retryConfig: RETRY_CONFIG,
    timestamp: Date.now()
  };
}
var api_operations_default = {
  listDevices,
  getCurrentDevice,
  registerDevice,
  setDeviceTrust,
  renameDevice,
  removeDevice,
  trackTelemetry,
  fetchWithRetry,
  healthCheck,
  info,
  ENDPOINTS,
  RETRY_CONFIG,
  VERSION,
  MODULE_ID
};
export {
  ENDPOINTS,
  MODULE_ID,
  RETRY_CONFIG,
  VERSION,
  api_operations_default as default,
  fetchWithRetry,
  getCurrentDevice,
  healthCheck,
  info,
  listDevices,
  registerDevice,
  removeDevice,
  renameDevice,
  setDeviceTrust,
  trackTelemetry
};

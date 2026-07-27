import { hasWindow } from "./ports.js";
const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.device-manager.device-detection";
const CONFIG = {
  storageKey: "dshow_device_id",
  fingerprintKey: "dshow_device_fingerprint"
};
function generateDeviceId() {
  if (!hasWindow) return `dev-ssr-${Date.now().toString(36)}`;
  const stored = localStorage.getItem(CONFIG.storageKey);
  if (stored) return stored;
  const id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem(CONFIG.storageKey, id);
  return id;
}
function generateFingerprint() {
  if (!hasWindow) return Promise.resolve("fp-ssr");
  const stored = localStorage.getItem(CONFIG.fingerprintKey);
  if (stored) return Promise.resolve(stored);
  const components = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    screen.colorDepth,
    (/* @__PURE__ */ new Date()).getTimezoneOffset(),
    navigator.hardwareConcurrency || "unknown",
    navigator.deviceMemory || "unknown"
  ];
  const str = components.join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(CONFIG.fingerprintKey, hash);
    return hash;
  }).catch(() => {
    const fallback = btoa(str).substr(0, 64);
    localStorage.setItem(CONFIG.fingerprintKey, fallback);
    return fallback;
  });
}
function detectDeviceType() {
  if (!hasWindow) return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    return /ipad|tablet/i.test(ua) ? "tablet" : "mobile";
  }
  return "desktop";
}
function detectBrowser() {
  if (!hasWindow) return "Unknown";
  const ua = navigator.userAgent;
  if (ua.indexOf("Firefox") > -1) return "Firefox";
  if (ua.indexOf("Edg") > -1) return "Edge";
  if (ua.indexOf("Chrome") > -1) return "Chrome";
  if (ua.indexOf("Safari") > -1) return "Safari";
  if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) return "Opera";
  return "Unknown";
}
function detectOS() {
  if (!hasWindow) return "Unknown";
  const ua = navigator.userAgent;
  if (ua.indexOf("Windows") > -1) return "Windows";
  if (ua.indexOf("Mac") > -1) return "macOS";
  if (ua.indexOf("Linux") > -1) return "Linux";
  if (ua.indexOf("Android") > -1) return "Android";
  if (ua.indexOf("iOS") > -1 || ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) return "iOS";
  return "Unknown";
}
function clearStoredData() {
  if (!hasWindow) return;
  localStorage.removeItem(CONFIG.storageKey);
  localStorage.removeItem(CONFIG.fingerprintKey);
}
function hasDeviceId() {
  return hasWindow && !!localStorage.getItem(CONFIG.storageKey);
}
function hasFingerprint() {
  return hasWindow && !!localStorage.getItem(CONFIG.fingerprintKey);
}
function getStoredDeviceId() {
  return hasWindow ? localStorage.getItem(CONFIG.storageKey) : null;
}
function healthCheck() {
  const checks = {
    hasWindow,
    hasDeviceId: hasDeviceId(),
    hasFingerprint: hasFingerprint(),
    hasCrypto: hasWindow && typeof crypto !== "undefined" && !!crypto.subtle
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= 2 ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    deviceType: detectDeviceType(),
    browser: detectBrowser(),
    os: detectOS(),
    hasDeviceId: hasDeviceId(),
    hasFingerprint: hasFingerprint(),
    timestamp: Date.now()
  };
}
var device_detection_default = {
  generateDeviceId,
  generateFingerprint,
  detectDeviceType,
  detectBrowser,
  detectOS,
  clearStoredData,
  hasDeviceId,
  hasFingerprint,
  getStoredDeviceId,
  healthCheck,
  info,
  CONFIG,
  VERSION,
  MODULE_ID
};
export {
  CONFIG,
  MODULE_ID,
  VERSION,
  clearStoredData,
  device_detection_default as default,
  detectBrowser,
  detectDeviceType,
  detectOS,
  generateDeviceId,
  generateFingerprint,
  getStoredDeviceId,
  hasDeviceId,
  hasFingerprint,
  healthCheck,
  info
};

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.device-manager.device-detection
// PURPOSE: Device detection, fingerprinting, browser and OS detection
// ───────────────────────────────────────────────────────────────
// @contract GENERATE_DEVICE_ID - generateDeviceId() generates/retrieves device ID
// @contract GENERATE_FINGERPRINT - generateFingerprint() generates device fingerprint
// @contract DETECT_DEVICE_TYPE - detectDeviceType() detects device type (mobile/tablet/desktop)
// @contract DETECT_BROWSER - detectBrowser() detects browser name
// @contract DETECT_OS - detectOS() detects operating system
// @contract CLEAR_STORED_DATA - clearStoredData() clears stored device data
// @contract HAS_DEVICE_ID - hasDeviceId() checks if device ID exists
// @contract HAS_FINGERPRINT - hasFingerprint() checks if fingerprint exists
// @contract GET_STORED_DEVICE_ID - getStoredDeviceId() returns stored device ID
// @contract HEALTH - info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: hasWindow from ./ports.js
// PROVIDES: generateDeviceId, generateFingerprint, detectDeviceType, detectBrowser,
//           detectOS, clearStoredData, hasDeviceId, hasFingerprint, getStoredDeviceId,
//           CONFIG, info, VERSION, MODULE_ID
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { hasWindow } from './ports.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.device-manager.device-detection';

export const CONFIG = {
  storageKey: 'dshow_device_id',
  fingerprintKey: 'dshow_device_fingerprint'
};

export function generateDeviceId() {
  if (!hasWindow) return `dev-ssr-${Date.now().toString(36)}`;

  const stored = localStorage.getItem(CONFIG.storageKey);
  if (stored) return stored;

  const id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem(CONFIG.storageKey, id);
  return id;
}

export function generateFingerprint() {
  if (!hasWindow) return Promise.resolve('fp-ssr');

  const stored = localStorage.getItem(CONFIG.fingerprintKey);
  if (stored) return Promise.resolve(stored);

  const components = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    (navigator as any).deviceMemory || 'unknown'
  ];

  const str = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(str);

  return crypto.subtle.digest('SHA-256', data)
    .then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(CONFIG.fingerprintKey, hash);
      return hash;
    })
    .catch(() => {
      const fallback = btoa(str).substr(0, 64);
      localStorage.setItem(CONFIG.fingerprintKey, fallback);
      return fallback;
    });
}

export function detectDeviceType() {
  if (!hasWindow) return 'unknown';

  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

export function detectBrowser() {
  if (!hasWindow) return 'Unknown';

  const ua = navigator.userAgent;
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Edg') > -1) return 'Edge';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
  return 'Unknown';
}

export function detectOS() {
  if (!hasWindow) return 'Unknown';

  const ua = navigator.userAgent;
  if (ua.indexOf('Windows') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'macOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';
  return 'Unknown';
}

export function clearStoredData() {
  if (!hasWindow) return;
  localStorage.removeItem(CONFIG.storageKey);
  localStorage.removeItem(CONFIG.fingerprintKey);
}

export function hasDeviceId() {
  return hasWindow && !!localStorage.getItem(CONFIG.storageKey);
}

export function hasFingerprint() {
  return hasWindow && !!localStorage.getItem(CONFIG.fingerprintKey);
}

export function getStoredDeviceId() {
  return hasWindow ? localStorage.getItem(CONFIG.storageKey) : null;
}

export function healthCheck() {
  const checks = {
    hasWindow,
    hasDeviceId: hasDeviceId(),
    hasFingerprint: hasFingerprint(),
    hasCrypto: hasWindow && typeof crypto !== 'undefined' && !!crypto.subtle
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed >= 2 ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
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

export default {
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

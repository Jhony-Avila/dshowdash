// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.analytics-manager.utils.helpers
// PURPOSE: Helper functions for analytics tracking and data processing
// ───────────────────────────────────────────────────────────────
// @contract GENERATE_USER_ID - generateUserId() generates unique user ID
// @contract GET_DEVICE_INFO - getDeviceInfo() returns device information
// @contract GET_PAGE_INFO - getPageInfo() returns current page information
// @contract CALCULATE_SESSION_DURATION - calculateSessionDuration(session) calculates session duration
// @contract FORMAT_DURATION - formatDuration(ms) formats duration in human-readable format
// @contract HASH_STRING - hashString(str) generates hash from string
// @contract SANITIZE_EVENT_DATA - sanitizeEventData(data) sanitizes event data
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES: generateUserId, getDeviceInfo, getPageInfo, calculateSessionDuration,
//           formatDuration, hashString, sanitizeEventData, healthCheck, info, getVersion,
//           injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v2.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.4.0-ENTERPRISE: Export VERSION padronizado
// @changelog P17WI: Migração para PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.analytics-manager.utils.helpers';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';
const hasLocalStorage = (() => {
  try {
    if (!hasWindow) return false;
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
})();

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() {
  Ports.init();
}

function _getPort(name: string) {
  return Ports.get(name);
}

export function injectPorts(p: Record<string, unknown>) {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

export const generateUserId = () => {
  if (!hasLocalStorage) {
    return `anon-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
  }
  try {
    let userId = localStorage.getItem('dshowdash-analytics-user-id');
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
      localStorage.setItem('dshowdash-analytics-user-id', userId);
    }
    return userId;
  } catch (e) {
    return `anon-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
  }
};

export const getDeviceInfo = () => {
  if (!hasWindow || typeof navigator === 'undefined') {
    return {
      userAgent: '',
      language: '',
      platform: '',
      cookieEnabled: false,
      onLine: false,
      screenWidth: 0,
      screenHeight: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      pixelRatio: 1
    };
  }
  return {
    userAgent: navigator.userAgent || '',
    language: navigator.language || '',
    platform: navigator.platform || '',
    cookieEnabled: navigator.cookieEnabled || false,
    onLine: navigator.onLine || false,
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
    viewportWidth: window.innerWidth || 0,
    viewportHeight: window.innerHeight || 0,
    pixelRatio: window.devicePixelRatio || 1
  };
};

export const getPageInfo = () => {
  if (!hasWindow) {
    return { url: '', path: '', hash: '', search: '', referrer: '', title: '' };
  }
  _initPorts();
  const router = _getPort('router');
  let route = null;

  if (router && router.getCurrentRoute) {
    try {
      route = router.getCurrentRoute();
    } catch (e) { /* ignore */ }
  }

  let url = '', path = '', hash = '', search = '';

  if (route) {
    url = route.url || route.href || '';
    path = route.path || route.pathname || '';
    hash = route.hash || '';
    search = route.search || route.query || '';
  }

  if (!url && typeof window !== 'undefined' && window.location) {
    url = window.location.href || '';
    path = window.location.pathname || '';
    hash = window.location.hash || '';
    search = window.location.search || '';
  }

  return {
    url,
    path,
    hash,
    search,
    referrer: hasDocument ? document.referrer : '',
    title: hasDocument ? document.title : ''
  };
};

export const calculateSessionDuration = (session: { startTime: number; endTime?: number | null }) => {
  if (!session || !session.startTime) return 0;
  const endTime = session.endTime || Date.now();
  return endTime - session.startTime;
};

export const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

export const hashString = (str: string) => {
  if (typeof str !== 'string') return '0';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export const sanitizeEventData = (data: Record<string, unknown>) => {
  if (!data || typeof data !== 'object') return {};
  const sanitized: Record<string, string | number | boolean | null> = {};
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = null;
    } else {
      sanitized[key] = String(value);
    }
  }
  return sanitized;
};

export const getVersion = () => VERSION;

export const healthCheck = () => {
  const ps = Ports.snapshot();
  const checks = {
    hasWindow,
    hasDocument,
    hasLocalStorage,
    generateUserIdAvailable: typeof generateUserId === 'function',
    getDeviceInfoAvailable: typeof getDeviceInfo === 'function',
    getPageInfoAvailable: typeof getPageInfo === 'function',
    routerAvailable: !!_getPort('router'),
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed >= 4 ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
};

export const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  environment: { hasWindow, hasDocument, hasLocalStorage },
  healthCheck: healthCheck(),
  timestamp: Date.now()
});

export default {
  generateUserId,
  getDeviceInfo,
  getPageInfo,
  calculateSessionDuration,
  formatDuration,
  hashString,
  sanitizeEventData,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};

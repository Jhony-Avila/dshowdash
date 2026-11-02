
// Network Detector - Dynamic Timeout based on Network Conditions
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description #2 - Ajuste dinâmico de timeouts baseado na qualidade da conexão
// @changelog v1.0.0-RESILIENCE: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: detectNetworkQuality(), getNetworkInfo(), calculateAdjustedTimeout(),
//   getPhaseTimeout(), onNetworkChange(), isOnline(), isNetworkPoor(), getQualityLevel()
// BROWSER APIs:
//   navigator.connection — LEGÍTIMO: Network Information API
//   navigator.onLine — LEGÍTIMO: online/offline detection
//   window.addEventListener('online'/'offline') — LEGÍTIMO: connectivity events
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';
// WINDOW ACCESS: navigator.connection, navigator.onLine, window events
// ═══════════════════════════════════════════════════════════════
'use strict';

var MODULE_ID = 'network-detector';
var VERSION = '1.1.0-HEALTH-CONTRACT';

// Network quality levels
var NETWORK_QUALITY = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown'
};

// Timeout multipliers by quality
var TIMEOUT_MULTIPLIERS: Record<string, number> = {
  excellent: 0.8,
  good: 1.0,
  fair: 1.5,
  poor: 2.5,
  offline: 0,
  unknown: 1.2
};

// Effective type to quality mapping
var EFFECTIVE_TYPE_QUALITY: Record<string, string> = {
  '4g': NETWORK_QUALITY.EXCELLENT,
  '3g': NETWORK_QUALITY.GOOD,
  '2g': NETWORK_QUALITY.FAIR,
  'slow-2g': NETWORK_QUALITY.POOR
};

// Types
interface NetworkInfo {
  quality: string;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
  online: boolean;
}

interface TimeoutOptions {
  forceRefresh?: boolean;
  minMultiplier?: number;
  maxMultiplier?: number;
  minTimeout?: number;
  maxTimeout?: number;
}

// Cache for network info
var _cachedInfo: NetworkInfo | null = null;
var _cacheTimestamp: number | null = null;
var _cacheMaxAge = 5000; // 5 seconds

// Listeners for network changes
var _listeners: Array<(info: NetworkInfo) => void> = [];

// Get network connection API
function getConnection() {
  if (typeof navigator === 'undefined') return null;
  return (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection || null;
}

// Detect current network quality
function detectNetworkQuality() {
  // Check if online
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      quality: NETWORK_QUALITY.OFFLINE,
      effectiveType: null,
      downlink: 0,
      rtt: Infinity,
      saveData: false,
      online: false
    };
  }
  
  var connection = getConnection();
  
  if (!connection) {
    return {
      quality: NETWORK_QUALITY.UNKNOWN,
      effectiveType: null,
      downlink: null,
      rtt: null,
      saveData: false,
      online: true
    };
  }
  
  var effectiveType = connection.effectiveType || null;
  var downlink = connection.downlink || null;
  var rtt = connection.rtt || null;
  var saveData = connection.saveData || false;
  
  // Determine quality
  var quality = NETWORK_QUALITY.UNKNOWN;
  
  if (effectiveType) {
    quality = EFFECTIVE_TYPE_QUALITY[effectiveType] || NETWORK_QUALITY.UNKNOWN;
  }
  
  // Refine based on RTT if available
  if (rtt !== null) {
    if (rtt < 50) {
      quality = NETWORK_QUALITY.EXCELLENT;
    } else if (rtt < 100) {
      quality = NETWORK_QUALITY.GOOD;
    } else if (rtt < 300) {
      quality = NETWORK_QUALITY.FAIR;
    } else {
      quality = NETWORK_QUALITY.POOR;
    }
  }
  
  // Downgrade if saveData is enabled
  if (saveData && quality === NETWORK_QUALITY.EXCELLENT) {
    quality = NETWORK_QUALITY.GOOD;
  }
  
  return {
    quality: quality,
    effectiveType: effectiveType,
    downlink: downlink,
    rtt: rtt,
    saveData: saveData,
    online: true
  };
}

// Get cached or fresh network info
function getNetworkInfo(forceRefresh?: boolean) {
  if (!forceRefresh && _cachedInfo && _cacheTimestamp) {
    var age = Date.now() - _cacheTimestamp;
    if (age < _cacheMaxAge) {
      return _cachedInfo;
    }
  }
  
  _cachedInfo = detectNetworkQuality();
  _cacheTimestamp = Date.now();
  
  return _cachedInfo;
}

// Calculate adjusted timeout
function calculateAdjustedTimeout(baseTimeout: number, options?: TimeoutOptions) {
  if (options === undefined) options = {};
  
  var networkInfo = getNetworkInfo(options.forceRefresh);
  var multiplier = TIMEOUT_MULTIPLIERS[networkInfo.quality] || 1.0;
  
  // Apply minimum/maximum bounds
  var minMultiplier = options.minMultiplier || 0.5;
  var maxMultiplier = options.maxMultiplier || 3.0;
  
  multiplier = Math.max(minMultiplier, Math.min(maxMultiplier, multiplier));
  
  var adjustedTimeout = Math.round(baseTimeout * multiplier);
  
  // Apply absolute bounds
  var minTimeout = options.minTimeout || 1000;
  var maxTimeout = options.maxTimeout || 120000;
  
  adjustedTimeout = Math.max(minTimeout, Math.min(maxTimeout, adjustedTimeout));
  
  return {
    original: baseTimeout,
    adjusted: adjustedTimeout,
    multiplier: multiplier,
    networkQuality: networkInfo.quality,
    networkInfo: networkInfo
  };
}

// Get timeout for a specific phase
function getPhaseTimeout(phaseId: string, baseTimeout: number) {
  var result = calculateAdjustedTimeout(baseTimeout);
  
  return {
    timeout: result.adjusted,
    phase: phaseId,
    baseTimeout: baseTimeout,
    multiplier: result.multiplier,
    networkQuality: result.networkQuality
  };
}

// Subscribe to network changes
function onNetworkChange(handler: (info: NetworkInfo) => void) {
  _listeners.push(handler);
  
  // Setup listener if first subscriber
  if (_listeners.length === 1) {
    _setupNetworkListeners();
  }
  
  // Return unsubscribe function
  return function() {
    var idx = _listeners.indexOf(handler);
    if (idx !== -1) {
      _listeners.splice(idx, 1);
    }
    
    // Remove listeners if no subscribers
    if (_listeners.length === 0) {
      _removeNetworkListeners();
    }
  };
}

// Internal: setup network listeners
var _boundHandleChange: (() => void) | null = null;

function _setupNetworkListeners() {
  if (typeof window === 'undefined') return;
  
  _boundHandleChange = function() {
    _cachedInfo = null; // Invalidate cache
    var info = getNetworkInfo(true);
    _listeners.forEach(function(handler) {
      try { handler(info); } catch (e) {}
    });
  };
  
  // Online/offline events
  window.addEventListener('online', _boundHandleChange);
  window.addEventListener('offline', _boundHandleChange);
  
  // Connection change event
  var connection = getConnection();
  if (connection && connection.addEventListener) {
    connection.addEventListener('change', _boundHandleChange);
  }
}

function _removeNetworkListeners() {
  if (typeof window === 'undefined' || !_boundHandleChange) return;
  
  window.removeEventListener('online', _boundHandleChange);
  window.removeEventListener('offline', _boundHandleChange);
  
  var connection = getConnection();
  if (connection && connection.removeEventListener) {
    connection.removeEventListener('change', _boundHandleChange);
  }
  
  _boundHandleChange = null;
}

// Check if online
function isOnline() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

// Check if network is poor
function isNetworkPoor() {
  var info = getNetworkInfo();
  return info.quality === NETWORK_QUALITY.POOR || info.quality === NETWORK_QUALITY.OFFLINE;
}

// Get quality level (numeric)
function getQualityLevel() {
  var info = getNetworkInfo();
  var levels: Record<string, number> = {
    excellent: 4,
    good: 3,
    fair: 2,
    poor: 1,
    offline: 0,
    unknown: 2
  };
  return levels[info.quality] || 2;
}

function info() {
  var networkInfo = getNetworkInfo();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    networkInfo: networkInfo,
    qualityLevel: getQualityLevel(),
    isOnline: isOnline(),
    isPoor: isNetworkPoor(),
    timeoutMultipliers: TIMEOUT_MULTIPLIERS,
    improvements: ['#2-DynamicTimeouts']
  };
}

function healthCheck() {
  var networkInfo = getNetworkInfo();
  var status: string = HEALTH_STATUS.HEALTHY;

  if (networkInfo.quality === NETWORK_QUALITY.OFFLINE) {
    status = HEALTH_STATUS.UNHEALTHY;
  } else if (networkInfo.quality === NETWORK_QUALITY.POOR) {
    status = HEALTH_STATUS.DEGRADED;
  }

  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      networkQuality: networkInfo.quality,
      online: networkInfo.online
    }
  });
}

export {
  NETWORK_QUALITY,
  TIMEOUT_MULTIPLIERS,
  detectNetworkQuality,
  getNetworkInfo,
  calculateAdjustedTimeout,
  getPhaseTimeout,
  onNetworkChange,
  isOnline,
  isNetworkPoor,
  getQualityLevel,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  NETWORK_QUALITY: NETWORK_QUALITY,
  TIMEOUT_MULTIPLIERS: TIMEOUT_MULTIPLIERS,
  detectNetworkQuality: detectNetworkQuality,
  getNetworkInfo: getNetworkInfo,
  calculateAdjustedTimeout: calculateAdjustedTimeout,
  getPhaseTimeout: getPhaseTimeout,
  onNetworkChange: onNetworkChange,
  isOnline: isOnline,
  isNetworkPoor: isNetworkPoor,
  getQualityLevel: getQualityLevel,
  info: info,
  healthCheck: healthCheck,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};

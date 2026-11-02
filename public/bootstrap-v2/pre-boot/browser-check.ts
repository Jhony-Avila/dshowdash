
// Browser Check - Browser Compatibility Validator
// @version 1.2.0-HEALTH-CONTRACT
// @changelog v1.2.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
// @description QW#07 + #15 - Verificação de browser com cache de resultados idempotentes
// @changelog v1.1.0-PERSISTENCE: #15 - Cache de resultados idempotentes
// @changelog v1.0.0-QUICKWINS: QW#07 - Verificação inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
// PROVIDES: detectBrowser(), checkBrowserVersion(), checkRequiredFeatures(),
//   runFullCheck(), clearCache(), isCached(), getCacheStats()
// BROWSER APIs:
//   navigator.userAgent — LEGÍTIMO: browser detection
//   window[feature] — LEGÍTIMO: feature detection (Promise, fetch, etc.)
// WINDOW ACCESS: navigator.userAgent, window[feature] (feature detection)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

var MODULE_ID = 'browser-check';
var VERSION = '1.2.0-HEALTH-CONTRACT';

interface BrowserInfo { browser: string; version: number; userAgent: string; }
interface BrowserVersionResult { browser: string; version: number; minRequired: number; supported: boolean; warning: string | null; }
interface FeatureCheckResult { supported: string[]; missing: string[]; allSupported: boolean; }
interface FullCheckResult { canBoot: boolean; browser: BrowserVersionResult; features: FeatureCheckResult; warnings: string[]; errors: string[]; timestamp: number; cached: boolean; cachedAt?: number; }

// #15: Cache de resultados idempotentes
var _cache: {
  browserInfo: null | BrowserInfo;
  browserVersion: null | BrowserVersionResult;
  requiredFeatures: null | FeatureCheckResult;
  fullCheck: null | FullCheckResult;
  cacheTimestamp: null | number;
} = {
  browserInfo: null,
  browserVersion: null,
  requiredFeatures: null,
  fullCheck: null,
  cacheTimestamp: null
};

// QW#07: Requisitos mínimos do browser
var BROWSER_REQUIREMENTS = {
  chrome: 80,
  firefox: 75,
  safari: 13,
  edge: 80,
  opera: 67
};

// QW#07: Features obrigatórias
var REQUIRED_FEATURES = [
  'Promise',
  'fetch',
  'Object.assign',
  'Array.prototype.includes',
  'customElements'
];

// QW#07: Detectar browser e versão
function detectBrowser() {
  // #15: Retornar do cache se disponível
  if (_cache.browserInfo !== null) {
    return _cache.browserInfo;
  }
  
  var ua = navigator.userAgent;
  var browser = 'unknown';
  var version = 0;
  
  if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Edg') === -1) {
    browser = 'chrome';
    var match = ua.match(/Chrome\/(\d+)/);
    if (match) version = parseInt(match[1], 10);
  } else if (ua.indexOf('Firefox') !== -1) {
    browser = 'firefox';
    var match = ua.match(/Firefox\/(\d+)/);
    if (match) version = parseInt(match[1], 10);
  } else if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) {
    browser = 'safari';
    var match = ua.match(/Version\/(\d+)/);
    if (match) version = parseInt(match[1], 10);
  } else if (ua.indexOf('Edg') !== -1) {
    browser = 'edge';
    var match = ua.match(/Edg\/(\d+)/);
    if (match) version = parseInt(match[1], 10);
  } else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) {
    browser = 'opera';
    var match = ua.match(/(?:Opera|OPR)\/(\d+)/);
    if (match) version = parseInt(match[1], 10);
  }
  
  var result = { browser: browser, version: version, userAgent: ua };
  
  // #15: Cachear resultado (browser não muda durante sessão)
  _cache.browserInfo = result;
  
  return result;
}

// QW#07: Verificar versão do browser
function checkBrowserVersion() {
  // #15: Retornar do cache se disponível
  if (_cache.browserVersion !== null) {
    return _cache.browserVersion;
  }
  
  var info = detectBrowser();
  var minVersion = BROWSER_REQUIREMENTS[info.browser as keyof typeof BROWSER_REQUIREMENTS] || 0;
  
  var result = {
    browser: info.browser,
    version: info.version,
    minRequired: minVersion,
    supported: info.version >= minVersion || info.browser === 'unknown',
    warning: info.browser === 'unknown' ? 'Browser not recognized' : null
  };
  
  // #15: Cachear resultado
  _cache.browserVersion = result;
  
  return result;
}

// QW#07: Verificar features obrigatórias
function checkRequiredFeatures() {
  // #15: Retornar do cache se disponível
  if (_cache.requiredFeatures !== null) {
    return _cache.requiredFeatures;
  }
  
  var missing = [];
  var supported = [];
  
  for (var i = 0; i < REQUIRED_FEATURES.length; i++) {
    var feature = REQUIRED_FEATURES[i];
    var available = false;
    
    try {
      if (feature.indexOf('.') !== -1) {
        var parts = feature.split('.');
        var obj: unknown = window;
        for (var j = 0; j < parts.length; j++) {
          obj = (obj as Record<string, unknown>)[parts[j]];
          if (obj === undefined) break;
        }
        available = obj !== undefined;
      } else {
        available = typeof (window as unknown as Record<string, unknown>)[feature] !== 'undefined';
      }
    } catch (e) {
      available = false;
    }
    
    if (available) {
      supported.push(feature);
    } else {
      missing.push(feature);
    }
  }
  
  var result = {
    supported: supported,
    missing: missing,
    allSupported: missing.length === 0
  };
  
  // #15: Cachear resultado (features não mudam durante sessão)
  _cache.requiredFeatures = result;
  
  return result;
}

// QW#07: Executar verificação completa
function runFullCheck() {
  // #15: Retornar do cache se disponível
  if (_cache.fullCheck !== null) {
    // Atualizar apenas o timestamp para indicar quando foi consultado
    return Object.assign({}, _cache.fullCheck, { 
      timestamp: Date.now(),
      cached: true,
      cachedAt: _cache.cacheTimestamp
    });
  }
  
  var browserCheck = checkBrowserVersion();
  var featureCheck = checkRequiredFeatures();
  
  var warnings = [];
  var errors = [];
  
  if (!browserCheck.supported) {
    warnings.push('Browser version ' + browserCheck.version + ' is below minimum ' + browserCheck.minRequired);
  }
  
  if (browserCheck.warning) {
    warnings.push(browserCheck.warning);
  }
  
  if (!featureCheck.allSupported) {
    errors.push('Missing required features: ' + featureCheck.missing.join(', '));
  }
  
  var canBoot = errors.length === 0;
  
  var result = {
    canBoot: canBoot,
    browser: browserCheck,
    features: featureCheck,
    warnings: warnings,
    errors: errors,
    timestamp: Date.now(),
    cached: false
  };
  
  // #15: Cachear resultado completo
  _cache.fullCheck = result;
  _cache.cacheTimestamp = Date.now();
  
  return result;
}

// #15: Limpar cache (útil para testes)
function clearCache() {
  _cache = {
    browserInfo: null,
    browserVersion: null,
    requiredFeatures: null,
    fullCheck: null,
    cacheTimestamp: null
  };
  return true;
}

// #15: Verificar se tem cache
function isCached() {
  return _cache.fullCheck !== null;
}

// #15: Obter estatísticas do cache
function getCacheStats() {
  return {
    isCached: isCached(),
    cacheTimestamp: _cache.cacheTimestamp,
    cacheAge: _cache.cacheTimestamp ? Date.now() - _cache.cacheTimestamp : null,
    cachedItems: {
      browserInfo: _cache.browserInfo !== null,
      browserVersion: _cache.browserVersion !== null,
      requiredFeatures: _cache.requiredFeatures !== null,
      fullCheck: _cache.fullCheck !== null
    }
  };
}

function info() {
  var check = runFullCheck();
  var cacheStats = getCacheStats();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    canBoot: check.canBoot,
    browser: check.browser.browser + ' ' + check.browser.version,
    missingFeatures: check.features.missing.length,
    warnings: check.warnings.length,
    errors: check.errors.length,
    cached: check.cached,
    cacheStats: cacheStats,
    improvements: ['QW07-BrowserCheck', '#15-IdempotentCache']
  };
}

function healthCheck() {
  var check = runFullCheck();
  
  var status: string = HEALTH_STATUS.HEALTHY;
  if (!check.canBoot) {
    status = HEALTH_STATUS.UNHEALTHY;
  }
  
  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      canBoot: check.canBoot,
      browserSupported: check.browser.supported,
      allFeaturesAvailable: check.features.allSupported
    },
    details: {
      browser: check.browser.browser,
      browserVersion: check.browser.version,
      missingFeatures: check.features.missing.length,
      cached: check.cached
    }
  });
}

export {
  BROWSER_REQUIREMENTS,
  REQUIRED_FEATURES,
  detectBrowser,
  checkBrowserVersion,
  checkRequiredFeatures,
  runFullCheck,
  clearCache,
  isCached,
  getCacheStats,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  BROWSER_REQUIREMENTS: BROWSER_REQUIREMENTS,
  REQUIRED_FEATURES: REQUIRED_FEATURES,
  detectBrowser: detectBrowser,
  checkBrowserVersion: checkBrowserVersion,
  checkRequiredFeatures: checkRequiredFeatures,
  runFullCheck: runFullCheck,
  clearCache: clearCache,
  isCached: isCached,
  getCacheStats: getCacheStats,
  info: info,
  healthCheck: healthCheck,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};

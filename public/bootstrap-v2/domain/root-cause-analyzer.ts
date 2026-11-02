
// Root Cause Analyzer - Error diagnostics and root cause detection
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description Sprint 7D #28 - Análise de causa raiz para falhas de boot
// @changelog v1.0.0-DIAGNOSTICS: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: analyze(), updateContext(), recordError(), getPhaseAnalysis(),
//   getRecentAnalyses(), getErrorTrends(), getSuggestions(), clearHistory(), reset()
// BROWSER APIs:
//   navigator.getBattery — optional async battery check (non-blocking)
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';
'use strict';

var MODULE_ID = 'root-cause-analyzer';
var VERSION = '1.1.0-HEALTH-CONTRACT';

// Cause types
var CAUSE_TYPES = {
  DEPENDENCY_FAILED: 'DEPENDENCY_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  MODULE_LOAD_ERROR: 'MODULE_LOAD_ERROR',
  INITIALIZATION_ERROR: 'INITIALIZATION_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  RESOURCE_UNAVAILABLE: 'RESOURCE_UNAVAILABLE',
  MEMORY_EXHAUSTED: 'MEMORY_EXHAUSTED',
  CYCLIC_DEPENDENCY: 'CYCLIC_DEPENDENCY',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  BROWSER_INCOMPATIBLE: 'BROWSER_INCOMPATIBLE',
  UNKNOWN: 'UNKNOWN'
};

// Contributing factors
var CONTRIBUTING_FACTORS = {
  SLOW_NETWORK: 'SLOW_NETWORK',
  HIGH_MEMORY: 'HIGH_MEMORY',
  MULTIPLE_TABS: 'MULTIPLE_TABS',
  EXTENSIONS: 'EXTENSIONS',
  LOW_BATTERY: 'LOW_BATTERY',
  PREVIOUS_ERRORS: 'PREVIOUS_ERRORS',
  COLD_START: 'COLD_START'
};

// Error patterns for detection
var ERROR_PATTERNS = [
  { pattern: /failed to fetch|network|ERR_NETWORK/i, cause: CAUSE_TYPES.NETWORK_ERROR },
  { pattern: /timeout|timed out|ETIMEDOUT/i, cause: CAUSE_TYPES.TIMEOUT },
  { pattern: /cannot read|undefined is not|null is not/i, cause: CAUSE_TYPES.INITIALIZATION_ERROR },
  { pattern: /module|import|export|require/i, cause: CAUSE_TYPES.MODULE_LOAD_ERROR },
  { pattern: /config|configuration|missing.*(key|property)/i, cause: CAUSE_TYPES.CONFIGURATION_ERROR },
  { pattern: /permission|denied|forbidden|401|403/i, cause: CAUSE_TYPES.PERMISSION_DENIED },
  { pattern: /memory|heap|allocation/i, cause: CAUSE_TYPES.MEMORY_EXHAUSTED },
  { pattern: /circular|cyclic|recursion/i, cause: CAUSE_TYPES.CYCLIC_DEPENDENCY },
  { pattern: /not supported|incompatible|polyfill/i, cause: CAUSE_TYPES.BROWSER_INCOMPATIBLE }
];

// Types
interface RCANetworkInfo {
  quality: string;
}

interface RCAMemoryInfo {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface RCAErrorRecord {
  error: string;
  phaseId: string | null;
  moduleId: string | null;
  timestamp: number;
}

interface RCAAnalysis {
  primaryCause: string;
  failedDependency: string | null;
  contributingFactors: string[];
  suggestion: string;
  confidence: number;
  phaseId: string | null;
  moduleId: string | null;
  errorMessage: string | null;
  timestamp: number;
  context: { networkQuality: string; memoryUsage: string; recentErrors: number };
}

interface AnalysisContext {
  failedDependency: string | null;
  contributingFactors: string[];
}

interface AnalyzeOptions {
  error?: { message?: string; [key: string]: unknown };
  phaseId?: string;
  moduleId?: string;
  dependencies?: string[];
  phaseResults?: Record<string, { success: boolean }>;
  networkState?: RCANetworkInfo;
  memoryState?: RCAMemoryInfo;
}

interface ContextUpdate {
  networkInfo?: RCANetworkInfo;
  memoryInfo?: RCAMemoryInfo;
  previousErrors?: RCAErrorRecord[];
}

// Analysis history
var _analysisHistory: RCAAnalysis[] = [];
var _maxHistory = 50;

// Cached context for analysis
var _contextCache: {
  networkInfo: RCANetworkInfo | null;
  memoryInfo: RCAMemoryInfo | null;
  previousErrors: RCAErrorRecord[];
  timestamp: number | null;
} = {
  networkInfo: null,
  memoryInfo: null,
  previousErrors: [],
  timestamp: null
};

// Update context cache
function updateContext(context: ContextUpdate) {
  _contextCache = {
    networkInfo: context.networkInfo || _contextCache.networkInfo,
    memoryInfo: context.memoryInfo || _contextCache.memoryInfo,
    previousErrors: context.previousErrors || _contextCache.previousErrors,
    timestamp: Date.now()
  };
}

// Add error to context
function recordError(error: { message?: string }, phaseId: string | null, moduleId: string | null) {
  _contextCache.previousErrors.push({
    error: error.message || String(error),
    phaseId: phaseId,
    moduleId: moduleId,
    timestamp: Date.now()
  });
  
  // Keep only last 20 errors
  if (_contextCache.previousErrors.length > 20) {
    _contextCache.previousErrors = _contextCache.previousErrors.slice(-20);
  }
}

// Detect primary cause from error
function _detectPrimaryCause(error: { message?: string }) {
  var errorMessage = error.message || String(error);
  
  for (var i = 0; i < ERROR_PATTERNS.length; i++) {
    if (ERROR_PATTERNS[i].pattern.test(errorMessage)) {
      return ERROR_PATTERNS[i].cause;
    }
  }
  
  return CAUSE_TYPES.UNKNOWN;
}

// Check if dependency failed
function _checkDependencyFailure(phaseId: string | undefined, dependencies: string[], phaseResults: Record<string, { success: boolean }>) {
  if (!dependencies || dependencies.length === 0) return null;
  if (!phaseResults) return null;
  
  for (var i = 0; i < dependencies.length; i++) {
    var depId = dependencies[i];
    var depResult = phaseResults[depId];
    
    if (!depResult || !depResult.success) {
      return depId;
    }
  }
  
  return null;
}

// Detect contributing factors
function _detectContributingFactors() {
  var factors = [];
  
  // Check network
  if (_contextCache.networkInfo) {
    var quality = _contextCache.networkInfo.quality;
    if (quality === 'poor' || quality === 'fair') {
      factors.push(CONTRIBUTING_FACTORS.SLOW_NETWORK);
    }
  }
  
  // Check memory
  if (_contextCache.memoryInfo) {
    var usedPercent = _contextCache.memoryInfo.usedJSHeapSize / _contextCache.memoryInfo.jsHeapSizeLimit;
    if (usedPercent > 0.8) {
      factors.push(CONTRIBUTING_FACTORS.HIGH_MEMORY);
    }
  }
  
  // Check previous errors
  var recentErrors = _contextCache.previousErrors.filter(function(e) {
    return (Date.now() - e.timestamp) < 60000; // Last minute
  });
  if (recentErrors.length > 2) {
    factors.push(CONTRIBUTING_FACTORS.PREVIOUS_ERRORS);
  }
  
  // Check battery (if available)
  if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
    try {
      // Async check - won't be included in sync analysis
    } catch (e) {}
  }
  
  return factors;
}

// Generate suggestion based on cause
function _generateSuggestion(cause: string, context: AnalysisContext) {
  var suggestions = {
    [CAUSE_TYPES.DEPENDENCY_FAILED]: function() {
      return 'A dependent phase (' + (context.failedDependency || 'unknown') + ') failed. Check that phase\'s errors first.';
    },
    [CAUSE_TYPES.NETWORK_ERROR]: function() {
      return 'Network request failed. Check internet connectivity and server availability.';
    },
    [CAUSE_TYPES.TIMEOUT]: function() {
      return 'Operation timed out. This may be due to slow network or overloaded server. Consider increasing timeout.';
    },
    [CAUSE_TYPES.MODULE_LOAD_ERROR]: function() {
      return 'Failed to load a JavaScript module. Check that all module paths are correct and files exist.';
    },
    [CAUSE_TYPES.INITIALIZATION_ERROR]: function() {
      return 'Module initialization failed. Check for null/undefined values in the code.';
    },
    [CAUSE_TYPES.CONFIGURATION_ERROR]: function() {
      return 'Configuration issue detected. Verify that all required config values are set.';
    },
    [CAUSE_TYPES.RESOURCE_UNAVAILABLE]: function() {
      return 'A required resource is unavailable. Check server logs and resource paths.';
    },
    [CAUSE_TYPES.MEMORY_EXHAUSTED]: function() {
      return 'Memory limit reached. Try closing other tabs or increasing available memory.';
    },
    [CAUSE_TYPES.CYCLIC_DEPENDENCY]: function() {
      return 'Circular dependency detected. Review module imports and phase dependencies.';
    },
    [CAUSE_TYPES.PERMISSION_DENIED]: function() {
      return 'Permission denied. Check authentication status and user permissions.';
    },
    [CAUSE_TYPES.BROWSER_INCOMPATIBLE]: function() {
      return 'Browser compatibility issue. Some features may require a modern browser.';
    },
    [CAUSE_TYPES.UNKNOWN]: function() {
      return 'Unknown error. Check browser console for more details.';
    }
  };
  
  var fn = suggestions[cause];
  return fn ? fn() : 'No specific suggestion available.';
}

// Calculate confidence based on evidence
function _calculateConfidence(cause: string, context: AnalysisContext) {
  var confidence = 0.5; // Base confidence
  
  // Increase confidence based on evidence
  if (context.failedDependency && cause === CAUSE_TYPES.DEPENDENCY_FAILED) {
    confidence += 0.3;
  }
  
  if (context.contributingFactors.indexOf(CONTRIBUTING_FACTORS.SLOW_NETWORK) !== -1 && 
      (cause === CAUSE_TYPES.NETWORK_ERROR || cause === CAUSE_TYPES.TIMEOUT)) {
    confidence += 0.2;
  }
  
  if (context.contributingFactors.indexOf(CONTRIBUTING_FACTORS.HIGH_MEMORY) !== -1 && 
      cause === CAUSE_TYPES.MEMORY_EXHAUSTED) {
    confidence += 0.25;
  }
  
  if (context.contributingFactors.indexOf(CONTRIBUTING_FACTORS.PREVIOUS_ERRORS) !== -1) {
    confidence += 0.1;
  }
  
  // Cap at 0.95
  return Math.min(confidence, 0.95);
}

// Main analysis function
function analyze(options: AnalyzeOptions) {
  if (options === undefined) options = {};
  
  var error = options.error;
  var phaseId = options.phaseId;
  var moduleId = options.moduleId;
  var dependencies = options.dependencies || [];
  var phaseResults = options.phaseResults || {};
  var networkState = options.networkState;
  var memoryState = options.memoryState;
  
  // Update context if provided
  if (networkState) _contextCache.networkInfo = networkState;
  if (memoryState) _contextCache.memoryInfo = memoryState;
  
  // Record error
  if (error) {
    // @ts-expect-error strict migration — TS2345
    recordError(error, phaseId, moduleId);
  }
  
  // Check for dependency failure first
  var failedDependency = _checkDependencyFailure(phaseId, dependencies, phaseResults);
  
  // Detect primary cause
  var primaryCause;
  if (failedDependency) {
    primaryCause = CAUSE_TYPES.DEPENDENCY_FAILED;
  } else if (error) {
    primaryCause = _detectPrimaryCause(error);
  } else {
    primaryCause = CAUSE_TYPES.UNKNOWN;
  }
  
  // Detect contributing factors
  var contributingFactors = _detectContributingFactors();
  
  // Build analysis context
  var analysisContext = {
    failedDependency: failedDependency,
    contributingFactors: contributingFactors
  };
  
  // Generate suggestion
  var suggestion = _generateSuggestion(primaryCause, analysisContext);
  
  // Calculate confidence
  var confidence = _calculateConfidence(primaryCause, analysisContext);
  
  // Build result
  var result = {
    primaryCause: primaryCause,
    failedDependency: failedDependency,
    contributingFactors: contributingFactors,
    suggestion: suggestion,
    confidence: confidence,
    phaseId: phaseId,
    moduleId: moduleId,
    errorMessage: error ? (error.message || String(error)) : null,
    timestamp: Date.now(),
    context: {
      networkQuality: _contextCache.networkInfo ? _contextCache.networkInfo.quality : 'unknown',
      memoryUsage: _contextCache.memoryInfo ? 
        Math.round((_contextCache.memoryInfo.usedJSHeapSize / _contextCache.memoryInfo.jsHeapSizeLimit) * 100) + '%' : 
        'unknown',
      recentErrors: _contextCache.previousErrors.length
    }
  };
  
  // Record in history
  // @ts-expect-error strict migration — TS2345
  _analysisHistory.unshift(result);
  while (_analysisHistory.length > _maxHistory) {
    _analysisHistory.pop();
  }
  
  return result;
}

// Get analysis for a specific phase
function getPhaseAnalysis(phaseId: string) {
  return _analysisHistory.filter(function(a) {
    return a.phaseId === phaseId;
  });
}

// Get recent analyses
function getRecentAnalyses(count: number) {
  return _analysisHistory.slice(0, count || 10);
}

// Get error trends
function getErrorTrends() {
  var byCause: Record<string, number> = {};
  var byPhase: Record<string, number> = {};
  
  _analysisHistory.forEach(function(a) {
    byCause[a.primaryCause] = (byCause[a.primaryCause] || 0) + 1;
    if (a.phaseId) {
      byPhase[a.phaseId] = (byPhase[a.phaseId] || 0) + 1;
    }
  });
  
  return {
    byCause: byCause,
    byPhase: byPhase,
    totalAnalyses: _analysisHistory.length,
    mostCommonCause: Object.keys(byCause).sort(function(a, b) { 
      return byCause[b] - byCause[a]; 
    })[0] || null
  };
}

// Get suggestions for multiple errors
function getSuggestions(analyses?: Array<{ primaryCause: string; suggestion: string; confidence: number; phaseId?: string }>) {
  if (!analyses || analyses.length === 0) {
    // @ts-expect-error strict migration — TS2322
    analyses = _analysisHistory.slice(0, 5);
  }
  
  var suggestions: Array<{ cause: string; suggestion: string; confidence: number; affectedPhases: (string | undefined)[] }> = [];
  var seenCauses: Record<string, boolean> = {};
  
  analyses!.forEach(function(a) {
    if (!seenCauses[a.primaryCause]) {
      seenCauses[a.primaryCause] = true;
      suggestions.push({
        cause: a.primaryCause,
        suggestion: a.suggestion,
        confidence: a.confidence,
        affectedPhases: analyses!.filter(function(x) { 
          return x.primaryCause === a.primaryCause; 
        }).map(function(x) { return x.phaseId; })
      });
    }
  });
  
  return suggestions.sort(function(a, b) {
    return b.confidence - a.confidence;
  });
}

// Clear history
function clearHistory() {
  _analysisHistory = [];
  _contextCache.previousErrors = [];
}

// Reset
function reset() {
  _analysisHistory = [];
  _contextCache = {
    networkInfo: null,
    memoryInfo: null,
    previousErrors: [],
    timestamp: null
  };
}

function info() {
  var trends = getErrorTrends();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    analysisCount: _analysisHistory.length,
    mostCommonCause: trends.mostCommonCause,
    causeTypes: Object.keys(CAUSE_TYPES),
    contextAge: _contextCache.timestamp ? Date.now() - _contextCache.timestamp : null,
    improvements: ['#28-RootCauseAnalysis']
  };
}

function healthCheck() {
  var trends = getErrorTrends();
  var status: string = HEALTH_STATUS.HEALTHY;

  if (_analysisHistory.length > 10) {
    status = HEALTH_STATUS.DEGRADED;
  }

  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      totalAnalyses: _analysisHistory.length,
      mostCommonCause: trends.mostCommonCause
    }
  });
}

export {
  CAUSE_TYPES,
  CONTRIBUTING_FACTORS,
  analyze,
  updateContext,
  recordError,
  getPhaseAnalysis,
  getRecentAnalyses,
  getErrorTrends,
  getSuggestions,
  clearHistory,
  reset,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  CAUSE_TYPES: CAUSE_TYPES,
  CONTRIBUTING_FACTORS: CONTRIBUTING_FACTORS,
  analyze: analyze,
  updateContext: updateContext,
  recordError: recordError,
  getPhaseAnalysis: getPhaseAnalysis,
  getRecentAnalyses: getRecentAnalyses,
  getErrorTrends: getErrorTrends,
  getSuggestions: getSuggestions,
  clearHistory: clearHistory,
  reset: reset,
  info: info,
  healthCheck: healthCheck,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};

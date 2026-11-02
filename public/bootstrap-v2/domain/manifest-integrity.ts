
// Manifest Integrity - Hash validation for boot manifest
// @version 2.1.0-HEALTH-CONTRACT
// @changelog v2.1.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v2.0.1-CONTRACTS: Dependency Contract formalizado
// @description Sprint 7A #7 - Validação de integridade com SHA-256 e persistência
// @changelog v2.0.0-SHA256: Suporte a SHA-256 via Web Crypto API, persistência de hash
// @changelog v1.0.0-RESILIENCE: Versão inicial com FNV-1a
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
// PROVIDES: hashString(), hashStringSHA256(), hashObject(), hashObjectAsync(),
//   calculateManifestHash(), calculateManifestHashAsync(), storeHash(),
//   storeHashAsync(), validateIntegrity(), validateIntegrityAsync(), wasTampered()
// BROWSER APIs:
//   window.crypto.subtle.digest — LEGÍTIMO: SHA-256 via Web Crypto API
//   sessionStorage — LEGÍTIMO: hash persistence across navigations
// WINDOW ACCESS: window.crypto (Web Crypto API — read-only)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

// Types
interface ManifestLike {
  version?: string;
  phases?: Array<ManifestPhase>;
  globalTimeout?: number;
  global?: { defaultTimeout?: number; defaultRetry?: unknown };
  retryPolicy?: unknown;
}

interface ManifestPhase {
  id: string;
  order?: number;
  critical?: boolean;
  timeout?: number;
  dependsOn?: string[];
  recoverable?: boolean;
}

interface ValidationIssue {
  type: string;
  severity: string;
  message: string;
  expected?: string;
  actual?: string;
  storedAt?: number;
}

interface IntegrityOptions {
  checkPersisted?: boolean;
  skipHashCheck?: boolean;
}

var MODULE_ID = 'manifest-integrity';
var VERSION = '2.1.0-HEALTH-CONTRACT';

// Storage key for persisted hash
var STORAGE_KEY = 'bootstrap-v2:manifest-hash';
var STORAGE_META_KEY = 'bootstrap-v2:manifest-hash-meta';

// Stored hash for comparison
var _storedHash: string | null = null;
var _storedHashMeta: { timestamp: number; algorithm: string; manifestVersion?: string } | null = null;
var _lastValidation: { timestamp: number; hash: string | null; valid: boolean; issueCount: number; algorithm: string; storedHash?: string | null } | null = null;
var _validationHistory: typeof _lastValidation[] = [];
var _maxHistory = 20;
var _useWebCrypto = false;

// Check Web Crypto availability
function _checkWebCrypto() {
  try {
    return !!(window.crypto && window.crypto.subtle && window.crypto.subtle.digest);
  } catch (e) {
    return false;
  }
}

// Initialize
(function() {
  _useWebCrypto = _checkWebCrypto();
})();

// Simple hash function (FNV-1a) - fallback
function hashStringFNV(str: string) {
  var hash = 2166136261;
  for (var i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

// SHA-256 hash via Web Crypto API
async function hashStringSHA256(str: string) {
  if (!_useWebCrypto) {
    return hashStringFNV(str);
  }
  
  try {
    var encoder = new TextEncoder();
    var data = encoder.encode(str);
    var hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    var hashHex = hashArray.map(function(b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
    return hashHex;
  } catch (e) {
    // Fallback to FNV-1a
    return hashStringFNV(str);
  }
}

// Synchronous hash (FNV-1a only)
function hashString(str: string) {
  return hashStringFNV(str);
}

// Hash an object (deterministic)
function hashObject(obj: Record<string, unknown>): string {
  var keys = Object.keys(obj).sort();
  var parts = [];
  
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = obj[key];
    
    if (value === null || value === undefined) {
      parts.push(key + ':null');
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        parts.push(key + ':[' + value.map(function(v: unknown) {
          return typeof v === 'object' ? hashObject(v as Record<string, unknown>) : String(v);
        }).join(',') + ']');
      } else {
        parts.push(key + ':{' + hashObject(value as Record<string, unknown>) + '}');
      }
    } else {
      parts.push(key + ':' + String(value));
    }
  }
  
  return hashString(parts.join('|'));
}

// Async hash object with SHA-256
async function hashObjectAsync(obj: Record<string, unknown>) {
  var keys = Object.keys(obj).sort();
  var parts = [];
  
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = obj[key];
    
    if (value === null || value === undefined) {
      parts.push(key + ':null');
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        var arrayParts = [];
        for (var j = 0; j < value.length; j++) {
          var v = value[j];
          arrayParts.push(typeof v === 'object' ? hashObject(v as Record<string, unknown>) : String(v));
        }
        parts.push(key + ':[' + arrayParts.join(',') + ']');
      } else {
        parts.push(key + ':{' + hashObject(value as Record<string, unknown>) + '}');
      }
    } else {
      parts.push(key + ':' + String(value));
    }
  }
  
  return await hashStringSHA256(parts.join('|'));
}

// Extract critical parts of manifest for hashing
function extractCriticalParts(manifest: ManifestLike | null) {
  if (!manifest) return null;
  
  return {
    version: manifest.version,
    phases: (manifest.phases || []).map(function(p) {
      return {
        id: p.id,
        order: p.order,
        critical: p.critical,
        timeout: p.timeout,
        dependsOn: p.dependsOn,
        recoverable: p.recoverable
      };
    }),
    globalTimeout: manifest.globalTimeout || manifest.global?.defaultTimeout,
    retryPolicy: manifest.retryPolicy || manifest.global?.defaultRetry
  };
}

// Calculate manifest hash (sync - FNV-1a)
function calculateManifestHash(manifest: ManifestLike) {
  var criticalParts = extractCriticalParts(manifest);
  if (!criticalParts) return null;
  return hashObject(criticalParts);
}

// Calculate manifest hash (async - SHA-256)
async function calculateManifestHashAsync(manifest: ManifestLike) {
  var criticalParts = extractCriticalParts(manifest);
  if (!criticalParts) return null;
  return await hashObjectAsync(criticalParts);
}

// Load persisted hash from storage
function loadPersistedHash() {
  try {
    var stored = sessionStorage.getItem(STORAGE_KEY);
    var meta = sessionStorage.getItem(STORAGE_META_KEY);
    
    if (stored && meta) {
      _storedHash = stored;
      _storedHashMeta = JSON.parse(meta);
      return true;
    }
  } catch (e) {
    // Storage not available
  }
  return false;
}

// Persist hash to storage
function persistHash(hash: string | null, meta: typeof _storedHashMeta) {
  try {
    // @ts-expect-error strict migration — TS2345
    sessionStorage.setItem(STORAGE_KEY, hash);
    sessionStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
    return true;
  } catch (e) {
    return false;
  }
}

// Clear persisted hash
function clearPersistedHash() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_META_KEY);
  } catch (e) {}
}

// Store initial hash (sync)
function storeHash(manifest: ManifestLike) {
  _storedHash = calculateManifestHash(manifest);
  _storedHashMeta = {
    timestamp: Date.now(),
    algorithm: 'fnv-1a',
    manifestVersion: manifest?.version
  };
  
  persistHash(_storedHash, _storedHashMeta);
  
  _lastValidation = {
    timestamp: Date.now(),
    hash: _storedHash,
    valid: true,
    issueCount: 0,
    algorithm: 'fnv-1a'
  };

  return _storedHash;
}

// Store initial hash (async - SHA-256)
async function storeHashAsync(manifest: ManifestLike) {
  _storedHash = await calculateManifestHashAsync(manifest);
  _storedHashMeta = {
    timestamp: Date.now(),
    algorithm: _useWebCrypto ? 'sha-256' : 'fnv-1a',
    manifestVersion: manifest?.version
  };

  persistHash(_storedHash, _storedHashMeta);

  _lastValidation = {
    timestamp: Date.now(),
    hash: _storedHash,
    valid: true,
    issueCount: 0,
    algorithm: _storedHashMeta.algorithm
  };
  
  return _storedHash;
}

// Validate manifest integrity (sync)
function validateIntegrity(manifest: ManifestLike, options?: IntegrityOptions) {
  if (options === undefined) options = {};

  var currentHash = calculateManifestHash(manifest);
  var isValid = true;
  var issues: ValidationIssue[] = [];
  
  // Try to load persisted hash if not in memory
  if (!_storedHash && options.checkPersisted !== false) {
    loadPersistedHash();
  }
  
  // Check against stored hash
  if (_storedHash && currentHash !== _storedHash) {
    isValid = false;
    issues.push({
      type: 'HASH_MISMATCH',
      severity: 'critical',
      message: 'Manifest hash changed since initial load',
      expected: _storedHash,
      // @ts-expect-error strict migration — TS2322
      actual: currentHash,
      storedAt: _storedHashMeta?.timestamp
    });
  }
  
  // Validate structure
  if (!manifest) {
    isValid = false;
    issues.push({ type: 'NULL_MANIFEST', severity: 'critical', message: 'Manifest is null or undefined' });
  } else {
    // Check required fields
    if (!manifest.version) {
      issues.push({ type: 'MISSING_VERSION', severity: 'warning', message: 'Manifest version is missing' });
    }
    
    if (!manifest.phases || !Array.isArray(manifest.phases)) {
      isValid = false;
      issues.push({ type: 'INVALID_PHASES', severity: 'critical', message: 'Manifest phases array is invalid' });
    } else {
      // Check phase integrity
      var phaseIds: Record<string, boolean> = {};
      var phaseOrders: Record<number, string> = {};
      
      manifest.phases.forEach(function(phase: ManifestPhase, index: number) {
        if (!phase.id) {
          issues.push({ type: 'PHASE_NO_ID', severity: 'critical', message: 'Phase at index ' + index + ' has no id' });
          isValid = false;
        } else {
          if (phaseIds[phase.id]) {
            isValid = false;
            issues.push({ type: 'DUPLICATE_PHASE_ID', severity: 'critical', message: 'Duplicate phase id: ' + phase.id });
          }
          phaseIds[phase.id] = true;
        }
        
        if (phase.order === undefined) {
          issues.push({ type: 'PHASE_NO_ORDER', severity: 'warning', message: 'Phase ' + phase.id + ' has no order' });
        } else {
          if (phaseOrders[phase.order]) {
            issues.push({ type: 'DUPLICATE_ORDER', severity: 'warning', message: 'Duplicate order ' + phase.order + ': ' + phase.id + ' and ' + phaseOrders[phase.order] });
          }
          phaseOrders[phase.order] = phase.id;
        }
        
        // Check dependencies exist
        if (phase.dependsOn && Array.isArray(phase.dependsOn)) {
          phase.dependsOn.forEach(function(depId: string) {
            var depExists = manifest.phases!.some(function(p: ManifestPhase) { return p.id === depId; });
            if (!depExists) {
              issues.push({ type: 'MISSING_DEPENDENCY', severity: 'critical', message: 'Phase ' + phase.id + ' depends on non-existent phase: ' + depId });
              isValid = false;
            }
          });
        }
      });
    }
  }
  
  // Record validation
  var validation = {
    timestamp: Date.now(),
    hash: currentHash,
    storedHash: _storedHash,
    valid: isValid,
    issueCount: issues.length,
    criticalCount: issues.filter(function(i) { return i.severity === 'critical'; }).length,
    issues: issues,
    algorithm: 'fnv-1a'
  };
  
  _lastValidation = validation;
  // @ts-expect-error strict migration — TS2345
  _validationHistory.unshift(validation);
  while (_validationHistory.length > _maxHistory) {
    _validationHistory.pop();
  }
  
  return {
    valid: isValid,
    hash: currentHash,
    storedHash: _storedHash,
    hashMatch: _storedHash ? currentHash === _storedHash : true,
    issues: issues,
    criticalIssues: issues.filter(function(i) { return i.severity === 'critical'; }),
    warnings: issues.filter(function(i) { return i.severity === 'warning'; }),
    timestamp: Date.now()
  };
}

// Validate with SHA-256 (async)
async function validateIntegrityAsync(manifest: ManifestLike, options: IntegrityOptions) {
  if (options === undefined) options = {};
  
  var currentHash = await calculateManifestHashAsync(manifest);
  var syncResult = validateIntegrity(manifest, Object.assign({}, options, { skipHashCheck: true }));
  
  // Additional SHA-256 hash check
  if (_storedHash && _storedHashMeta?.algorithm === 'sha-256') {
    if (currentHash !== _storedHash) {
      syncResult.valid = false;
      syncResult.issues.unshift({
        type: 'SHA256_MISMATCH',
        severity: 'critical',
        message: 'SHA-256 hash mismatch detected',
        expected: _storedHash,
        // @ts-expect-error strict migration — TS2322
        actual: currentHash
      });
    }
  }
  
  syncResult.hash = currentHash;
  (syncResult as any).algorithm = _useWebCrypto ? 'sha-256' : 'fnv-1a';
  
  return syncResult;
}

// Check if manifest was tampered
function wasTampered(manifest: ManifestLike) {
  if (!_storedHash) return false;
  var currentHash = calculateManifestHash(manifest);
  return currentHash !== _storedHash;
}

// Get validation history
function getValidationHistory() {
  return _validationHistory.slice();
}

// Get last validation result
function getLastValidation() {
  return _lastValidation ? Object.assign({}, _lastValidation) : null;
}

// Reset stored hash (for reinitialization)
function reset() {
  _storedHash = null;
  _storedHashMeta = null;
  _lastValidation = null;
  _validationHistory = [];
  clearPersistedHash();
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    storedHash: _storedHash ? _storedHash.substring(0, 16) + '...' : null,
    storedHashMeta: _storedHashMeta,
    lastValidation: _lastValidation ? {
      valid: _lastValidation.valid,
      issueCount: _lastValidation.issueCount,
      timestamp: _lastValidation.timestamp
    } : null,
    validationCount: _validationHistory.length,
    webCryptoAvailable: _useWebCrypto,
    algorithm: _useWebCrypto ? 'sha-256' : 'fnv-1a',
    improvements: ['#7-ManifestIntegrity', 'SHA256-Support', 'Persistence']
  };
}

function healthCheck() {
  var status: string = HEALTH_STATUS.HEALTHY;

  if (_lastValidation && !_lastValidation.valid) {
    status = HEALTH_STATUS.UNHEALTHY;
  } else if (_lastValidation && _lastValidation.issueCount > 0) {
    status = HEALTH_STATUS.DEGRADED;
  }
  
  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      hashStored: !!_storedHash,
      lastValidationValid: _lastValidation ? _lastValidation.valid : true,
      webCryptoAvailable: _useWebCrypto
    },
    details: {
      hashStored: !!_storedHash,
      algorithm: _storedHashMeta?.algorithm || 'none',
      lastValidationValid: _lastValidation ? _lastValidation.valid : null,
      webCryptoAvailable: _useWebCrypto
    }
  });
}

export {
  hashString,
  hashStringFNV,
  hashStringSHA256,
  hashObject,
  hashObjectAsync,
  calculateManifestHash,
  calculateManifestHashAsync,
  storeHash,
  storeHashAsync,
  validateIntegrity,
  validateIntegrityAsync,
  wasTampered,
  getValidationHistory,
  getLastValidation,
  loadPersistedHash,
  clearPersistedHash,
  reset,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  hashString: hashString,
  hashStringFNV: hashStringFNV,
  hashStringSHA256: hashStringSHA256,
  hashObject: hashObject,
  hashObjectAsync: hashObjectAsync,
  calculateManifestHash: calculateManifestHash,
  calculateManifestHashAsync: calculateManifestHashAsync,
  storeHash: storeHash,
  storeHashAsync: storeHashAsync,
  validateIntegrity: validateIntegrity,
  validateIntegrityAsync: validateIntegrityAsync,
  wasTampered: wasTampered,
  getValidationHistory: getValidationHistory,
  getLastValidation: getLastValidation,
  loadPersistedHash: loadPersistedHash,
  clearPersistedHash: clearPersistedHash,
  reset: reset,
  info: info,
  healthCheck: healthCheck,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};

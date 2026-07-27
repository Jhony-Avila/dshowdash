// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: context-helpers
// PURPOSE: Context Provider Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   deepClone — exported value
//   deepMerge() — exported function
//   isEqual() — exported function
//   validateContextValue() — exported function
//   createContextSelector() — exported function
//   createSelectorFromStore() — exported function
//   debounce() — exported function
//   throttle() — exported function
//   setDebug() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   resetMetrics() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '4.4.0-P17WI';
export const MODULE_ID = 'context-helpers';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function getVersion() { return VERSION; }
const _debug = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug ? true : false; };
const _log = function(level: string) { const logger = _getPort('logger'); if (!logger) return; const args = Array.prototype.slice.call(arguments, 1); const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(...[prefix].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...[prefix].concat(args)); return; } if (_debug() && logger.debug) logger.debug(...[prefix].concat(args)); };
let _metrics = { deepCloneCount: 0, deepMergeCount: 0, isEqualCount: 0, validationCount: 0, validationFailures: 0, selectorCount: 0, debounceCount: 0, throttleCount: 0 };

// @ts-expect-error TS migration - TS2554
const deepClone = obj => { try { _metrics.deepCloneCount++; if (obj === null || typeof obj !== 'object') return obj; if (Array.isArray(obj)) return obj.map(item => deepClone(item)); const cloned = {}; Object.keys(obj).forEach(key => { cloned[key] = deepClone(obj[key]); }); return cloned; } catch (error: any) { _log('error', 'deepClone error:', error.message); return obj; } };

// @ts-expect-error TS migration - TS2554
const deepMerge = (target, source) => { try { _metrics.deepMergeCount++; if (!source || typeof source !== 'object') return target; const result = deepClone(target); Object.keys(source).forEach(key => { if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) { if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) { result[key] = deepMerge(result[key], source[key]); } else { result[key] = deepClone(source[key]); } } else { result[key] = deepClone(source[key]); } }); return result; } catch (error: any) { _log('error', 'deepMerge error:', error.message); return target; } };
const isEqual = (a: unknown, b: unknown): boolean => { try { _metrics.isEqualCount++; if (a === b) return true; if (a === null || b === null) return false; if (typeof a !== typeof b) return false; if (typeof a !== 'object') return a === b; if (Array.isArray(a) !== Array.isArray(b)) return false; if (Array.isArray(a)) { if (a.length !== (b as unknown[]).length) return false; return a.every((item, index) => isEqual(item, (b as unknown[])[index])); } const keysA = Object.keys(a as Record<string, unknown>); const keysB = Object.keys(b as Record<string, unknown>); if (keysA.length !== keysB.length) return false; return keysA.every(key => isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])); } catch (error: any) { return false; } };
const validateContextValue = (value: unknown, schema: Record<string, any>) => { try { _metrics.validationCount++; if (!schema) return { valid: true }; if (schema.type) { const actualType = Array.isArray(value) ? 'array' : typeof value; if (actualType !== schema.type) { _metrics.validationFailures++; return { valid: false, error: `Expected type "${schema.type}", got "${actualType}"`, details: { expected: schema.type, received: actualType } }; } } if (schema.required && value === undefined) { _metrics.validationFailures++; return { valid: false, error: 'Value is required' }; } if (schema.properties && typeof value === 'object' && value !== null) { for (const prop in schema.properties) { if (schema.properties.hasOwnProperty(prop) && schema.properties[prop].required && (value as Record<string, unknown>)[prop] === undefined) { _metrics.validationFailures++; return { valid: false, error: `Property "${prop}" is required`, details: { missingProperty: prop } }; } } } if (schema.enum && schema.enum.indexOf(value) === -1) { _metrics.validationFailures++; return { valid: false, error: `Value must be one of: ${schema.enum.join(', ')}`, details: { allowedValues: schema.enum, received: value } }; } return { valid: true }; } catch (error: any) { _metrics.validationFailures++; return { valid: false, error: error.message }; } };
const createContextSelector = (contextName: string, path: string) => { _metrics.selectorCount++; return (contextValue: unknown) => { try { if (!path || path.length === 0) return contextValue; let current = contextValue; const parts = path.split('.'); for (let i = 0; i < parts.length; i++) { if (current === null || current === undefined) return undefined; current = (current as Record<string, unknown>)[parts[i]]; } return current; } catch (error: any) { return undefined; } }; };
const createSelectorFromStore = (store: Record<string, any>, contextName: string, path: string) => { const selector = createContextSelector(contextName, path); return () => { try { const contextValue = store.get(contextName); return selector(contextValue); } catch (error: any) { return undefined; } }; };
const debounce = (fn: Function, delay: number) => { if (delay === undefined) delay = 100; _metrics.debounceCount++; let timeoutId: ReturnType<typeof setTimeout> | undefined; return function() { const args = arguments; clearTimeout(timeoutId); timeoutId = setTimeout(() => { fn(...args); }, delay); }; };
const throttle = (fn: Function, limit: number) => { if (limit === undefined) limit = 100; _metrics.throttleCount++; let inThrottle: boolean = false; return function() { const args = arguments; if (!inThrottle) { fn(...args); inThrottle = true; setTimeout(() => { inThrottle = false; }, limit); } }; };
const healthCheck = () => { const ps = Ports.snapshot(); const checks = { functionsAvailable: typeof deepClone === 'function' && typeof deepMerge === 'function', isEqualWorking: isEqual({ a: 1 }, { a: 1 }) === true, validationWorking: validateContextValue('test', { type: 'string' }).valid === true, lowValidationFailures: _metrics.validationFailures < 20, loggerAvailable: !!_getPort('logger'), portsInitialized: ps._initialized }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; const issues = []; if (!checks.functionsAvailable) issues.push('Core functions not available'); if (!checks.isEqualWorking) issues.push('isEqual not working'); if (!checks.validationWorking) issues.push('Validation not working'); if (!checks.lowValidationFailures) issues.push(`High validation failures: ${_metrics.validationFailures}`); return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; };
const info = () => { const ps: Record<string, unknown> = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, metrics: Object.assign({}, _metrics), ports: Object.keys(ps).filter(k => k !== '_initialized' && ps[k] !== null), healthCheck: healthCheck(), availableFunctions: ['deepClone', 'deepMerge', 'isEqual', 'validateContextValue', 'createContextSelector', 'createSelectorFromStore', 'debounce', 'throttle'], portsInitialized: ps._initialized }; };
const resetMetrics = () => { _metrics = { deepCloneCount: 0, deepMergeCount: 0, isEqualCount: 0, validationCount: 0, validationFailures: 0, selectorCount: 0, debounceCount: 0, throttleCount: 0 }; };
const setDebug = () => {};
export { deepClone, deepMerge, isEqual, validateContextValue, createContextSelector, createSelectorFromStore, debounce, throttle, setDebug, healthCheck, info, resetMetrics };

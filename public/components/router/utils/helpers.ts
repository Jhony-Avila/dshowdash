// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.utils.helpers
// PURPOSE: Router Global - Utility Helpers v4.1.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RouterHelpers — exported value
//   ValidationHelpers — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
export const VERSION = '4.1.0-P17WI';
export const MODULE_ID = 'router.utils.helpers';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function getVersion() { return VERSION; }
export const RouterHelpers = {
  sanitizePath(path: string) { if (!path || typeof path !== 'string') return '/'; try { let clean = path.trim().toLowerCase(); clean = clean.replace(/\/+/g, '/'); if (!clean.startsWith('/')) clean = `/${clean}`; if (clean.length > 1 && clean.endsWith('/')) { clean = clean.slice(0, -1); } clean = clean.replace(/[^a-z0-9\-_\/]/g, ''); return clean || '/'; } catch (error) { return '/'; } },
  parseQueryString(queryString: string) { if (!queryString || typeof queryString !== 'string') return {}; try { const params: Record<string, string> = {}; const search = queryString.startsWith('?') ? queryString.slice(1) : queryString; if (!search) return params; const pairs = search.split('&'); for (const pair of pairs) { const [key, value] = pair.split('='); if (key) { params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : ''; } } return params; } catch (error) { return {}; } },

  // @ts-expect-error TS migration - TS2345
  buildQueryString(params: Record<string, unknown>) { if (!params || typeof params !== 'object') return ''; try { const pairs = []; for (const [key, value] of Object.entries(params)) { if (value !== undefined && value !== null) { pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`); } } return pairs.length > 0 ? `?${pairs.join('&')}` : ''; } catch (error) { return ''; } },
  parseFragment(hash: string) { if (!hash || typeof hash !== 'string') return ''; return hash.startsWith('#') ? hash.slice(1) : hash; },
  extractPathSegments(path: string) { try { const clean = this.sanitizePath(path); return clean.split('/').filter((segment: string) => segment.length > 0); } catch (error) { return []; } },
  matchDynamicRoute(pattern: string, path: string) { try { const patternSegments = this.extractPathSegments(pattern); const pathSegments = this.extractPathSegments(path); if (patternSegments.length !== pathSegments.length) return null; const params: Record<string, string> = {}; for (let i = 0; i < patternSegments.length; i++) { const patternPart = patternSegments[i]; const pathPart = pathSegments[i]; if (patternPart.startsWith(':')) { const paramName = patternPart.slice(1); params[paramName] = pathPart; } else if (patternPart !== pathPart) { return null; } } return params; } catch (error) { return null; } },
  isValidRoutePath(path: string) { if (!path || typeof path !== 'string') return false; try { const sanitized = this.sanitizePath(path); return sanitized.length > 0 && sanitized.length <= 200; } catch (error) { return false; } },
  generateRouteId() { try { return `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; } catch (error) { return `route-${Date.now()}`; } },
  comparePaths(path1: string, path2: string) { try { const clean1 = this.sanitizePath(path1); const clean2 = this.sanitizePath(path2); return clean1 === clean2; } catch (error) { return false; } },
  debounce(func: (...args: unknown[]) => void, wait: number) { let timeout: ReturnType<typeof setTimeout>; return function executedFunction(...args: unknown[]) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; },
  throttle(func: (...args: unknown[]) => void, limit: number) { let inThrottle: boolean; return function executedFunction(...args: unknown[]) { if (!inThrottle) { func(...args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } }; },
  getVersion() { return VERSION; }
};
export const ValidationHelpers = {
  isNonEmptyString(value: unknown) { return typeof value === 'string' && value.trim().length > 0; },
  isPlainObject(value: unknown) { return value !== null && typeof value === 'object' && !Array.isArray(value); },
  isFunction(value: unknown) { return typeof value === 'function'; },
  assertRequired(value: unknown, name: string) { if (value === undefined || value === null) { throw new Error(`[${MODULE_ID}] ${name} is required`); } },
  getVersion() { return VERSION; }
};
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
export default RouterHelpers;

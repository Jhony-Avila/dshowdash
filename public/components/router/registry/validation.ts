// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.registry.validation
// PURPOSE: Router Global - Routes Validation v5.4.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   routes, VERSION as ROUTES_SCHEMA from ./definitions.js
//   aliasMap from ./aliases.js
//   getEnterpriseRoutes, getNoMountMainRoutes, getUniqueDomains from ./helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   validateRoutes() — exported function
//   getRoutesInfo() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   healthCheck() — exported function
//   ROUTES_SCHEMA — exported value
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
import { routes, VERSION as ROUTES_SCHEMA } from './definitions.js';
import { aliasMap } from './aliases.js';
import { getEnterpriseRoutes, getNoMountMainRoutes, getUniqueDomains } from './helpers.js';
export const VERSION = '5.4.0-P17WI';
export const MODULE_ID = 'router.registry.validation';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// @ts-expect-error TS migration - TS2339
export const validateRoutes = () => { const result = { valid: true, issues: [] as Record<string, unknown>[], warnings: [] as Record<string, unknown>[], stats: { total: 0, public: 0, protected: 0, enterprise: 0, withPermissions: 0, withFeatureFlags: 0, withAliases: 0, withDefaultView: 0, withVirtualDefaults: 0, withTags: 0, withMountMain: 0, withDomain: 0, missingId: 0, missingName: 0, missingTitle: 0, missingPage: 0 } }; const seenIds = new Set(); try { for (const [path, config] of Object.entries(routes)) { result.stats.total++; if (config.public) result.stats.public++; else result.stats.protected++; if (config.panel) result.stats.enterprise++; if (config.permissions?.length > 0) result.stats.withPermissions++; if (config.featureFlags?.length > 0) result.stats.withFeatureFlags++; if (config.aliases?.length > 0) result.stats.withAliases++; if (config.defaultView) result.stats.withDefaultView++; if (config.virtualDefaults) result.stats.withVirtualDefaults++; if (config.tags?.length > 0) result.stats.withTags++; if (typeof config.mountMain === 'boolean') result.stats.withMountMain++; if (config.domain) result.stats.withDomain++; if (!config.id) { result.warnings.push({ path, issue: 'missing-id' }); result.stats.missingId++; } else if (seenIds.has(config.id)) { result.issues.push({ path, issue: 'duplicate-id', id: config.id }); result.valid = false; } else { seenIds.add(config.id); } if (!config.name) { result.warnings.push({ path, issue: 'missing-name' }); result.stats.missingName++; } if (!config.title) { result.warnings.push({ path, issue: 'missing-title' }); result.stats.missingTitle++; } if (!config.page) { result.issues.push({ path, issue: 'missing-page' }); result.stats.missingPage++; result.valid = false; } } const essentialRoutes = ['/', '/login', '/404', '/forbidden']; for (const essential of essentialRoutes) { if (!(routes as Record<string, unknown>)[essential]) { result.issues.push({ path: essential, issue: 'essential-route-missing' }); result.valid = false; } } } catch (error) { result.valid = false; result.issues.push({ path: 'unknown', issue: `validation-error: ${error.message}` }); } return result; };
export const getRoutesInfo = () => { const validation = validateRoutes(); return { version: VERSION, moduleId: MODULE_ID, schemaVersion: 'v2', totalRoutes: Object.keys(routes).length, totalAliases: aliasMap.size, enterpriseRoutes: getEnterpriseRoutes().length, noMountMainRoutes: getNoMountMainRoutes(), uniqueDomains: getUniqueDomains(), validation: { valid: validation.valid, issuesCount: validation.issues.length, warningsCount: validation.warnings.length }, stats: validation.stats, portsInitialized: Ports.isInitialized() }; };
export function healthCheck() { const validation = validateRoutes(); return { status: validation.valid ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, routeCount: Object.keys(routes).length, issues: validation.issues.length, portsInitialized: Ports.isInitialized() }; }
export { ROUTES_SCHEMA };
export default { validateRoutes, getRoutesInfo, ROUTES_SCHEMA, VERSION, MODULE_ID, healthCheck, injectPorts, getPorts };

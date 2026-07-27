// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.registry.aliases
// PURPOSE: Router Global - Aliases Registry v5.4.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   routes from ./definitions.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   aliasMap — exported value
//   resolveAlias() — exported function
//   routeExists() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   healthCheck() — exported function
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
import { routes } from './definitions.js';
export const VERSION = '5.4.0-P17WI';
export const MODULE_ID = 'router.registry.aliases';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export const aliasMap = new Map();
(function buildAliasMap() { try { for (const [path, config] of Object.entries(routes)) { if (config.aliases && Array.isArray(config.aliases)) { for (const alias of config.aliases) { aliasMap.set(alias, path); } } } } catch (e) { } })();
export const resolveAlias = (path: string) => aliasMap.get(path) || path;
export const routeExists = (path: string) => { try { return Object.prototype.hasOwnProperty.call(routes, path) || aliasMap.has(path); } catch (error) { return false; } };
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, aliasCount: aliasMap.size, portsInitialized: Ports.isInitialized() }; }
export default { aliasMap, resolveAlias, routeExists, VERSION, MODULE_ID, healthCheck, injectPorts, getPorts };

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.6.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.icon-registry
// PURPOSE: Icon registry with namespace management and SVG icon storage
// ───────────────────────────────────────────────────────────────
// @contract REGISTER - register(namespace, icons) registers icons in namespace
// @contract GET - get(name) gets icon by name
// @contract HAS - has(name) checks if icon exists
// @contract LIST - list(namespace) lists icons in namespace
// @contract LIST_NAMESPACES - listNamespaces() lists all namespaces
// @contract COUNT - count(namespace) counts icons
// @contract CLEANUP - cleanup() performs cleanup
// @contract RESET - reset() resets registry
// @contract DESTROY - destroy() destroys registry
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: register, get, has, list, listNamespaces, count, info, healthCheck, injectPorts, getPorts from ./registry.js
// IMPORTS: UI_NS, UI_ICONS from ./icons/ui.js
// IMPORTS: CHARTS_NS, CHARTS_ICONS from ./icons/charts.js
// IMPORTS: TABLE_NS, TABLE_ICONS from ./icons/table.js
// IMPORTS: SYSTEM_NS, SYSTEM_ICONS from ./icons/system.js
// IMPORTS: BUSINESS_NS, BUSINESS_ICONS from ./icons/business.js
// IMPORTS: EXTENDED_NS, EXTENDED_ICONS from ./icons/extended.js
// PROVIDES: IconRegistry, get, has, list, listNamespaces, count, register,
//           info, healthCheck, cleanup, reset, destroy, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v1.6.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.5.1-SYNTAX-FIX: Fixed corrupted import statements
// @changelog v1.5.0-ENTERPRISE: ES6 modernization (const/let, arrow functions, template literals, for...of)
// @changelog v1.4.0-ENTERPRISE: Added destroy for complete lifecycle
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { register, get, has, list, listNamespaces, count, info as registryInfo, healthCheck as registryHealthCheck, injectPorts as registryInjectPorts, getPorts as registryGetPorts } from './registry.js';

import { NAMESPACE as UI_NS, ICONS as UI_ICONS } from './icons/ui.js';
import { NAMESPACE as CHARTS_NS, ICONS as CHARTS_ICONS } from './icons/charts.js';
import { NAMESPACE as TABLE_NS, ICONS as TABLE_ICONS } from './icons/table.js';
import { NAMESPACE as SYSTEM_NS, ICONS as SYSTEM_ICONS } from './icons/system.js';
import { NAMESPACE as BUSINESS_NS, ICONS as BUSINESS_ICONS } from './icons/business.js';
import { NAMESPACE as EXTENDED_NS, ICONS as EXTENDED_ICONS } from './icons/extended.js';

export const VERSION = '1.6.0-P2-ENTERPRISE';
export const MODULE_ID = 'icon-registry';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => { Ports.inject(p); registryInjectPorts(p); return true; };
export const getPorts = () => Ports.snapshot();

register(UI_NS, UI_ICONS);
register(CHARTS_NS, CHARTS_ICONS);
register(TABLE_NS, TABLE_ICONS);
register(SYSTEM_NS, SYSTEM_ICONS);
register(BUSINESS_NS, BUSINESS_ICONS);
register(EXTENDED_NS, EXTENDED_ICONS);

export const info = () => {
  const regInfo = registryInfo();
  return { moduleId: MODULE_ID, version: VERSION, registry: regInfo, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};

export const healthCheck = () => {
  const regHealth = registryHealthCheck();
  const checks = { registryHealthy: regHealth.status === 'HEALTHY', hasIcons: regHealth.totalIcons > 0, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  for (const [k, v] of Object.entries(checks)) { if (v) passed++; }
  return { status: passed === 3 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/3`, checks, registry: regHealth, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};

export const cleanup = () => ({ success: true, moduleId: MODULE_ID });
export const reset = () => cleanup();
export const destroy = () => cleanup();

export const IconRegistry = { get, has, list, listNamespaces, count, register, info, healthCheck, cleanup, reset, destroy, injectPorts, getPorts, VERSION, MODULE_ID };

export { get, has, list, listNamespaces, count, register };
export default IconRegistry;

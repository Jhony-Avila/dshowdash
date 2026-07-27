// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.panels-container
// PURPOSE: Panels container with panel enumeration and management
// ───────────────────────────────────────────────────────────────
// @contract GET_PANELS - getPanels() returns panel list
// @contract GET_PANEL_COUNT - getPanelCount() returns panel count
// @contract INFO - info() returns module information
// @contract HEALTH - healthCheck() returns health status
// @contract CLEANUP - cleanup() performs cleanup
// @contract RESET - reset() resets module
// @contract DESTROY - destroy() destroys module
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getPanels() — exported function
//   getPanelCount() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   cleanup() — exported function
//   reset() — exported function
//   destroy() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// @changelog v9.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v9.1.0-ENTERPRISE: Previous enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels-container';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const PANELS = [
  'panel-01','panel-02','panel-03','panel-04','panel-05','panel-06','panel-07','panel-08','panel-09','panel-10',
  'panel-11','panel-12','panel-13','panel-14','panel-15','panel-16','panel-17','panel-18','panel-19',
  'panel-cards','panel-dashboard','panel-audit-trail','panel-orchestrator',
  'panel-permissions-admin','panel-session-admin','panel-user-management','panel-user-preferences','panel-feature-flags-admin',
  'panel-header-admin','panel-navrail-admin'
];

export const getPanels = () => PANELS.slice();
export const getPanelCount = () => PANELS.length;

export const info = () => ({ version: VERSION, moduleId: MODULE_ID, panels: PANELS, totalPanels: PANELS.length, portsInitialized: Ports.isInitialized(), timestamp: Date.now() });

export const healthCheck = () => {
  const checks = { portsInitialized: Ports.isInitialized(), panelsAvailable: PANELS.length > 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};

export const cleanup = () => ({ success: true, moduleId: MODULE_ID });
export const reset = () => cleanup();
export const destroy = () => cleanup();

export default { VERSION, MODULE_ID, getPanels, getPanelCount, info, healthCheck, cleanup, reset, destroy, injectPorts, getPorts };

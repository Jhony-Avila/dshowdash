// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-08
// PURPOSE: Panel-08 - Alertas do Sistema
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   MODULE_ID as PANEL_NAME from ./core/contracts.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   mount() — exported function
//   unmount() — exported function
//   destroy() — exported function
//   refresh() — exported function
//   getStatus() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import * as Lifecycle from './core/lifecycle.js';
import { MODULE_ID as PANEL_NAME } from './core/contracts.js';

export const MODULE_ID = 'panel-08';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const _isAuthenticated = () => { const auth = _getPort('auth'); return auth?.isAuthenticated?.() ?? false; };
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

export const mount = (container: HTMLElement, deps: Record<string, unknown> = {}) => { _initPorts(); if (!_isAuthenticated()) { return { success: false, moduleId: MODULE_ID, error: "not-authenticated" }; } return Lifecycle.mount(container, deps); };
export const unmount = (container?: HTMLElement, deps: Record<string, unknown> = {}) => Lifecycle.unmount();
export const destroy = () => unmount();
export const refresh = () => { if (!_isDocumentVisible()) return Promise.resolve(); return Lifecycle.refresh(); };

// @ts-expect-error strict migration — TS2783
export const getStatus = () => { const health = Lifecycle.healthCheck(); return { panelId: MODULE_ID, name: PANEL_NAME, version: VERSION, p22Compliant: true, timestamp: Date.now(), ...health }; };
export const getVersion = () => VERSION;

export const healthCheck = () => { const health = Lifecycle.healthCheck(); const checks = { mounted: health.mounted === true, initialized: health.initialized === true, cssLoaded: health.cssLoaded === true, notDegraded: health.status !== 'degraded' }; const score = Object.values(checks).filter(Boolean).length; return { status: score === 4 ? 'HEALTHY' : score >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${score}/4`, checks, panelId: MODULE_ID, version: VERSION, p22Compliant: true, isDocumentVisible: _isDocumentVisible(), timestamp: Date.now() }; };

// @ts-expect-error strict migration — TS2783
export const info = () => ({ panelId: MODULE_ID, name: PANEL_NAME, version: VERSION, p22Compliant: true, timestamp: Date.now(), ...getStatus() });

export default { mount, unmount, destroy, refresh, getStatus, getVersion, healthCheck, info, injectPorts, getPorts };

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.analytics.dashboard-config
// PURPOSE: Router Dashboard Config
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CONFIG — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getColor() — exported function
//   getColors() — exported function
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
export const VERSION = '1.1.0-P17WI';
export const MODULE_ID = 'router.analytics.dashboard-config';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export const CONFIG = { refreshInterval: 5000, maxDataPoints: 60, chartHeight: 200, colors: { primary: '#3b82f6', success: '#10b981', warning: '#f59e0b', danger: '#ef4444', muted: '#6b7280', background: '#1f2937', surface: '#374151', text: '#f9fafb', textMuted: '#9ca3af' } };
export function getColor(name: string) { return (CONFIG.colors as Record<string, string>)[name] || CONFIG.colors.muted; }
export function getColors() { return { ...CONFIG.colors }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }

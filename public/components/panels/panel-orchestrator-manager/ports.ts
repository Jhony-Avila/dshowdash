// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-orchestrator-manager:ports
// PURPOSE: Panel Orchestrator Manager - Ports
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCustomPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initPorts() — exported function
//   getPort() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   isInitialized() — exported function
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

// @ts-expect-error TS migration - TS2724
import { createCustomPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-orchestrator-manager:ports';
const customPortsDef = { uiOrchestrator: 'UIOrchestrator', eventTimeline: 'EventTimeline', canvasEngine: 'CanvasEngine' };
const Ports = createCustomPorts({ moduleId: MODULE_ID, ports: customPortsDef });
export const initPorts = () => { Ports.init(); };
export const getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export const isInitialized = () => { const snapshot = Ports.snapshot(); return snapshot._initialized; };
export const info = () => { const snapshot = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, initialized: snapshot._initialized }; };
export default { initPorts, getPort, injectPorts, getPorts, isInitialized };

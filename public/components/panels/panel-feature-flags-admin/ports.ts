// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin:ports
// PURPOSE: Panel Feature Flags Admin - Ports
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initPorts() — exported function
//   getPort() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   isDebug() — exported function
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
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-feature-flags-admin:ports';
const Ports = createPanelPorts({ moduleId: MODULE_ID });
export const initPorts = () => { Ports.init(); };
export const getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export const isDebug = () => { const cfg = getPort('config'); return cfg?.app?.debug ? true : false; };
export const info = () => { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, initialized: ps._initialized }; };
export default { initPorts, getPort, injectPorts, getPorts, isDebug };

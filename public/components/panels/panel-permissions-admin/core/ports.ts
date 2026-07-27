// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-permissions-admin.core.ports
// PURPOSE: UARPS Admin - Ports
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initPorts() — exported function
//   getPort() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   isInitialized() — exported function
//   emit() — exported function
//   showToast() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   UI_INTENTS.SHOW_TOAST
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-permissions-admin.core.ports';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

export const initPorts = () => { Ports.init(); };
export const getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export const isInitialized = () => Ports.isInitialized();

export const emit = (event: string, data: Record<string, unknown> = {}, moduleId: string) => {
  try {
    const eventBus = getPort('eventBus');
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: moduleId, timestamp: Date.now() });
    }
  } catch (e) {}
};

export const showToast = (type: string, title: string, message: string) => {
  try {
    const eventBus = getPort('eventBus');
    if (eventBus?.emit) {
      eventBus.emit(UI_INTENTS.SHOW_TOAST, { type, title, message, duration: 4000, source: MODULE_ID, timestamp: Date.now() });
    }
  } catch (e) {}
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, initialized: Ports.isInitialized() });
export const healthCheck = () => ({ status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() });

export default { initPorts, getPort, injectPorts, getPorts, isInitialized, emit, showToast, info, healthCheck };

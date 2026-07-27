// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-19/ports
// PURPOSE: Panel-19 Ports (Dependency Injection)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   setPorts() — exported function
//   getPorts() — exported function
//   getPort() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
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

interface Ports {
    eventBus: unknown;
    logger: unknown;
    config: unknown;
    api: unknown;
    auth: unknown;
}

let ports: Ports = {
    eventBus: null,
    logger: null,
    config: null,
    api: null,
    auth: null
};

export function setPorts(newPorts: Partial<Ports>) {
    ports = { ...ports, ...newPorts };
}

export function getPorts() {
    return { ...ports };
}

export function getPort(name: keyof Ports) {
    return ports[name];
}

export default { setPorts, getPorts, getPort };

export const MODULE_ID = 'panel-19/ports';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }

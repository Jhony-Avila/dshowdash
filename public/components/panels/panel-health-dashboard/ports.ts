// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ports
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   setPorts() — exported function
//   getPorts() — exported function
//   getPort() — exported function
//   initPorts() — alias for setPorts (compatibility)
//   isPortsInitialized() — exported function
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

export const MODULE_ID = 'panel-health-dashboard.ports';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Health Dashboard - Ports (Dependency Injection)
 * @module panel-health-dashboard/ports
 * @version 1.1.0-AAA
 */

type PortsMap = {
    eventBus: unknown;
    logger: unknown;
    config: unknown;
    api: unknown;
    telemetry: unknown;
    [key: string]: unknown;
};

let ports: PortsMap = {
    eventBus: null,
    logger: null,
    config: null,
    api: null,
    telemetry: null
};

let _initialized = false;

export function setPorts(newPorts: Partial<PortsMap>) {
    ports = { ...ports, ...newPorts };
    _initialized = true;
}

export function getPorts() {
    return { ...ports };
}

export function getPort(name: string) {
    return ports[name];
}

// ── Alias exports (compatibility) ──────────────────────────────
/** Alias for setPorts — satisfies consumers expecting initPorts() */
export const initPorts = setPorts;

/** Returns true once setPorts/initPorts has been called at least once */
export function isPortsInitialized(): boolean {
    return _initialized;
}

export default { setPorts, getPorts, getPort, initPorts, isPortsInitialized };

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom-regions/ports
// PURPOSE: Gerenciamento de Ports para DOM Regions via PortsFactory
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   MODULE_ID from ./constants.js
// EXPORTS:
//   Ports — Instância de ports para o módulo
//   initPorts — Inicializa ports
//   getPort — Obtém port específico
//   injectPorts — Injeta ports customizados
//   getPorts — Retorna snapshot dos ports
// ═══════════════════════════════════════════════════════════════
/**
 * @module DOMRegionsPorts
 * @description Ports layer para DOM Regions
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.3.0-P2-ENTERPRISE';

export const Ports = createCorePorts({ moduleId: MODULE_ID });

export function initPorts() {
    Ports.init();
}

export function getPort(name: string) {
    return Ports.get(name);
}

export function injectPorts(p: DynObj) {
    return Ports.inject(p);
}

export function getPorts() {
    return Ports.snapshot();
}

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.0.0-P0-AUTH-OWNERSHIP)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/header-events/ports
// PURPOSE: Port management for header-events module — init, get, inject, snapshot
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   MODULE_ID from ./constants.js
// PROVIDES:
//   Ports — UiPorts instance for header-events
//   initPorts() — initialize ports
//   getPort(name) — get a specific port by name
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//   isPortsInitialized() — check if ports are initialized
// ═══════════════════════════════════════════════════════════════

// Header Events - Ports
// @version 6.0.0-P0-AUTH-OWNERSHIP
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID } from './constants.js';

export const VERSION = '6.0.0-P0-AUTH-OWNERSHIP';

export const Ports = createUiPorts({ moduleId: MODULE_ID });

export function initPorts() { Ports.init(); }
export function getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function isPortsInitialized() { return Ports.isInitialized(); }

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-ports
// PURPOSE: NavRail - Ports Setup
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   MODULE_ID from ./core/constants.js
//
// PROVIDES:
//   Ports — exported value
//   getPort() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   isPortsInitialized() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID } from './core/constants.js';

export const VERSION = '5.0.0-P4-ENTERPRISE';

export const Ports = createUiPorts({ moduleId: MODULE_ID });

export const getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export const isPortsInitialized = () => Ports.isInitialized();

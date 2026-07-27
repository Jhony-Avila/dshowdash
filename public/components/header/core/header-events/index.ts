// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.0.0-P0-AUTH-OWNERSHIP-MODULAR)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/header-events (index)
// PURPOSE: Modular entry point — re-exports constants, ports, class and event constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   HEADER_EVENTS, HEADER_INTENTS from /core/runtime/events/catalog/header.events.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//   BOOT_EVENTS from /core/runtime/events/catalog/boot.events.js
//   VERSION, MODULE_ID from ./constants.js
//   injectPorts, getPorts from ./ports.js
//   HeaderEvents from ./header-events-class.js
// PROVIDES:
//   HeaderEvents (class, default) — main event handler orchestrator
//   VERSION — module version constant
//   MODULE_ID — module identifier constant
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//   getVersion() — return module version
//   AUTH_EVENTS — auth event constants
//   HEADER_EVENTS — header event constants
//   HEADER_INTENTS — header intent constants
//   BOOT_EVENTS — boot event constants
// ═══════════════════════════════════════════════════════════════

// Header Events - Modular Index
// @version 6.0.0-P0-AUTH-OWNERSHIP-MODULAR
// @description Event Handlers Setup (Enterprise) - Modularizado
'use strict';

import { HEADER_EVENTS, HEADER_INTENTS } from '/core/runtime/events/catalog/header.events.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { BOOT_EVENTS } from '/core/runtime/events/catalog/boot.events.js';

export { VERSION, MODULE_ID } from './constants.js';
export { injectPorts, getPorts } from './ports.js';
export { HeaderEvents } from './header-events-class.js';

export function getVersion() {
  const { VERSION } = require('./constants.js');
  return VERSION;
}

export { AUTH_EVENTS, HEADER_EVENTS, HEADER_INTENTS, BOOT_EVENTS };

export { HeaderEvents as default } from './header-events-class.js';

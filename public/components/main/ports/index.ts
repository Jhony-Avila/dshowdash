// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-ports-index
// PURPOSE: Main Ports Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   AuthPort — exported value
//   createNullAuthPort — exported value
//   validateAuthPort — exported value
//   CanvasPort — exported value
//   ContainerPort — exported value
//   EventBusPort — exported value
//   createNullEventBusPort — exported value
//   validateEventBusPort — exported value
//   NavigationPort — exported value
//   PanelPort — exported value
//   StatePort — exported value
//   TelemetryPort — exported value
//   createTelemetryPort — exported value
//   UIAdapterPort — exported value
//   UIPort — exported value
//   TimerPort — exported value
//   createNullTimerPort — exported value
//   validateTimerPort — exported value
//   ... and 3 more exports
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


export { default as AuthPort, createNullAuthPort, validateAuthPort } from './AuthPort.js';
export { default as CanvasPort } from './CanvasPort.js';
export { default as ContainerPort } from './ContainerPort.js';
export { default as EventBusPort, createNullEventBusPort, validateEventBusPort } from './EventBusPort.js';
export { default as NavigationPort } from './NavigationPort.js';
export { default as PanelPort } from './PanelPort.js';
export { default as StatePort } from './StatePort.js';
export { default as TelemetryPort, createTelemetryPort } from './TelemetryPort.js';
export { default as UIAdapterPort } from './UIAdapterPort.js';
export { default as UIPort } from './UIPort.js';
export { default as TimerPort, createNullTimerPort, validateTimerPort } from './TimerPort.js';
export { default as GlobalsPort, createNullGlobalsPort, validateGlobalsPort } from './GlobalsPort.js';

export const VERSION = '2.0.0-P1-HEX';
export const MODULE_ID = 'main-ports-index';

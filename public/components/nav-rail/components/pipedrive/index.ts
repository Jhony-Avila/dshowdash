// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: nav-rail-pipedrive-button
// PURPOSE: NavRail Pipedrive Button Component - Factory Generated
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createButtonExports from ../_shared/button-factory.js
// PROVIDES:
//   createPipedriveButton() — creates pipedrive button instance
//   init() — initializes the component
//   mount() — mounts component to DOM
//   unmount() — removes component from DOM
//   healthCheck() — returns component health status
//   info() — returns component info
//   getInstance() — returns singleton instance
//   getElement() — returns DOM element
//   isMounted() — returns mount state
//   getId() — returns component ID
// RECEIVES (via init/options): none
// EMITS (eventos): EMITTED_EVENTS (delegated to button-factory)
// LISTENS (eventos): none
// WINDOW ACCESS: none
// ═══════════════════════════════════════════════════════════════
// @version 3.2.0-AAA
// @changelog v3.2.0-AAA - Added AAA Dependency Contract header
// @changelog v3.1.0-ES6 - var → const migration
'use strict';

import { createButtonExports } from '../_shared/button-factory.js';

const buttonExports = createButtonExports('pipedrive');

export const VERSION = buttonExports.VERSION;
export const MODULE_ID = buttonExports.MODULE_ID;
export const getInstance = buttonExports.getInstance;
export const createPipedriveButton = buttonExports.createButton;
export const init = buttonExports.init;
export const mount = buttonExports.mount;
export const unmount = buttonExports.unmount;
export const healthCheck = buttonExports.healthCheck;
export const info = buttonExports.info;
export const getElement = buttonExports.getElement;
export const isMounted = buttonExports.isMounted;
export const getId = buttonExports.getId;
export const BUTTON_CONFIG = buttonExports.BUTTON_CONFIG;
export const ACTION_PAYLOAD = buttonExports.ACTION_PAYLOAD;
export const EMITTED_EVENTS = buttonExports.EMITTED_EVENTS;

export default {
  PipedriveButton: buttonExports.getInstance,
  getInstance: buttonExports.getInstance,
  createPipedriveButton: buttonExports.createButton,
  init: buttonExports.init,
  mount: buttonExports.mount,
  unmount: buttonExports.unmount,
  healthCheck: buttonExports.healthCheck,
  info: buttonExports.info,
  VERSION: buttonExports.VERSION,
  MODULE_ID: buttonExports.MODULE_ID
};

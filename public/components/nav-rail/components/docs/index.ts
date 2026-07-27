// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: nav-rail/docs
// PURPOSE: NavRail Docs button — factory-generated component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createButtonExports from ../_shared/button-factory.js
// PROVIDES:
//   createDocsButton() — creates docs button instance
//   init() — initializes the component
//   mount() — mounts button to DOM
//   unmount() — removes button from DOM
//   getInstance() — returns singleton instance
//   healthCheck() — returns component health status
//   info() — returns component metadata
// RECEIVES (via init/options): (none — delegated to button-factory)
// EMITS (eventos): (delegated to button-factory via EMITTED_EVENTS)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 3.2.0-AAA
// @changelog v3.2.0-AAA - Added AAA Dependency Contract
// @changelog v3.1.0-ES6 - var → const migration
'use strict';

import { createButtonExports } from '../_shared/button-factory.js';

const buttonExports = createButtonExports('docs');

export const VERSION = buttonExports.VERSION;
export const MODULE_ID = buttonExports.MODULE_ID;
export const getInstance = buttonExports.getInstance;
export const createDocsButton = buttonExports.createButton;
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
  DocsButton: buttonExports.getInstance,
  getInstance: buttonExports.getInstance,
  createDocsButton: buttonExports.createButton,
  init: buttonExports.init,
  mount: buttonExports.mount,
  unmount: buttonExports.unmount,
  healthCheck: buttonExports.healthCheck,
  info: buttonExports.info,
  VERSION: buttonExports.VERSION,
  MODULE_ID: buttonExports.MODULE_ID
};

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/api
// PURPOSE: API module index — re-exports all API submodules
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ResilientFetch, createFetchClient, fetchWithTimeout from ./fetch.js
//   HealthAPI from ./health.js
//   AlertsAPI from ./alerts.js
//   * as APIFacade from ./api-facade.js
// PROVIDES:
//   ResilientFetch, createFetchClient, fetchWithTimeout
//   HealthAPI, AlertsAPI, APIFacade
//   modules — list of submodule names
//   info() — module info
// ═══════════════════════════════════════════════════════════════
// Header API - Module Index
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B01: var → const
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/api';

// API Modules
export { ResilientFetch, createFetchClient, fetchWithTimeout } from './fetch.js';
export { HealthAPI } from './health.js';
export { AlertsAPI } from './alerts.js';

// Facade (acesso simplificado)
import * as APIFacade from './api-facade.js';
export { APIFacade };

// Module list
export const modules = ['fetch', 'health', 'alerts', 'api-facade'];

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, modules, totalModules: modules.length };
}

export default { VERSION, MODULE_ID, modules, info, APIFacade };

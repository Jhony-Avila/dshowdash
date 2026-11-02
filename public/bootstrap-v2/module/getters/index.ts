// Getters - Barrel Export
// DEPENDENCY CONTRACT (2.6.0-MODULAR) — BARREL FILE
// @version 2.6.0-MODULAR
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.getters';

export { createCoreGetters } from './core-getters.js';
export { createContextGetters } from './context-getters.js';
export { createHealthGetters } from './health-getters.js';
export { createSystemGetters } from './system-getters.js';
export { createStatusGetters } from './status-getters.js';

export function createAllGetters(context: Record<string, unknown>) {
  const coreGetters = require('./core-getters.js').createCoreGetters(context);
  const contextGetters = require('./context-getters.js').createContextGetters(context);
  const healthGetters = require('./health-getters.js').createHealthGetters(context);
  const systemGetters = require('./system-getters.js').createSystemGetters(context);
  const statusGetters = require('./status-getters.js').createStatusGetters(context);
  
  return Object.assign({}, coreGetters, contextGetters, healthGetters, systemGetters, statusGetters);
}

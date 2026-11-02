// Rollback - Barrel Export
// DEPENDENCY CONTRACT (1.0.0) — BARREL FILE
// @version 1.0.0
// @description Sprint 6: #8 Rollback Automático
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.rollback';

export { createRollbackRegistry, EFFECT_TYPES } from './registry.js';
export { createRollbackExecutor } from './executor.js';

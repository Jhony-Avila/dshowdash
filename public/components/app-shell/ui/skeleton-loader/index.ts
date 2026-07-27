// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: skeleton-loader
// PURPOSE: Entry point do Skeleton Loader modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, TEMPLATES
//   ./core.js — create, destroy, destroyIn, destroyAll, hasActive
//   ./custom.js — listTemplates, registerTemplate, unregisterTemplate
//   ./config.js — configure, getConfig
//   ./health.js — getMetrics, healthCheck, info
// ═══════════════════════════════════════════════════════════════
/**
 * @module SkeletonLoader
 * @description Skeleton loading UI customizável
 * @version 1.0.0-AAA
 * @since 2025-02-02
 * @description Sprint 4 Fase 2: Melhoria #29 - Skeleton Loader Customizável (Modularizado)
 */
'use strict';

// Constants
export { VERSION, MODULE_ID, TEMPLATES } from './constants.js';

// Core
export { create, destroy, destroyIn, destroyAll, hasActive } from './core.js';

// Custom Templates
export { listTemplates, registerTemplate, unregisterTemplate } from './custom.js';

// Config
export { configure, getConfig } from './config.js';

// Health
export { getMetrics, healthCheck, info } from './health.js';

// Imports for default export
import { VERSION, MODULE_ID, TEMPLATES } from './constants.js';
import { create, destroy, destroyIn, destroyAll, hasActive } from './core.js';
import { listTemplates, registerTemplate, unregisterTemplate } from './custom.js';
import { configure, getConfig } from './config.js';
import { getMetrics, healthCheck, info } from './health.js';

export default {
    VERSION,
    MODULE_ID,
    TEMPLATES,
    create,
    destroy,
    destroyIn,
    destroyAll,
    hasActive,
    listTemplates,
    registerTemplate,
    unregisterTemplate,
    configure,
    getConfig,
    getMetrics,
    healthCheck,
    info
};

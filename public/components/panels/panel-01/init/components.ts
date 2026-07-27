// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:components
// PURPOSE: Panel-01 - Components Initializer (Modular Orchestrator)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getFeatureStatus from ./feature-loader.js
//   initCoreComponents, initTableExtensions from ./init-core.js
//   initUIBase from ./init-ui-base.js
//   initSearchFilters from ./init-search-filters.js
//   initViews from ./init-views.js
//   initDataAnalysis from ./init-data-analysis.js
//   initUtils from ./init-utils.js
//   initPerformance from ./init-performance.js
//   initCollaboration from ./init-collaboration.js
//   initServices from ./init-services.js
//   initNotifications from ./init-notifications.js
//   initUIExtras from ./init-ui-extras.js
//   destroyComponents from ./destroy.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   initCoreComponents — exported value
//   initTableExtensions — exported value
//   initServices — exported value
//   destroyComponents — exported value
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

import { getFeatureStatus } from './feature-loader.js';
import { initCoreComponents, initTableExtensions } from './init-core.js';
import { initUIBase } from './init-ui-base.js';
import { initSearchFilters } from './init-search-filters.js';
import { initViews } from './init-views.js';
import { initDataAnalysis } from './init-data-analysis.js';
import { initUtils } from './init-utils.js';
import { initPerformance } from './init-performance.js';
import { initCollaboration } from './init-collaboration.js';
import { initServices } from './init-services.js';
import { initNotifications } from './init-notifications.js';
import { initUIExtras } from './init-ui-extras.js';
import { destroyComponents } from './destroy.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:components';

// Orquestrador principal - inicializa todos os componentes
export async function initAllComponents(ctx: Record<string, unknown>, handlers: Record<string, unknown>) {
  const result = { _featureStatus: {} };

  // 1. Core (críticos)
  initCoreComponents(ctx, handlers, result);

  // 2. UI Base (drawer, keyboard, filters, etc)
  await initUIBase(ctx, handlers, result);

  // 3. Search & Filters avançados
  await initSearchFilters(ctx, handlers, result);

  // 4. Collaboration
  await initCollaboration(ctx, handlers, result);

  // 5. Performance (circuit breaker, cache, delta)
  await initPerformance(ctx, result);

  // 6. Notifications (push, sound)
  await initNotifications(ctx, result);

  // 7. Services (websocket, service worker)
  await initServices(ctx, result);

  return result;
}

// UI Extensions - Views e Data Analysis
export async function initUIExtensions(ctx: Record<string, unknown>) {
  const result = {};

  // UI Extras (savedViews, bulkEdit, tags, etc)
  await initUIExtras(ctx, result);

  // Views alternativas
  await initViews(ctx, result);

  // Data Analysis
  await initDataAnalysis(ctx, result);

  return result;
}

// Utils Extensions
export async function initUtilsExtensions(ctx: Record<string, unknown>) {
  const result = {};
  await initUtils(ctx, result);
  await initPerformance(ctx, result);
  await initNotifications(ctx, result);
  return result;
}

// Re-export para compatibilidade
export { initCoreComponents } from './init-core.js';
export { initTableExtensions } from './init-core.js';
export { initServices } from './init-services.js';
export { destroyComponents } from './destroy.js';

export function info() {
  return { 
    moduleId: MODULE_ID, 
    version: VERSION,
    features: getFeatureStatus(),
    modules: [
      'feature-registry', 'init-core', 'init-ui-base', 'init-search-filters',
      'init-views', 'init-data-analysis', 'init-utils', 'init-performance',
      'init-collaboration', 'init-services', 'init-notifications', 'init-ui-extras', 'destroy'
    ]
  };
}

export function healthCheck() {
  const status = getFeatureStatus();
  return {
    status: status.failed.length === 0 ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    loaded: status.loaded.length,
    failed: status.failed.length
  };
}

export default {
  initAllComponents,
  initCoreComponents,
  initTableExtensions,
  initUIExtensions,
  initUtilsExtensions,
  initServices,
  destroyComponents,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};

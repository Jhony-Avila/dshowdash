// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:destroy
// PURPOSE: Panel-01 - Destroy Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   safeExecute from ./feature-loader.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   destroyComponents() — exported function
//   getDestroyList() — exported function
//   info() — exported function
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

import { safeExecute } from './feature-loader.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:destroy';

const DESTROY_LIST = [
  'table', 'drawer', 'pagination', 'selection', 'keyboard', 
  'contextMenu', 'filters', 'actions', 'search', 'toolbar', 'columns',
  'searchSuggestions', 'searchHistory', 'filterPresets', 'dateRangePicker',
  'numericRangeFilter', 'multiSelectFilter', 'importPreview', 'quickFilters',
  'activityLog', 'userAssignments', 'mentions', 'rowHoverMenu',
  'deltaUpdates', 'smartCache', 'pushNotifications', 'soundNotifications',
  'excelExporter', 'cardView', 'kanbanView', 'splitView', 'timelineView',
  'highlightingRules', 'dataComparison', 'dataTrends', 'anomalyDetection',
  'summaryRow', 'skeletonCustom', 'infiniteScroll', 'savedViews', 'bulkEdit',
  'tags', 'preview', 'badgeNew', 'animations', 'duplicateManager', 'circuitBreaker'
];

export const destroyComponents = (comps: Record<string, Record<string, unknown> | null | undefined>) => {
  if (!comps) return;
  
  DESTROY_LIST.forEach(name => {
    if (comps[name]?.destroy) {
      safeExecute(`${name}.destroy`, () => { (comps[name] as Record<string, () => void>).destroy(); });
    }
  });

  if (comps.websocket?.disconnect) {
    safeExecute('websocket.disconnect', () => { (comps.websocket as Record<string, () => void>).disconnect(); });
  }

  if (comps.serviceWorker?.unregister) {
    safeExecute('serviceWorker.unregister', () => { (comps.serviceWorker as Record<string, () => void>).unregister(); });
  }
};

export const getDestroyList = () => DESTROY_LIST.slice();
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, destroyableCount: DESTROY_LIST.length });
export default { destroyComponents, getDestroyList, info };

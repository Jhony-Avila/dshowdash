// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:feature-registry
// PURPOSE: Panel-01 - Feature Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   FeatureModules — exported value
//   Categories — exported value
//   getModuleCount() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:feature-registry';

// Core UI
const CoreUI = {
  drawer() { return import('../ui/drawer.js'); },
  keyboard() { return import('../ui/table/keyboard.js'); },
  contextMenu() { return import('../ui/context-menu.js'); },
  filters() { return import('../ui/filters.js'); },
  actions() { return import('../ui/actions.js'); },
  search() { return import('../ui/search.js'); },
  toolbar() { return import('../ui/toolbar.js'); },
  columns() { return import('../ui/table/columns.js'); },
  savedViews() { return import('../ui/table/saved-views.js'); },
  bulkEdit() { return import('../ui/table/bulk-edit.js'); },
  tags() { return import('../ui/table/tags.js'); },
  preview() { return import('../ui/preview.js'); },
  badgeNew() { return import('../ui/table/badge-new.js'); },
  animations() { return import('../ui/animations.js'); },
  toast() { return import('../ui/toast.js'); }
};

// Search & Filters
const SearchFilters = {
  searchSuggestions() { return import('../ui/search-suggestions.js'); },
  searchHistory() { return import('../ui/search-history.js'); },
  filterPresets() { return import('../ui/filter-presets.js'); },
  dateRangePicker() { return import('../ui/date-range-picker.js'); },
  numericRangeFilter() { return import('../ui/numeric-range-filter.js'); },
  multiSelectFilter() { return import('../ui/multi-select-filter.js'); },
  quickFilters() { return import('../ui/quick-filters.js'); }
};

// Export/Import
const ExportImport = {
  exportXlsx() { return import('../utils/export-xlsx.js'); },
  importPreview() { return import('../ui/import-preview.js'); },
  importManager() { return import('../utils/import.js'); },
  pdfExporter() { return import('../utils/export-pdf.js'); },
  exportUtils() { return import('../utils/export.js'); }
};

// Performance
const Performance = {
  deltaUpdates() { return import('../utils/delta-updates.js'); },
  smartCache() { return import('../utils/smart-cache.js'); },
  circuitBreaker() { return import('../utils/circuit-breaker.js'); }
};

// Notifications
const Notifications = {
  pushNotifications() { return import('../utils/push-notifications.js'); },
  soundNotifications() { return import('../utils/sound-notifications.js'); }
};

// Collaboration
const Collaboration = {
  activityLog() { return import('../ui/activity-log.js'); },
  userAssignments() { return import('../ui/user-assignments.js'); },
  mentions() { return import('../ui/mentions.js'); }
};

// Views Alternativas
const AlternativeViews = {
  cardView() { return import('../ui/card-view.js'); },
  kanbanView() { return import('../ui/kanban-view.js'); },
  splitView() { return import('../ui/split-view.js'); },
  timelineView() { return import('../ui/timeline-view.js'); }
};

// Data Analysis
const DataAnalysis = {
  highlightingRules() { return import('../ui/table/highlighting-rules.js'); },
  dataComparison() { return import('../ui/data-comparison.js'); },
  dataTrends() { return import('../ui/data-trends.js'); },
  anomalyDetection() { return import('../ui/table/anomaly-detection.js'); },
  summaryRow() { return import('../ui/table/summary-row.js'); }
};

// UI Extras
const UIExtras = {
  rowHoverMenu() { return import('../ui/table/row-hover-menu.js'); },
  infiniteScroll() { return import('../ui/infinite-scroll.js'); },
  skeletonCustom() { return import('../ui/skeleton-custom.js'); }
};

// Utils
const Utils = {
  duplicate() { return import('../utils/duplicate.js'); },
  haptic() { return import('../utils/haptic.js'); },
  storage() { return import('../utils/storage.js'); },
  urlState() { return import('../utils/url-state.js'); }
};

// Services
const Services = {
  websocket() { return import('../services/websocket.js'); },
  serviceWorker() { return import('../services/service-worker.js'); }
};

export const FeatureModules = Object.assign({}, CoreUI, SearchFilters, ExportImport, Performance, Notifications, Collaboration, AlternativeViews, DataAnalysis, UIExtras, Utils, Services);

export const Categories = {
  CoreUI: Object.keys(CoreUI),
  SearchFilters: Object.keys(SearchFilters),
  ExportImport: Object.keys(ExportImport),
  Performance: Object.keys(Performance),
  Notifications: Object.keys(Notifications),
  Collaboration: Object.keys(Collaboration),
  AlternativeViews: Object.keys(AlternativeViews),
  DataAnalysis: Object.keys(DataAnalysis),
  UIExtras: Object.keys(UIExtras),
  Utils: Object.keys(Utils),
  Services: Object.keys(Services)
};

export function getModuleCount() { return Object.keys(FeatureModules).length; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, totalModules: getModuleCount(), categories: Object.keys(Categories) }; }
export default FeatureModules;

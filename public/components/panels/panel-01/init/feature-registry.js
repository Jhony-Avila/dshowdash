const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:feature-registry";
const CoreUI = {
  drawer() {
    return import("../ui/drawer.js");
  },
  keyboard() {
    return import("../ui/table/keyboard.js");
  },
  contextMenu() {
    return import("../ui/context-menu.js");
  },
  filters() {
    return import("../ui/filters.js");
  },
  actions() {
    return import("../ui/actions.js");
  },
  search() {
    return import("../ui/search.js");
  },
  toolbar() {
    return import("../ui/toolbar.js");
  },
  columns() {
    return import("../ui/table/columns.js");
  },
  savedViews() {
    return import("../ui/table/saved-views.js");
  },
  bulkEdit() {
    return import("../ui/table/bulk-edit.js");
  },
  tags() {
    return import("../ui/table/tags.js");
  },
  preview() {
    return import("../ui/preview.js");
  },
  badgeNew() {
    return import("../ui/table/badge-new.js");
  },
  animations() {
    return import("../ui/animations.js");
  },
  toast() {
    return import("../ui/toast.js");
  }
};
const SearchFilters = {
  searchSuggestions() {
    return import("../ui/search-suggestions.js");
  },
  searchHistory() {
    return import("../ui/search-history.js");
  },
  filterPresets() {
    return import("../ui/filter-presets.js");
  },
  dateRangePicker() {
    return import("../ui/date-range-picker.js");
  },
  numericRangeFilter() {
    return import("../ui/numeric-range-filter.js");
  },
  multiSelectFilter() {
    return import("../ui/multi-select-filter.js");
  },
  quickFilters() {
    return import("../ui/quick-filters.js");
  }
};
const ExportImport = {
  exportXlsx() {
    return import("../utils/export-xlsx.js");
  },
  importPreview() {
    return import("../ui/import-preview.js");
  },
  importManager() {
    return import("../utils/import.js");
  },
  pdfExporter() {
    return import("../utils/export-pdf.js");
  },
  exportUtils() {
    return import("../utils/export.js");
  }
};
const Performance = {
  deltaUpdates() {
    return import("../utils/delta-updates.js");
  },
  smartCache() {
    return import("../utils/smart-cache.js");
  },
  circuitBreaker() {
    return import("../utils/circuit-breaker.js");
  }
};
const Notifications = {
  pushNotifications() {
    return import("../utils/push-notifications.js");
  },
  soundNotifications() {
    return import("../utils/sound-notifications.js");
  }
};
const Collaboration = {
  activityLog() {
    return import("../ui/activity-log.js");
  },
  userAssignments() {
    return import("../ui/user-assignments.js");
  },
  mentions() {
    return import("../ui/mentions.js");
  }
};
const AlternativeViews = {
  cardView() {
    return import("../ui/card-view.js");
  },
  kanbanView() {
    return import("../ui/kanban-view.js");
  },
  splitView() {
    return import("../ui/split-view.js");
  },
  timelineView() {
    return import("../ui/timeline-view.js");
  }
};
const DataAnalysis = {
  highlightingRules() {
    return import("../ui/table/highlighting-rules.js");
  },
  dataComparison() {
    return import("../ui/data-comparison.js");
  },
  dataTrends() {
    return import("../ui/data-trends.js");
  },
  anomalyDetection() {
    return import("../ui/table/anomaly-detection.js");
  },
  summaryRow() {
    return import("../ui/table/summary-row.js");
  }
};
const UIExtras = {
  rowHoverMenu() {
    return import("../ui/table/row-hover-menu.js");
  },
  infiniteScroll() {
    return import("../ui/infinite-scroll.js");
  },
  skeletonCustom() {
    return import("../ui/skeleton-custom.js");
  }
};
const Utils = {
  duplicate() {
    return import("../utils/duplicate.js");
  },
  haptic() {
    return import("../utils/haptic.js");
  },
  storage() {
    return import("../utils/storage.js");
  },
  urlState() {
    return import("../utils/url-state.js");
  }
};
const Services = {
  websocket() {
    return import("../services/websocket.js");
  },
  serviceWorker() {
    return import("../services/service-worker.js");
  }
};
const FeatureModules = Object.assign({}, CoreUI, SearchFilters, ExportImport, Performance, Notifications, Collaboration, AlternativeViews, DataAnalysis, UIExtras, Utils, Services);
const Categories = {
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
function getModuleCount() {
  return Object.keys(FeatureModules).length;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, totalModules: getModuleCount(), categories: Object.keys(Categories) };
}
var feature_registry_default = FeatureModules;
export {
  Categories,
  FeatureModules,
  MODULE_ID,
  VERSION,
  feature_registry_default as default,
  getModuleCount,
  info
};

import { DEFAULT_REGION } from "./constants.js";
import { normalizeTrigger, extractIdFromTrigger } from "./trigger-normalizer.js";
import { logAudit } from "./audit.js";
const MODULE_ID = "item-adapter-legacy";
const VERSION = "1.2.0-ES6";
const STATUS = "LEGACY_ONLY";
let _metrics = { errors: 0, regionAssignments: 0, adaptations: 0 };
function getMetrics() {
  return {
    errors: _metrics.errors,
    regionAssignments: _metrics.regionAssignments,
    adaptations: _metrics.adaptations
  };
}
function resetMetrics() {
  _metrics.errors = 0;
  _metrics.regionAssignments = 0;
  _metrics.adaptations = 0;
}
function assignRegion(item, defaultRegion) {
  if (item.uarps && item.uarps.region_id) {
    return item.uarps.region_id;
  }
  if (item.region) {
    return item.region;
  }
  _metrics.regionAssignments++;
  return defaultRegion || DEFAULT_REGION;
}
function adaptBadge(legacyBadge) {
  if (!legacyBadge) return null;
  if (typeof legacyBadge === "object") {
    return {
      type: legacyBadge.type || "count",
      value: legacyBadge.value || legacyBadge.count || null,
      pulse: legacyBadge.pulse || legacyBadge.animated || false
    };
  }
  if (typeof legacyBadge === "number") {
    return { type: "count", value: legacyBadge, pulse: false };
  }
  if (typeof legacyBadge === "string") {
    if (legacyBadge === "dot" || legacyBadge === "new") {
      return { type: "dot", value: null, pulse: true };
    }
    return { type: "text", value: legacyBadge, pulse: false };
  }
  return null;
}
function adaptItem(legacyItem, sectionId, options = {}) {
  const region = options.region || DEFAULT_REGION;
  const itemId = legacyItem.id || legacyItem.itemId || extractIdFromTrigger(legacyItem.trigger);
  if (!itemId) {
    _metrics.errors++;
    logAudit("item:error:legacy", { reason: "No ID found", item: legacyItem });
    return null;
  }
  const triggerId = normalizeTrigger(
    legacyItem.trigger || legacyItem.uarps?.trigger_id || itemId,
    "item"
  );
  let navigationMode = "link";
  let navigationAction = null;
  if (legacyItem.panelId || legacyItem.panel) {
    navigationMode = "action";
    navigationAction = `panel:${legacyItem.panelId || legacyItem.panel}`;
  } else if (legacyItem.action) {
    navigationMode = "action";
    navigationAction = legacyItem.action;
  } else if (legacyItem.onClick || legacyItem.handler) {
    navigationMode = "custom";
  }
  const adaptedItem = {
    id: itemId,
    label: legacyItem.label || legacyItem.title || legacyItem.name || itemId,
    description: legacyItem.description || null,
    icon: legacyItem.icon || "file",
    route: legacyItem.route || legacyItem.path || legacyItem.href || null,
    section: sectionId,
    order: legacyItem.order || legacyItem.priority || 0,
    navigation: { mode: navigationMode, action: navigationAction },
    uarps: {
      trigger_id: triggerId,
      region_id: assignRegion(legacyItem, region),
      visibility: legacyItem.visible === false ? "hide" : legacyItem.disabled ? "disable" : "show"
    },
    state: {
      disabled: legacyItem.disabled || false,
      hidden: legacyItem.visible === false || legacyItem.hidden === true,
      active: legacyItem.active || false
    },
    badge: adaptBadge(legacyItem.badge),
    source: "legacy-adapter",
    version: "v1"
  };
  _metrics.adaptations++;
  logAudit("item:adapted:legacy", { id: itemId, trigger: triggerId });
  return adaptedItem;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    status: STATUS,
    warning: "LEGACY ONLY - Do not use for new code",
    metrics: getMetrics()
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    legacyStatus: STATUS,
    checks: {
      adapterAvailable: true,
      outputFormat: "NavigationModel V1",
      isLegacyOnly: true
    },
    metrics: getMetrics()
  };
}
var item_adapter_default = {
  MODULE_ID,
  VERSION,
  STATUS,
  adaptItem,
  adaptBadge,
  assignRegion,
  getMetrics,
  resetMetrics,
  info,
  healthCheck
};
export {
  MODULE_ID,
  STATUS,
  VERSION,
  adaptBadge,
  adaptItem,
  assignRegion,
  item_adapter_default as default,
  getMetrics,
  healthCheck,
  info,
  resetMetrics
};

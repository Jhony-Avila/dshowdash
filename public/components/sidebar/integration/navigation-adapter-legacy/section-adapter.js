import { DEFAULT_REGION, SECTION_MAPPING } from "./constants.js";
import { normalizeTrigger } from "./trigger-normalizer.js";
import { adaptItem, assignRegion } from "./item-adapter.js";
import { logAudit } from "./audit.js";
const MODULE_ID = "section-adapter-legacy";
const VERSION = "1.2.0-ES6";
const STATUS = "LEGACY_ONLY";
let _metrics = { errors: 0, adaptations: 0 };
function getMetrics() {
  return {
    errors: _metrics.errors,
    adaptations: _metrics.adaptations
  };
}
function resetMetrics() {
  _metrics.errors = 0;
  _metrics.adaptations = 0;
}
function adaptSection(legacySection, options = {}) {
  const region = options.region || DEFAULT_REGION;
  const sectionId = legacySection.id || legacySection.sectionId;
  if (!sectionId) {
    _metrics.errors++;
    logAudit("section:error:legacy", { reason: "No ID found", section: legacySection });
    return null;
  }
  const normalizedSectionId = sectionId.replace(/^sec-/, "");
  const canonicalId = SECTION_MAPPING[normalizedSectionId] || normalizedSectionId;
  const triggerId = normalizeTrigger(
    legacySection.trigger || legacySection.uarps?.trigger_id || canonicalId,
    "section"
  );
  const adaptedItems = [];
  const items = legacySection.items || [];
  for (let i = 0; i < items.length; i++) {
    const adaptedItem = adaptItem(items[i], canonicalId, { region });
    if (adaptedItem) {
      adaptedItems.push(adaptedItem);
    }
  }
  const adaptedSection = {
    id: canonicalId,
    label: legacySection.label || legacySection.title || legacySection.name || canonicalId,
    description: legacySection.description || null,
    icon: legacySection.icon || "folder",
    order: legacySection.order || legacySection.priority || 0,
    uarps: {
      trigger_id: triggerId,
      region_id: assignRegion(legacySection, region)
    },
    accordion: {
      collapsible: legacySection.collapsible !== false,
      default_open: legacySection.expanded !== false && legacySection.defaultOpen !== false,
      allow_multiple: legacySection.allowMultiple !== false
    },
    visible: legacySection.visible !== false,
    items: adaptedItems,
    source: "legacy-adapter",
    version: "v1"
  };
  _metrics.adaptations++;
  logAudit("section:adapted:legacy", { id: canonicalId, trigger: triggerId, itemsCount: adaptedItems.length });
  return adaptedSection;
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
var section_adapter_default = {
  MODULE_ID,
  VERSION,
  STATUS,
  adaptSection,
  getMetrics,
  resetMetrics,
  info,
  healthCheck
};
export {
  MODULE_ID,
  STATUS,
  VERSION,
  adaptSection,
  section_adapter_default as default,
  getMetrics,
  healthCheck,
  info,
  resetMetrics
};

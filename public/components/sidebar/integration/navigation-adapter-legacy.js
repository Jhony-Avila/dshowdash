import { VERSION, MODULE_ID, DEFAULT_REGION } from "./navigation-adapter-legacy/constants.js";
import { getAuditLog, clearAuditLog, logAudit } from "./navigation-adapter-legacy/audit.js";
import { normalizeTrigger } from "./navigation-adapter-legacy/trigger-normalizer.js";
import { adaptItem } from "./navigation-adapter-legacy/item-adapter.js";
import { adaptSection } from "./navigation-adapter-legacy/section-adapter.js";
import { validateAdaptedModel } from "./navigation-adapter-legacy/validation.js";
import { getMetrics, resetMetrics, healthCheck, info, incrementAdaptations, incrementDeduplications } from "./navigation-adapter-legacy/health.js";
function adaptLegacyModel(legacyData, options = {}) {
  const region = options.region || DEFAULT_REGION;
  incrementAdaptations();
  logAudit("model:adaptation:start", { source: options.source || "unknown" });
  const sections = [];
  const seenIds = {};
  let inputSections = [];
  if (Array.isArray(legacyData)) {
    inputSections = legacyData;
  } else if (legacyData.sections) {
    inputSections = legacyData.sections;
  } else if (legacyData.items) {
    inputSections = [{
      id: "default",
      label: "Menu",
      items: legacyData.items
    }];
  } else {
    logAudit("model:error", { reason: "Unknown input format" });
    return { success: false, error: "Unknown input format", model: null };
  }
  for (let i = 0; i < inputSections.length; i++) {
    const adaptedSection = adaptSection(inputSections[i], { region });
    if (adaptedSection) {
      if (seenIds[adaptedSection.id]) {
        incrementDeduplications();
        logAudit("section:deduplicated", { id: adaptedSection.id });
        const existingSection = sections.find((s) => s.id === adaptedSection.id);
        if (existingSection) {
          existingSection.items = existingSection.items.concat(adaptedSection.items);
        }
      } else {
        seenIds[adaptedSection.id] = true;
        sections.push(adaptedSection);
      }
    }
  }
  sections.sort((a, b) => (a.order || 0) - (b.order || 0));
  const model = {
    schema_id: "dsd.contracts/navigation.model.v1.json",
    version: "1.0.0",
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    source: options.source || "legacy",
    etag: null,
    sections,
    defaults: {
      mode: "multi",
      persist: { enabled: true, scope: "user" }
    },
    meta: {
      trigger_pattern: "trigger:navigation:item-{id}",
      section_trigger_pattern: "trigger:navigation:section-{id}",
      region,
      phase: "P0",
      compatibility: {
        legacy_triggers: true,
        legacy_events: true
      },
      adapter: {
        version: VERSION,
        adaptedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    }
  };
  logAudit("model:adaptation:complete", {
    sectionsCount: sections.length,
    itemsCount: sections.reduce((acc, s) => acc + (s.items?.length || 0), 0)
  });
  return {
    success: true,
    model,
    audit: getAuditLog()
  };
}
function adaptSingleItem(legacyItem, sectionId, options) {
  return adaptItem(legacyItem, sectionId, options);
}
function adaptSingleSection(legacySection, options) {
  return adaptSection(legacySection, options);
}
function normalizeSingleTrigger(trigger, type) {
  return normalizeTrigger(trigger, type || "item");
}
const NavigationAdapterLegacy = {
  VERSION,
  MODULE_ID,
  adaptLegacyModel,
  adaptSingleItem,
  adaptSingleSection,
  normalizeSingleTrigger,
  validateAdaptedModel,
  getAuditLog,
  clearAuditLog,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
if (typeof window !== "undefined") {
  window.NavigationAdapterLegacy = NavigationAdapterLegacy;
}
var navigation_adapter_legacy_default = NavigationAdapterLegacy;
export {
  MODULE_ID,
  VERSION,
  adaptLegacyModel,
  adaptSingleItem,
  adaptSingleSection,
  clearAuditLog,
  navigation_adapter_legacy_default as default,
  getAuditLog,
  getMetrics,
  healthCheck,
  info,
  normalizeSingleTrigger,
  resetMetrics,
  validateAdaptedModel
};

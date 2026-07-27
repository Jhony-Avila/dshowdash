import { UARPS_REGION } from "./constants.js";
const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.features.accordion-ncs.model-converter";
function convertModelToAccordionStructure(model) {
  if (!model || !model.sections) {
    return null;
  }
  return {
    version: model.version || "1.0.0",
    source: model.source || "navigation-model",
    generatedAt: model.generated_at || (/* @__PURE__ */ new Date()).toISOString(),
    sections: model.sections.map((section) => ({
      id: `sec-${section.id}`,
      label: section.label,
      icon: section.icon || "folder",
      order: section.order || 0,
      defaultOpen: section.accordion?.default_open !== false,
      collapsible: section.accordion?.collapsible !== false,
      visible: section.visible !== false,
      uarps: section.uarps || {
        trigger_id: `trigger:navigation:section-${section.id}`,
        region_id: UARPS_REGION
      },
      items: (section.items || []).map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon || "file",
        order: item.order || 0,
        type: item.navigation?.mode === "action" ? "panel" : "route",
        target: {
          panelId: item.navigation?.action?.replace("panel:", "") || null,
          route: item.route || null,
          path: item.route || null
        },
        disabled: item.state?.disabled || false,
        badge: item.badge || null,
        uarps: item.uarps || {
          trigger_id: `trigger:navigation:item-${item.id}`,
          region_id: UARPS_REGION
        }
      }))
    })),
    defaults: model.defaults || {
      mode: "multi",
      persist: { enabled: true, scope: "user" }
    },
    meta: {
      triggerPattern: model.meta?.trigger_pattern || "trigger:navigation:item-{id}",
      region: UARPS_REGION,
      phase: model.meta?.phase || "P0",
      loaderSource: model.source
    }
  };
}
var model_converter_default = { convertModelToAccordionStructure };
export {
  MODULE_ID,
  VERSION,
  convertModelToAccordionStructure,
  model_converter_default as default
};

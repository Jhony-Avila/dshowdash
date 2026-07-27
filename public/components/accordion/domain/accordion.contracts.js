const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.domain.contracts";
const SCHEMA_VERSION = "1.0.0";
const SCHEMA_ID = "accordion.sidebar.v1";
const ACCORDION_MODE = Object.freeze({
  SINGLE: "single",
  MULTI: "multi"
});
const ITEM_ACTION_TYPE = Object.freeze({
  ROUTE: "route",
  PANEL: "panel",
  ACTION: "action",
  EXTERNAL: "external"
});
const VISIBILITY_MODE = Object.freeze({
  SHOW: "show",
  DISABLE: "disable",
  HIDE: "hide"
});
const DATA_SOURCE = Object.freeze({
  MOCK: "mock",
  ADMIN_CONFIG: "admin-config",
  FALLBACK: "fallback",
  API: "api"
});
const LOADING_STATE = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  RESTORING: "restoring",
  READY: "ready",
  ERROR: "error"
});
const UARPS_ENFORCEMENT = Object.freeze({
  E0: "e0",
  E1: "e1",
  E2: "e2"
});
const SectionContract = Object.freeze({
  required: ["id", "label"],
  optional: ["icon", "order", "defaultOpen", "collapsible", "pinned", "visible", "visibilityPolicy", "items", "meta"],
  defaults: {
    icon: null,
    order: 100,
    defaultOpen: false,
    collapsible: true,
    pinned: false,
    visible: true,
    visibilityPolicy: null,
    items: [],
    meta: {}
  }
});
const ItemContract = Object.freeze({
  required: ["id", "label", "type", "target"],
  optional: ["icon", "order", "badge", "visibilityPolicy", "intent", "telemetry", "meta", "disabled"],
  defaults: {
    icon: null,
    order: 100,
    badge: null,
    visibilityPolicy: null,
    intent: null,
    telemetry: {},
    meta: {},
    disabled: false
  }
});
const VisibilityPolicyContract = Object.freeze({
  required: ["mode"],
  optional: ["triggerId", "regionId", "fallback", "reason"],
  defaults: {
    mode: VISIBILITY_MODE.SHOW,
    triggerId: null,
    regionId: null,
    fallback: VISIBILITY_MODE.SHOW,
    reason: null
  }
});
const BadgeContract = Object.freeze({
  required: ["type"],
  optional: ["value", "label", "pulse", "variant"],
  defaults: {
    type: "none",
    value: null,
    label: null,
    pulse: false,
    variant: "default"
  }
});
const ActionContract = Object.freeze({
  route: { required: ["path"], optional: ["params", "query"] },
  panel: { required: ["panelId"], optional: ["containerId", "options"] },
  action: { required: ["actionId"], optional: ["payload"] },
  external: { required: ["url"], optional: ["target", "rel"] }
});
const AccordionStateContract = Object.freeze({
  required: ["mode", "openSections", "activeItemId", "loadingState"],
  optional: ["lastInteractionAt", "errorState", "pinnedItems"],
  defaults: {
    mode: ACCORDION_MODE.MULTI,
    openSections: [],
    activeItemId: null,
    loadingState: LOADING_STATE.IDLE,
    lastInteractionAt: null,
    errorState: null,
    pinnedItems: []
  }
});
const PersistenceContract = Object.freeze({
  namespace: "dshowdash:accordion:v1",
  keys: {
    state: "state",
    preferences: "prefs"
  },
  ttl: 30 * 24 * 60 * 60 * 1e3,
  version: SCHEMA_VERSION
});
const ModelContract = Object.freeze({
  required: ["version", "source", "sections"],
  optional: ["generatedAt", "context", "defaults", "meta"],
  defaults: {
    generatedAt: null,
    context: {
      tenantId: null,
      environment: "production",
      featureFlags: {}
    },
    defaults: {
      mode: ACCORDION_MODE.MULTI,
      persist: {
        enabled: true,
        scope: "user",
        precedence: ["backend", "local", "model"]
      }
    },
    meta: {}
  }
});
function createSection(data) {
  if (!data.id || !data.label) {
    throw new Error("Section requires id and label");
  }
  return {
    id: data.id,
    label: data.label,
    icon: data.icon ?? SectionContract.defaults.icon,
    order: data.order ?? SectionContract.defaults.order,
    defaultOpen: data.defaultOpen ?? SectionContract.defaults.defaultOpen,
    collapsible: data.collapsible ?? SectionContract.defaults.collapsible,
    pinned: data.pinned ?? SectionContract.defaults.pinned,
    visible: data.visible ?? SectionContract.defaults.visible,
    visibilityPolicy: data.visibilityPolicy ?? SectionContract.defaults.visibilityPolicy,
    items: data.items ?? SectionContract.defaults.items,
    meta: data.meta ?? SectionContract.defaults.meta
  };
}
function createItem(data) {
  if (!data.id || !data.label || !data.type || !data.target) {
    throw new Error("Item requires id, label, type, and target");
  }
  if (!Object.values(ITEM_ACTION_TYPE).includes(data.type)) {
    throw new Error(`Invalid item type: ${data.type}`);
  }
  return {
    id: data.id,
    label: data.label,
    type: data.type,
    target: data.target,
    icon: data.icon ?? ItemContract.defaults.icon,
    order: data.order ?? ItemContract.defaults.order,
    badge: data.badge ?? ItemContract.defaults.badge,
    visibilityPolicy: data.visibilityPolicy ?? ItemContract.defaults.visibilityPolicy,
    intent: data.intent ?? ItemContract.defaults.intent,
    telemetry: data.telemetry ?? ItemContract.defaults.telemetry,
    meta: data.meta ?? ItemContract.defaults.meta,
    disabled: data.disabled ?? ItemContract.defaults.disabled
  };
}
function createVisibilityPolicy(data) {
  return {
    mode: data.mode ?? VisibilityPolicyContract.defaults.mode,
    triggerId: data.triggerId ?? VisibilityPolicyContract.defaults.triggerId,
    regionId: data.regionId ?? VisibilityPolicyContract.defaults.regionId,
    fallback: data.fallback ?? VisibilityPolicyContract.defaults.fallback,
    reason: data.reason ?? VisibilityPolicyContract.defaults.reason
  };
}
function createAccordionState(data = {}) {
  return {
    mode: data.mode ?? AccordionStateContract.defaults.mode,
    openSections: Array.isArray(data.openSections) ? [...data.openSections] : [],
    activeItemId: data.activeItemId ?? AccordionStateContract.defaults.activeItemId,
    loadingState: data.loadingState ?? AccordionStateContract.defaults.loadingState,
    lastInteractionAt: data.lastInteractionAt ?? AccordionStateContract.defaults.lastInteractionAt,
    errorState: data.errorState ?? AccordionStateContract.defaults.errorState,
    pinnedItems: Array.isArray(data.pinnedItems) ? [...data.pinnedItems] : []
  };
}
function createModel(data) {
  if (!data.version || !data.source || !Array.isArray(data.sections)) {
    throw new Error("Model requires version, source, and sections array");
  }
  return {
    version: data.version,
    source: data.source,
    sections: data.sections.map((s) => createSection(s)),
    generatedAt: data.generatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    context: { ...ModelContract.defaults.context, ...data.context },
    defaults: { ...ModelContract.defaults.defaults, ...data.defaults },
    meta: data.meta ?? ModelContract.defaults.meta
  };
}
function validateSection(section) {
  const errors = [];
  if (!section.id) errors.push("Section missing id");
  if (!section.label) errors.push("Section missing label");
  if (section.visibilityPolicy && !Object.values(VISIBILITY_MODE).includes(section.visibilityPolicy.mode)) {
    errors.push(`Invalid visibility mode: ${section.visibilityPolicy.mode}`);
  }
  return { valid: errors.length === 0, errors };
}
function validateItem(item) {
  const errors = [];
  if (!item.id) errors.push("Item missing id");
  if (!item.label) errors.push("Item missing label");
  if (!item.type) errors.push("Item missing type");
  if (!item.target) errors.push("Item missing target");
  if (item.type && !Object.values(ITEM_ACTION_TYPE).includes(item.type)) {
    errors.push(`Invalid item type: ${item.type}`);
  }
  return { valid: errors.length === 0, errors };
}
function validateModel(model) {
  const errors = [];
  if (!model.version) errors.push("Model missing version");
  if (!model.source) errors.push("Model missing source");
  if (!Array.isArray(model.sections)) errors.push("Model sections must be array");
  model.sections?.forEach((section, idx) => {
    const sectionValidation = validateSection(section);
    if (!sectionValidation.valid) {
      errors.push(`Section[${idx}]: ${sectionValidation.errors.join(", ")}`);
    }
    section.items?.forEach((item, itemIdx) => {
      const itemValidation = validateItem(item);
      if (!itemValidation.valid) {
        errors.push(`Section[${idx}].Item[${itemIdx}]: ${itemValidation.errors.join(", ")}`);
      }
    });
  });
  return { valid: errors.length === 0, errors };
}
function serializeState(state) {
  return JSON.stringify({
    v: SCHEMA_VERSION,
    mode: state.mode,
    openSections: state.openSections,
    activeItemId: state.activeItemId,
    pinnedItems: state.pinnedItems,
    ts: Date.now()
  });
}
function deserializeState(json) {
  try {
    const data = JSON.parse(json);
    if (data.v !== SCHEMA_VERSION) {
      return { success: false, error: "Schema version mismatch", data: null };
    }
    return {
      success: true,
      error: null,
      data: createAccordionState({
        mode: data.mode,
        openSections: data.openSections,
        activeItemId: data.activeItemId,
        pinnedItems: data.pinnedItems
      })
    };
  } catch (e) {
    return { success: false, error: e.message, data: null };
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    schemaVersion: SCHEMA_VERSION,
    schemaId: SCHEMA_ID,
    enums: {
      accordionMode: Object.keys(ACCORDION_MODE),
      itemActionType: Object.keys(ITEM_ACTION_TYPE),
      visibilityMode: Object.keys(VISIBILITY_MODE),
      dataSource: Object.keys(DATA_SOURCE),
      loadingState: Object.keys(LOADING_STATE),
      uarpsEnforcement: Object.keys(UARPS_ENFORCEMENT)
    }
  };
}
function healthCheck() {
  const checks = {
    contractsValid: true,
    enumsValid: true,
    factoriesAvailable: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID,
    version: VERSION,
    schemaVersion: SCHEMA_VERSION,
    timestamp: Date.now()
  };
}
var accordion_contracts_default = {
  VERSION,
  MODULE_ID,
  SCHEMA_VERSION,
  SCHEMA_ID,
  ACCORDION_MODE,
  ITEM_ACTION_TYPE,
  VISIBILITY_MODE,
  DATA_SOURCE,
  LOADING_STATE,
  UARPS_ENFORCEMENT,
  SectionContract,
  ItemContract,
  VisibilityPolicyContract,
  BadgeContract,
  ActionContract,
  AccordionStateContract,
  PersistenceContract,
  ModelContract,
  createSection,
  createItem,
  createVisibilityPolicy,
  createAccordionState,
  createModel,
  validateSection,
  validateItem,
  validateModel,
  serializeState,
  deserializeState,
  info,
  healthCheck
};
export {
  ACCORDION_MODE,
  AccordionStateContract,
  ActionContract,
  BadgeContract,
  DATA_SOURCE,
  ITEM_ACTION_TYPE,
  ItemContract,
  LOADING_STATE,
  MODULE_ID,
  ModelContract,
  PersistenceContract,
  SCHEMA_ID,
  SCHEMA_VERSION,
  SectionContract,
  UARPS_ENFORCEMENT,
  VERSION,
  VISIBILITY_MODE,
  VisibilityPolicyContract,
  createAccordionState,
  createItem,
  createModel,
  createSection,
  createVisibilityPolicy,
  accordion_contracts_default as default,
  deserializeState,
  healthCheck,
  info,
  serializeState,
  validateItem,
  validateModel,
  validateSection
};

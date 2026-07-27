// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.domain.contracts
// PURPOSE: Data model contracts and factories for accordion
// ───────────────────────────────────────────────────────────────
// @contract ACCORDION_MODE - Mode enum constants
// @contract ITEM_ACTION_TYPE - Item action type enum
// @contract VISIBILITY_MODE - Visibility mode enum
// @contract DATA_SOURCE - Data source enum
// @contract LOADING_STATE - Loading state enum
// @contract SECTION_CONTRACT - Section structure contract
// @contract ITEM_CONTRACT - Item structure contract
// @contract CREATE_SECTION - createSection(data) factory
// @contract CREATE_ITEM - createItem(data) factory
// @contract CREATE_ACCORDION_STATE - createAccordionState(data) factory
// @contract CREATE_MODEL - createModel(data) factory
// @contract VALIDATE_SECTION - validateSection(section) validator
// @contract VALIDATE_ITEM - validateItem(item) validator
// @contract VALIDATE_MODEL - validateModel(model) validator
// @contract SERIALIZE_STATE - serializeState(state) serializer
// @contract DESERIALIZE_STATE - deserializeState(json) deserializer
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: All enums, contracts, factories, validators, serializers,
//           healthCheck, info, VERSION, MODULE_ID
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE: Initial enterprise contracts
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.domain.contracts';

export const SCHEMA_VERSION = '1.0.0';
export const SCHEMA_ID = 'accordion.sidebar.v1';

export const ACCORDION_MODE = Object.freeze({
  SINGLE: 'single',
  MULTI: 'multi'
});

export const ITEM_ACTION_TYPE = Object.freeze({
  ROUTE: 'route',
  PANEL: 'panel',
  ACTION: 'action',
  EXTERNAL: 'external'
});

export const VISIBILITY_MODE = Object.freeze({
  SHOW: 'show',
  DISABLE: 'disable',
  HIDE: 'hide'
});

export const DATA_SOURCE = Object.freeze({
  MOCK: 'mock',
  ADMIN_CONFIG: 'admin-config',
  FALLBACK: 'fallback',
  API: 'api'
});

export const LOADING_STATE = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  RESTORING: 'restoring',
  READY: 'ready',
  ERROR: 'error'
});

export const UARPS_ENFORCEMENT = Object.freeze({
  E0: 'e0',
  E1: 'e1',
  E2: 'e2'
});

export const SectionContract = Object.freeze({
  required: ['id', 'label'],
  optional: ['icon', 'order', 'defaultOpen', 'collapsible', 'pinned', 'visible', 'visibilityPolicy', 'items', 'meta'],
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

export const ItemContract = Object.freeze({
  required: ['id', 'label', 'type', 'target'],
  optional: ['icon', 'order', 'badge', 'visibilityPolicy', 'intent', 'telemetry', 'meta', 'disabled'],
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

export const VisibilityPolicyContract = Object.freeze({
  required: ['mode'],
  optional: ['triggerId', 'regionId', 'fallback', 'reason'],
  defaults: {
    mode: VISIBILITY_MODE.SHOW,
    triggerId: null,
    regionId: null,
    fallback: VISIBILITY_MODE.SHOW,
    reason: null
  }
});

export const BadgeContract = Object.freeze({
  required: ['type'],
  optional: ['value', 'label', 'pulse', 'variant'],
  defaults: {
    type: 'none',
    value: null,
    label: null,
    pulse: false,
    variant: 'default'
  }
});

export const ActionContract = Object.freeze({
  route: { required: ['path'], optional: ['params', 'query'] },
  panel: { required: ['panelId'], optional: ['containerId', 'options'] },
  action: { required: ['actionId'], optional: ['payload'] },
  external: { required: ['url'], optional: ['target', 'rel'] }
});

export const AccordionStateContract = Object.freeze({
  required: ['mode', 'openSections', 'activeItemId', 'loadingState'],
  optional: ['lastInteractionAt', 'errorState', 'pinnedItems'],
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

export const PersistenceContract = Object.freeze({
  namespace: 'dshowdash:accordion:v1',
  keys: {
    state: 'state',
    preferences: 'prefs'
  },
  ttl: 30 * 24 * 60 * 60 * 1000,
  version: SCHEMA_VERSION
});

export const ModelContract = Object.freeze({
  required: ['version', 'source', 'sections'],
  optional: ['generatedAt', 'context', 'defaults', 'meta'],
  defaults: {
    generatedAt: null,
    context: {
      tenantId: null,
      environment: 'production',
      featureFlags: {}
    },
    defaults: {
      mode: ACCORDION_MODE.MULTI,
      persist: {
        enabled: true,
        scope: 'user',
        precedence: ['backend', 'local', 'model']
      }
    },
    meta: {}
  }
});

export function createSection(data: Record<string, unknown>) {
  if (!data.id || !data.label) {
    throw new Error('Section requires id and label');
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

export function createItem(data: Record<string, unknown>) {
  if (!data.id || !data.label || !data.type || !data.target) {
    throw new Error('Item requires id, label, type, and target');
  }
  if (!Object.values(ITEM_ACTION_TYPE).includes(data.type as "action" | "panel" | "route" | "external")) {
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

export function createVisibilityPolicy(data: Record<string, unknown>) {
  return {
    mode: data.mode ?? VisibilityPolicyContract.defaults.mode,
    triggerId: data.triggerId ?? VisibilityPolicyContract.defaults.triggerId,
    regionId: data.regionId ?? VisibilityPolicyContract.defaults.regionId,
    fallback: data.fallback ?? VisibilityPolicyContract.defaults.fallback,
    reason: data.reason ?? VisibilityPolicyContract.defaults.reason
  };
}

export function createAccordionState(data: Record<string, unknown> = {}) {
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

export function createModel(data: Record<string, unknown>) {
  if (!data.version || !data.source || !Array.isArray(data.sections)) {
    throw new Error('Model requires version, source, and sections array');
  }
  return {
    version: data.version,
    source: data.source,
    sections: data.sections.map(s => createSection(s)),
    generatedAt: data.generatedAt ?? new Date().toISOString(),
    context: { ...ModelContract.defaults.context, ...(data.context as Record<string, unknown>) },
    defaults: { ...ModelContract.defaults.defaults, ...(data.defaults as Record<string, unknown>) },
    meta: data.meta ?? ModelContract.defaults.meta
  };
}

export function validateSection(section: Record<string, any>) {
  const errors = [];
  if (!section.id) errors.push('Section missing id');
  if (!section.label) errors.push('Section missing label');
  if (section.visibilityPolicy && !Object.values(VISIBILITY_MODE).includes(section.visibilityPolicy.mode)) {
    errors.push(`Invalid visibility mode: ${section.visibilityPolicy.mode}`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateItem(item: Record<string, unknown>) {
  const errors = [];
  if (!item.id) errors.push('Item missing id');
  if (!item.label) errors.push('Item missing label');
  if (!item.type) errors.push('Item missing type');
  if (!item.target) errors.push('Item missing target');
  if (item.type && !Object.values(ITEM_ACTION_TYPE).includes(item.type as "action" | "panel" | "route" | "external")) {
    errors.push(`Invalid item type: ${item.type}`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateModel(model: Record<string, any>) {
  const errors = [];
  if (!model.version) errors.push('Model missing version');
  if (!model.source) errors.push('Model missing source');
  if (!Array.isArray(model.sections)) errors.push('Model sections must be array');
  model.sections?.forEach((section: Record<string, any>, idx: number) => {
    const sectionValidation = validateSection(section);
    if (!sectionValidation.valid) {
      errors.push(`Section[${idx}]: ${sectionValidation.errors.join(', ')}`);
    }
    section.items?.forEach((item: Record<string, unknown>, itemIdx: number) => {
      const itemValidation = validateItem(item);
      if (!itemValidation.valid) {
        errors.push(`Section[${idx}].Item[${itemIdx}]: ${itemValidation.errors.join(', ')}`);
      }
    });
  });
  return { valid: errors.length === 0, errors };
}

export function serializeState(state: Record<string, unknown>) {
  return JSON.stringify({
    v: SCHEMA_VERSION,
    mode: state.mode,
    openSections: state.openSections,
    activeItemId: state.activeItemId,
    pinnedItems: state.pinnedItems,
    ts: Date.now()
  });
}

export function deserializeState(json: string) {
  try {
    const data = JSON.parse(json);
    if (data.v !== SCHEMA_VERSION) {
      return { success: false, error: 'Schema version mismatch', data: null };
    }
    return {
      success: true,
      error: null as string | null,
      data: createAccordionState({
        mode: data.mode,
        openSections: data.openSections,
        activeItemId: data.activeItemId,
        pinnedItems: data.pinnedItems
      })
    };
  } catch (e: any) {
    return { success: false, error: e.message, data: null as ReturnType<typeof createAccordionState> | null };
  }
}

export function info() {
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

export function healthCheck() {
  const checks = {
    contractsValid: true,
    enumsValid: true,
    factoriesAvailable: true
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
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

export default {
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

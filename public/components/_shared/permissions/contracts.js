const VERSION = "1.0.0-P2-ENTERPRISE";
const MODULE_ID = "components._shared.permissions.contracts";
const ENTITY_TYPE = {
  TRIGGER: "trigger",
  REGION: "region"
};
const REGION_TYPE = {
  STRUCTURAL: "structural",
  CONTENT: "content",
  PANEL: "panel",
  MODAL: "modal",
  OVERLAY: "overlay"
};
const TRIGGER_CATEGORY = {
  NAVIGATION: "navigation",
  ACTION: "action",
  TOGGLE: "toggle",
  OPEN_PANEL: "open_panel",
  SYSTEM: "system",
  USER: "user",
  ADMIN: "admin"
};
const CRITICALITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical"
};
const PERMISSION_STATE = {
  ALLOWED: "allowed",
  DENIED: "denied",
  INHERITED: "inherited",
  UNDEFINED: "undefined"
};
const SCHEMAS = {
  ID_PATTERN: /^(trigger|region):([a-z0-9-]+):([a-z0-9-]+)$/,
  region: {
    required: ["id", "name", "type"],
    properties: {
      id: { type: "string", pattern: "^region:[a-z0-9-]+:[a-z0-9-]+$" },
      name: { type: "string", minLength: 1, maxLength: 100 },
      type: { type: "string", enum: Object.values(REGION_TYPE) },
      parent: { type: "string", nullable: true },
      description: { type: "string", maxLength: 500 },
      metadata: { type: "object" }
    }
  },
  trigger: {
    required: ["id", "name", "category"],
    properties: {
      id: { type: "string", pattern: "^trigger:[a-z0-9-]+:[a-z0-9-]+$" },
      name: { type: "string", minLength: 1, maxLength: 100 },
      category: { type: "string", enum: Object.values(TRIGGER_CATEGORY) },
      region: { type: "string", nullable: true },
      criticality: { type: "string", enum: Object.values(CRITICALITY) },
      description: { type: "string", maxLength: 500 },
      metadata: { type: "object" }
    }
  },
  permission: {
    required: ["userId", "entityId", "state"],
    properties: {
      userId: { type: "string" },
      entityId: { type: "string" },
      state: { type: "string", enum: Object.values(PERMISSION_STATE) },
      grantedAt: { type: "number" },
      grantedBy: { type: "string", nullable: true },
      expiresAt: { type: "number", nullable: true },
      reason: { type: "string", nullable: true }
    }
  }
};
function validateId(id) {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "ID must be a non-empty string" };
  }
  if (!SCHEMAS.ID_PATTERN.test(id)) {
    return { valid: false, error: `Invalid ID format. Expected: tipo:contexto:nome. Got: ${id}` };
  }
  return { valid: true, parsed: parseId(id) };
}
function parseId(id) {
  const match = id.match(SCHEMAS.ID_PATTERN);
  if (!match) return null;
  return { type: match[1], context: match[2], name: match[3], full: id };
}
function buildId(type, context, name) {
  const id = `${type}:${context}:${name}`;
  const validation = validateId(id);
  if (!validation.valid) throw new Error(validation.error);
  return id;
}
function isTriggerId(id) {
  return id?.startsWith("trigger:");
}
function isRegionId(id) {
  return id?.startsWith("region:");
}
function createRegion(config) {
  const { id, name, type, parent = null, description = "", metadata = {} } = config;
  const validation = validateId(id);
  if (!validation.valid) throw new Error(`Invalid region ID: ${validation.error}`);
  if (!isRegionId(id)) throw new Error(`ID must start with region:. Got: ${id}`);
  if (!Object.values(REGION_TYPE).includes(type)) throw new Error(`Invalid region type: ${type}`);
  return { id, name, type, parent, description, metadata, createdAt: Date.now() };
}
function createTrigger(config) {
  const { id, name, category, region = null, criticality = CRITICALITY.MEDIUM, description = "", metadata = {} } = config;
  const validation = validateId(id);
  if (!validation.valid) throw new Error(`Invalid trigger ID: ${validation.error}`);
  if (!isTriggerId(id)) throw new Error(`ID must start with trigger:. Got: ${id}`);
  if (!Object.values(TRIGGER_CATEGORY).includes(category)) throw new Error(`Invalid trigger category: ${category}`);
  return { id, name, category, region, criticality, description, metadata, createdAt: Date.now() };
}
function createPermission(config) {
  const { userId, entityId, state = PERMISSION_STATE.ALLOWED, grantedBy = null, expiresAt = null, reason = null } = config;
  if (!userId) throw new Error("userId is required");
  if (!entityId) throw new Error("entityId is required");
  const validation = validateId(entityId);
  if (!validation.valid) throw new Error(`Invalid entity ID: ${validation.error}`);
  return { userId, entityId, state, grantedAt: Date.now(), grantedBy, expiresAt, reason };
}
function getEntityType(id) {
  if (isTriggerId(id)) return ENTITY_TYPE.TRIGGER;
  if (isRegionId(id)) return ENTITY_TYPE.REGION;
  return null;
}
function getContext(id) {
  return parseId(id)?.context || null;
}
function getName(id) {
  return parseId(id)?.name || null;
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    schemas: Object.keys(SCHEMAS),
    entityTypes: Object.values(ENTITY_TYPE),
    regionTypes: Object.values(REGION_TYPE),
    triggerCategories: Object.values(TRIGGER_CATEGORY),
    timestamp: Date.now()
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
var contracts_default = {
  VERSION,
  MODULE_ID,
  ENTITY_TYPE,
  REGION_TYPE,
  TRIGGER_CATEGORY,
  CRITICALITY,
  PERMISSION_STATE,
  SCHEMAS,
  validateId,
  parseId,
  buildId,
  isTriggerId,
  isRegionId,
  createRegion,
  createTrigger,
  createPermission,
  getEntityType,
  getContext,
  getName,
  healthCheck,
  info
};
export {
  CRITICALITY,
  ENTITY_TYPE,
  MODULE_ID,
  PERMISSION_STATE,
  REGION_TYPE,
  SCHEMAS,
  TRIGGER_CATEGORY,
  VERSION,
  buildId,
  createPermission,
  createRegion,
  createTrigger,
  contracts_default as default,
  getContext,
  getEntityType,
  getName,
  healthCheck,
  info,
  isRegionId,
  isTriggerId,
  parseId,
  validateId
};

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.contracts
// PURPOSE: Technical contracts for triggers and regions validation
// ───────────────────────────────────────────────────────────────
// @contract ENTITY_TYPE - TRIGGER/REGION type constants
// @contract REGION_TYPE - STRUCTURAL/CONTENT/PANEL/MODAL/OVERLAY types
// @contract TRIGGER_CATEGORY - NAVIGATION/ACTION/TOGGLE/OPEN_PANEL/SYSTEM/USER/ADMIN categories
// @contract CRITICALITY - LOW/MEDIUM/HIGH/CRITICAL levels
// @contract PERMISSION_STATE - ALLOWED/DENIED/INHERITED/UNDEFINED states
// @contract SCHEMAS - Validation schemas for IDs, regions, triggers, permissions
// @contract VALIDATE_ID - validateId(id) validates ID format
// @contract PARSE_ID - parseId(id) parses ID into components
// @contract BUILD_ID - buildId(type, context, name) creates validated ID
// @contract CREATE_REGION - createRegion(config) factory function
// @contract CREATE_TRIGGER - createTrigger(config) factory function
// @contract CREATE_PERMISSION - createPermission(config) factory function
// @contract HEALTH - healthCheck() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: None
// PROVIDES: ENTITY_TYPE, REGION_TYPE, TRIGGER_CATEGORY, CRITICALITY, PERMISSION_STATE, SCHEMAS, validateId, parseId, buildId, isTriggerId, isRegionId, createRegion, createTrigger, createPermission, getEntityType, getContext, getName, healthCheck, VERSION, MODULE_ID
// @changelog v1.0.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE: Initial version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'components._shared.permissions.contracts';

export const ENTITY_TYPE = {
  TRIGGER: 'trigger',
  REGION: 'region'
};

export const REGION_TYPE = {
  STRUCTURAL: 'structural',
  CONTENT: 'content',
  PANEL: 'panel',
  MODAL: 'modal',
  OVERLAY: 'overlay'
};

export const TRIGGER_CATEGORY = {
  NAVIGATION: 'navigation',
  ACTION: 'action',
  TOGGLE: 'toggle',
  OPEN_PANEL: 'open_panel',
  SYSTEM: 'system',
  USER: 'user',
  ADMIN: 'admin'
};

export const CRITICALITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const PERMISSION_STATE = {
  ALLOWED: 'allowed',
  DENIED: 'denied',
  INHERITED: 'inherited',
  UNDEFINED: 'undefined'
};

export const SCHEMAS = {
  ID_PATTERN: /^(trigger|region):([a-z0-9-]+):([a-z0-9-]+)$/,

  region: {
    required: ['id', 'name', 'type'],
    properties: {
      id: { type: 'string', pattern: '^region:[a-z0-9-]+:[a-z0-9-]+$' },
      name: { type: 'string', minLength: 1, maxLength: 100 },
      type: { type: 'string', enum: Object.values(REGION_TYPE) },
      parent: { type: 'string', nullable: true },
      description: { type: 'string', maxLength: 500 },
      metadata: { type: 'object' }
    }
  },

  trigger: {
    required: ['id', 'name', 'category'],
    properties: {
      id: { type: 'string', pattern: '^trigger:[a-z0-9-]+:[a-z0-9-]+$' },
      name: { type: 'string', minLength: 1, maxLength: 100 },
      category: { type: 'string', enum: Object.values(TRIGGER_CATEGORY) },
      region: { type: 'string', nullable: true },
      criticality: { type: 'string', enum: Object.values(CRITICALITY) },
      description: { type: 'string', maxLength: 500 },
      metadata: { type: 'object' }
    }
  },

  permission: {
    required: ['userId', 'entityId', 'state'],
    properties: {
      userId: { type: 'string' },
      entityId: { type: 'string' },
      state: { type: 'string', enum: Object.values(PERMISSION_STATE) },
      grantedAt: { type: 'number' },
      grantedBy: { type: 'string', nullable: true },
      expiresAt: { type: 'number', nullable: true },
      reason: { type: 'string', nullable: true }
    }
  }
};

export function validateId(id: string) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID must be a non-empty string' };
  }
  if (!SCHEMAS.ID_PATTERN.test(id)) {
    return { valid: false, error: `Invalid ID format. Expected: tipo:contexto:nome. Got: ${id}` };
  }
  return { valid: true, parsed: parseId(id) };
}

export function parseId(id: string) {
  const match = id.match(SCHEMAS.ID_PATTERN);
  if (!match) return null;
  return { type: match[1], context: match[2], name: match[3], full: id };
}

export function buildId(type: string, context: string, name: string) {
  const id = `${type}:${context}:${name}`;
  const validation = validateId(id);
  if (!validation.valid) throw new Error(validation.error);
  return id;
}

export function isTriggerId(id: string) { return id?.startsWith('trigger:'); }
export function isRegionId(id: string) { return id?.startsWith('region:'); }

export function createRegion(config: Record<string, unknown>) {
  const { id, name, type, parent = null, description = '', metadata = {} } = config;
  const validation = validateId(id as string);
  if (!validation.valid) throw new Error(`Invalid region ID: ${validation.error}`);
  if (!isRegionId(id as string)) throw new Error(`ID must start with region:. Got: ${id}`);
  if (!Object.values(REGION_TYPE).includes(type as string)) throw new Error(`Invalid region type: ${type}`);
  return { id, name, type, parent, description, metadata, createdAt: Date.now() };
}

export function createTrigger(config: Record<string, unknown>) {
  const { id, name, category, region = null, criticality = CRITICALITY.MEDIUM, description = '', metadata = {} } = config;
  const validation = validateId(id as string);
  if (!validation.valid) throw new Error(`Invalid trigger ID: ${validation.error}`);
  if (!isTriggerId(id as string)) throw new Error(`ID must start with trigger:. Got: ${id}`);
  if (!Object.values(TRIGGER_CATEGORY).includes(category as string)) throw new Error(`Invalid trigger category: ${category}`);
  return { id, name, category, region, criticality, description, metadata, createdAt: Date.now() };
}

export function createPermission(config: Record<string, unknown>) {
  const { userId, entityId, state = PERMISSION_STATE.ALLOWED, grantedBy = null, expiresAt = null, reason = null } = config;
  if (!userId) throw new Error('userId is required');
  if (!entityId) throw new Error('entityId is required');
  const validation = validateId(entityId as string);
  if (!validation.valid) throw new Error(`Invalid entity ID: ${validation.error}`);
  return { userId, entityId, state, grantedAt: Date.now(), grantedBy, expiresAt, reason };
}

export function getEntityType(id: string) {
  if (isTriggerId(id)) return ENTITY_TYPE.TRIGGER;
  if (isRegionId(id)) return ENTITY_TYPE.REGION;
  return null;
}

export function getContext(id: string) { return parseId(id)?.context || null; }
export function getName(id: string) { return parseId(id)?.name || null; }

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    schemas: Object.keys(SCHEMAS),
    entityTypes: Object.values(ENTITY_TYPE),
    regionTypes: Object.values(REGION_TYPE),
    triggerCategories: Object.values(TRIGGER_CATEGORY),
    timestamp: Date.now()
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}

export default {
  VERSION, MODULE_ID,
  ENTITY_TYPE, REGION_TYPE, TRIGGER_CATEGORY, CRITICALITY, PERMISSION_STATE, SCHEMAS,
  validateId, parseId, buildId, isTriggerId, isRegionId,
  createRegion, createTrigger, createPermission,
  getEntityType, getContext, getName, healthCheck, info
};

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.builders.trigger-builders
// PURPOSE: Canonical trigger ID builders with contract enforcement
// ───────────────────────────────────────────────────────────────
// @contract BUILD_NAV_ITEM - buildNavigationItemTrigger(itemId) returns 3-segment trigger ID
// @contract BUILD_NAV_SECTION - buildNavigationSectionTrigger(sectionId) returns 3-segment trigger ID
// @contract BUILD_TRIGGER - buildTrigger(context, name) returns generic trigger ID
// @contract BUILD_REGION - buildRegion(context, name) returns region ID
// @contract VALIDATE - validateTrigger(id) validates against contract
// @contract LEGACY_CHECK - isLegacyFormat(id) detects 4-segment legacy format
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: validateId from ../contracts.js
// PROVIDES: buildNavigationItemTrigger, buildNavigationSectionTrigger, buildTrigger, buildRegion, validateTrigger, isLegacyFormat, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v1.0.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE-ES6: Initial version with ES6 pattern
// ═══════════════════════════════════════════════════════════════
'use strict';

import { validateId } from '../contracts.js';

export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'components._shared.permissions.builders.trigger-builders';

/**
 * Build a navigation item trigger ID (3-segment compliant)
 * @param {string} itemId - Item identifier (e.g., 'home', 'dashboard')
 * @returns {string} Valid trigger ID (e.g., 'trigger:navigation:item-home')
 * @throws {Error} If itemId is invalid or result fails contract validation
 */
export function buildNavigationItemTrigger(itemId: string) {
  if (!itemId || typeof itemId !== 'string') {
    throw new Error('[trigger-builders] itemId must be a non-empty string');
  }

  const cleanId = itemId
    .replace(/^trigger:navigation:item[-:]/, '')
    .replace(/^item[-:]/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');

  const triggerId = `trigger:navigation:item-${cleanId}`;

  const validation = validateId(triggerId);
  if (!validation.valid) {
    throw new Error(`[trigger-builders] Generated invalid trigger ID: ${triggerId} - ${validation.error}`);
  }

  return triggerId;
}

/**
 * Build a navigation section trigger ID (3-segment compliant)
 * @param {string} sectionId - Section identifier (e.g., 'principal', 'admin')
 * @returns {string} Valid trigger ID (e.g., 'trigger:navigation:section-principal')
 * @throws {Error} If sectionId is invalid or result fails contract validation
 */
export function buildNavigationSectionTrigger(sectionId: string) {
  if (!sectionId || typeof sectionId !== 'string') {
    throw new Error('[trigger-builders] sectionId must be a non-empty string');
  }

  const cleanId = sectionId
    .replace(/^trigger:navigation:section[-:]/, '')
    .replace(/^section[-:]/, '')
    .replace(/^sec-/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');

  const triggerId = `trigger:navigation:section-${cleanId}`;

  const validation = validateId(triggerId);
  if (!validation.valid) {
    throw new Error(`[trigger-builders] Generated invalid trigger ID: ${triggerId} - ${validation.error}`);
  }

  return triggerId;
}

/**
 * Build a generic trigger ID (3-segment compliant)
 * @param {string} context - Context (e.g., 'navigation', 'ui', 'system')
 * @param {string} name - Name with optional prefix (e.g., 'item-home', 'action-save')
 * @returns {string} Valid trigger ID
 * @throws {Error} If parameters are invalid or result fails contract validation
 */
export function buildTrigger(context: string, name: string) {
  if (!context || typeof context !== 'string') {
    throw new Error('[trigger-builders] context must be a non-empty string');
  }
  if (!name || typeof name !== 'string') {
    throw new Error('[trigger-builders] name must be a non-empty string');
  }

  const cleanContext = context.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const triggerId = `trigger:${cleanContext}:${cleanName}`;

  const validation = validateId(triggerId);
  if (!validation.valid) {
    throw new Error(`[trigger-builders] Generated invalid trigger ID: ${triggerId} - ${validation.error}`);
  }

  return triggerId;
}

/**
 * Build a region ID (3-segment compliant)
 * @param {string} context - Context (e.g., 'app', 'panel')
 * @param {string} name - Name (e.g., 'sidebar', 'header')
 * @returns {string} Valid region ID
 * @throws {Error} If parameters are invalid or result fails contract validation
 */
export function buildRegion(context: string, name: string) {
  if (!context || typeof context !== 'string') {
    throw new Error('[trigger-builders] context must be a non-empty string');
  }
  if (!name || typeof name !== 'string') {
    throw new Error('[trigger-builders] name must be a non-empty string');
  }

  const cleanContext = context.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const regionId = `region:${cleanContext}:${cleanName}`;

  const validation = validateId(regionId);
  if (!validation.valid) {
    throw new Error(`[trigger-builders] Generated invalid region ID: ${regionId} - ${validation.error}`);
  }

  return regionId;
}

/**
 * Validate an existing trigger ID against contract
 * @param {string} triggerId - Trigger ID to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTrigger(triggerId: string) {
  return validateId(triggerId);
}

/**
 * Check if a trigger ID uses the legacy 4-segment format
 * @param {string} triggerId - Trigger ID to check
 * @returns {boolean} True if legacy format detected
 */
export function isLegacyFormat(triggerId: string) {
  if (!triggerId || typeof triggerId !== 'string') return false;
  return /^trigger:[a-z0-9-]+:[a-z0-9-]+:[a-z0-9-]+$/.test(triggerId);
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    pattern: 'trigger:{context}:{name}',
    examples: {
      item: 'trigger:navigation:item-home',
      section: 'trigger:navigation:section-admin',
      region: 'region:app:sidebar'
    },
    enforcement: 'CONTRACT_VALIDATED',
    phase: 'P1 - Active Enforcement',
    capabilities: [
      'buildNavigationItemTrigger',
      'buildNavigationSectionTrigger',
      'buildTrigger',
      'buildRegion',
      'validateTrigger',
      'isLegacyFormat'
    ],
    timestamp: Date.now()
  };
}

export function healthCheck() {
  let testItem = null;
  let testSection = null;
  let testGeneric = null;
  let testRegion = null;

  try {
    testItem = buildNavigationItemTrigger('test');
    testSection = buildNavigationSectionTrigger('test');
    testGeneric = buildTrigger('ui', 'action-test');
    testRegion = buildRegion('app', 'test');
  } catch (e) {
    return {
      status: 'UNHEALTHY',
      moduleId: MODULE_ID,
      version: VERSION,
      error: (e as Error).message,
      timestamp: Date.now()
    };
  }

  const checks = {
    itemBuilderWorking: testItem === 'trigger:navigation:item-test',
    sectionBuilderWorking: testSection === 'trigger:navigation:section-test',
    genericBuilderWorking: testGeneric === 'trigger:ui:action-test',
    regionBuilderWorking: testRegion === 'region:app:test',
    legacyDetectorWorking: isLegacyFormat('trigger:navigation:item:home') === true,
    validFormatNotLegacy: isLegacyFormat('trigger:navigation:item-home') === false,
    contractEnforced: true
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}

export default {
  VERSION,
  MODULE_ID,
  buildNavigationItemTrigger,
  buildNavigationSectionTrigger,
  buildTrigger,
  buildRegion,
  validateTrigger,
  isLegacyFormat,
  info,
  healthCheck
};

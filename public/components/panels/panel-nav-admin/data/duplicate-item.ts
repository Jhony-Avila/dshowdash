// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE2)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.duplicate-item
// PURPOSE: Duplicate Item — Duplicar item de navegação com sufixo e novo ID
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   injectPorts(), getPorts()
//   prepareDuplicate() — exported function (prepara dados do item duplicado)
//   executeDuplicate() — exported function (executa via navAdapter)
//   duplicateItems() — exported function (bulk duplicate)
//   info(), healthCheck()
//
// @origin Adapted from panel-01/utils/duplicate.js for nav-admin items
// @changelog
//   10.1.0-MIGRATION-PHASE2: Initial creation — FASE 2 C.10
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE2';
export const MODULE_ID = 'panel-nav-admin.data.duplicate-item';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = '[DuplicateItem]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Fields excluded from duplication (reset to new values).
 * @private
 */
const EXCLUDED_FIELDS = new Set([
  'sourceId', 'dbId', 'createdAt', 'updatedAt'
]);

/**
 * Prepare a duplicate of a nav item.
 * Generates a new ID with "-copy" suffix, adds "(cópia)" to label,
 * resets timestamps and source references.
 *
 * @param {Object} item — Original item to duplicate
 * @param {Array<Object>} [existingItems=[]] — Current items (to avoid ID collision)
 * @returns {Object} New item data ready for createItem
 */
export function prepareDuplicate(item: Record<string, unknown>, existingItems: Record<string, unknown>[] = []) {
  if (!item) return null;

  const existingIds = new Set((existingItems || []).map((i: Record<string, unknown>) => i.id));

  // Generate unique ID
  let baseId = (item.id as string) + '-copy';
  let newId = baseId;
  let suffix = 1;
  while (existingIds.has(newId)) {
    newId = baseId + '-' + suffix;
    suffix++;
  }

  // Build duplicate
  const duplicate: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (EXCLUDED_FIELDS.has(key)) continue;
    duplicate[key] = value;
  }

  // Override specific fields
  duplicate.id = newId;
  duplicate.label = (item.label || '') + ' (cópia)';
  duplicate.order = ((item.order as number) || 0) + 1;
  duplicate.isActive = false; // Duplicates start inactive for safety
  duplicate.createdAt = null;
  duplicate.updatedAt = null;

  // Metadata
  duplicate._duplicatedFrom = item.id;
  duplicate._duplicatedAt = new Date().toISOString();

  _log('debug', 'Prepared duplicate:', item.id, '→', newId);
  return duplicate;
}

/**
 * Execute a single item duplication via navAdapter.
 *
 * @param {Object} item — Original item
 * @param {Object} navAdapter — Nav adapter module
 * @param {Array<Object>} [existingItems=[]]
 * @returns {Promise<{ success: boolean, duplicate?: Object, error?: string }>}
 */
export async function executeDuplicate(item: Record<string, unknown>, navAdapter: Record<string, (...args: unknown[]) => Promise<Record<string, unknown>>>, existingItems: Record<string, unknown>[] = []) {
  const duplicate = prepareDuplicate(item, existingItems);
  if (!duplicate) {
    return { success: false, error: 'Item inválido para duplicação' };
  }

  try {
    const result = await navAdapter.createItem(duplicate);
    if (result.success) {
      _log('info', 'Duplicated:', item.id, '→', duplicate!.id);
      return { success: true, duplicate };
    }
    return { success: false, error: result.error || 'Falha ao criar item duplicado' };
  } catch (error) {
    _log('error', 'Duplicate failed:', (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Duplicate multiple items in sequence.
 *
 * @param {Array<Object>} items — Items to duplicate
 * @param {Object} navAdapter — Nav adapter module
 * @param {Array<Object>} [existingItems=[]]
 * @param {Function} [onProgress] — Called with (completed, total)
 * @returns {Promise<{ success: number, failed: number, duplicates: Object[] }>}
 */
export async function duplicateItems(items: Record<string, unknown>[], navAdapter: Record<string, (...args: unknown[]) => Promise<Record<string, unknown>>>, existingItems: Record<string, unknown>[] = [], onProgress?: (completed: number, total: number) => void) {
  let success = 0;
  let failed = 0;
  const duplicates = [];
  const allExisting = [...(existingItems || [])];

  for (let i = 0; i < items.length; i++) {
    const result = await executeDuplicate(items[i], navAdapter, allExisting);
    if (result.success) {
      success++;
      duplicates.push(result.duplicate);
      // @ts-expect-error strict migration — TS2345
      allExisting.push(result.duplicate);
    } else {
      failed++;
    }
    if (onProgress) onProgress(i + 1, items.length);
  }

  return { success, failed, duplicates };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { prepareDuplicate, executeDuplicate, duplicateItems, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };


// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-SPRINT1)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-manager
// PURPOSE: Overlay Layer - Manager v2.1.0-SPRINT1
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Store from ../state/store.js
//   * as Registry from ./registry.js
//   validateOverlayDescriptor from ../utils/contracts.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   open() — exported function
//   close() — exported function
//   closeAll() — exported function
//   closeMany() — exported function
//   findMany() — exported function
//   countMany() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import Store from '../state/store.js';
import * as Registry from './registry.js';
import { validateOverlayDescriptor } from '../utils/contracts.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '2.1.0-SPRINT1';
export const MODULE_ID = 'overlay-layer-manager';

const _metrics = { openCount: 0, closeCount: 0, closeManyCount: 0, errors: 0 };

export function open(descriptor: DynObj) {
  const validation = validateOverlayDescriptor(descriptor);
  if (!validation.valid) { _metrics.errors++; return { ok: false, errors: validation.errors }; }
  const normalized = validation.normalized;
  const existing = Store.getOverlay(normalized!.id);
  if (existing) {
    Store.updateOverlayRuntime(normalized!.id, { visible: true, openedAt: Date.now(), closing: false });
    return { ok: true, id: normalized!.id, action: 'updated' };
  }
  Store.addOverlay(Object.assign({}, normalized, { runtime: { visible: true, openedAt: Date.now(), closing: false, createdAt: Date.now() } }));
  _metrics.openCount++;
  return { ok: true, id: normalized!.id, action: 'opened' };
}

export function close(id: DynObj, reason: DynObj) {
  reason = reason || 'explicit';
  const overlay = Store.getOverlay(id);
  if (!overlay) return { ok: false, reason: 'not-found' };
  Store.removeOverlay(id);
  _metrics.closeCount++;
  return { ok: true, id, reason, wasOpen: true };
}

export function closeAll(reason: DynObj) {
  reason = reason || 'closeAll';
  const stack = Store.getStack();
  const closed = [];
  for (let i = 0; i < stack.length; i++) { 
    const result = close(stack[i], reason);
    if (result.ok) closed.push(stack[i]);
  }
  return { ok: true, closed, count: closed.length };
}

/**
 * Fecha múltiplos overlays baseado em filtros
 * @param {Object} filter - Critérios de filtro
 * @param {string} filter.type - Filtrar por tipo
 * @param {string} filter.scope - Filtrar por scope
 * @param {number} filter.olderThan - Filtrar por idade em ms
 * @param {number} filter.newerThan - Filtrar overlays mais novos que X ms
 * @param {Object} filter.priority - Filtrar por prioridade { lt, gt, eq }
 * @param {Array} filter.ids - Lista específica de IDs
 * @param {Array} filter.types - Lista de tipos
 * @param {Array} filter.excludeIds - IDs a excluir
 * @param {Array} filter.excludeTypes - Tipos a excluir
 * @param {Function} filter.custom - Função customizada (overlay) => boolean
 * @param {string} reason - Razão do fechamento
 * @returns {Object} Resultado com lista de fechados e falhas
 */
export function closeMany(filter: DynObj, reason: DynObj) {
  reason = reason || 'closeMany';
  
  if (!filter || typeof filter !== 'object') {
    return { ok: false, error: 'filter-required', closed: [] as DynObj, failed: [] as DynObj, count: 0 };
  }
  
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  const toClose = [];
  const now = Date.now();
  
  // Filtrar overlays
  for (let i = 0; i < stack.length; i++) {
    const id = stack[i];
    const overlay = (overlays as DynObj)[id];
    if (!overlay) continue;
    
    let matches = true;
    
    // Filtro por IDs específicos
    if (filter.ids && Array.isArray(filter.ids)) {
      if (!filter.ids.includes(id)) matches = false;
    }
    
    // Excluir IDs
    if (matches && filter.excludeIds && Array.isArray(filter.excludeIds)) {
      if (filter.excludeIds.includes(id)) matches = false;
    }
    
    // Filtro por tipo
    if (matches && filter.type) {
      if (overlay.type !== filter.type) matches = false;
    }
    
    // Filtro por lista de tipos
    if (matches && filter.types && Array.isArray(filter.types)) {
      if (!filter.types.includes(overlay.type)) matches = false;
    }
    
    // Excluir tipos
    if (matches && filter.excludeTypes && Array.isArray(filter.excludeTypes)) {
      if (filter.excludeTypes.includes(overlay.type)) matches = false;
    }
    
    // Filtro por scope
    if (matches && filter.scope) {
      if (overlay.scope !== filter.scope) matches = false;
    }
    
    // Filtro por idade (olderThan)
    if (matches && typeof filter.olderThan === 'number') {
      const createdAt = overlay.runtime?.createdAt || overlay.runtime?.openedAt || overlay.createdAt;
      if (createdAt) {
        const age = now - createdAt;
        if (age < filter.olderThan) matches = false;
      } else {
        matches = false; // Sem data de criação, não podemos determinar idade
      }
    }
    
    // Filtro por idade (newerThan)
    if (matches && typeof filter.newerThan === 'number') {
      const createdAt2 = overlay.runtime?.createdAt || overlay.runtime?.openedAt || overlay.createdAt;
      if (createdAt2) {
        const age2 = now - createdAt2;
        if (age2 > filter.newerThan) matches = false;
      }
    }
    
    // Filtro por prioridade
    if (matches && filter.priority && typeof filter.priority === 'object') {
      const overlayPriority = overlay.config?.priority || 50;
      if (filter.priority.lt !== undefined && overlayPriority >= filter.priority.lt) matches = false;
      if (filter.priority.gt !== undefined && overlayPriority <= filter.priority.gt) matches = false;
      if (filter.priority.eq !== undefined && overlayPriority !== filter.priority.eq) matches = false;
      if (filter.priority.lte !== undefined && overlayPriority > filter.priority.lte) matches = false;
      if (filter.priority.gte !== undefined && overlayPriority < filter.priority.gte) matches = false;
    }
    
    // Filtro por blocking
    if (matches && filter.blocking !== undefined) {
      const isBlocking = overlay.config?.blocking || overlay.type === 'modal';
      if (filter.blocking !== isBlocking) matches = false;
    }
    
    // Filtro customizado
    if (matches && typeof filter.custom === 'function') {
      try {
        if (!filter.custom(overlay)) matches = false;
      } catch (e: any) {
        matches = false;
      }
    }
    
    if (matches) {
      toClose.push(id);
    }
  }
  
  // Fechar overlays filtrados
  const closed = [];
  const failed = [];
  
  for (let j = 0; j < toClose.length; j++) {
    const closeId = toClose[j];
    try {
      const result = close(closeId, reason);
      if (result.ok) {
        closed.push(closeId);
      } else {
        failed.push({ id: closeId, reason: result.reason || 'unknown' });
      }
    } catch (e: any) {
      failed.push({ id: closeId, reason: e.message });
    }
  }
  
  _metrics.closeManyCount++;
  
  return {
    ok: true,
    closed,
    failed,
    count: closed.length,
    filtered: toClose.length,
    reason
  };
}

/**
 * Retorna overlays que correspondem ao filtro (sem fechar)
 */
export function findMany(filter: DynObj) {
  if (!filter || typeof filter !== 'object') {
    return [];
  }
  
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  const result = [];
  const now = Date.now();
  
  for (let i = 0; i < stack.length; i++) {
    const id = stack[i];
    const overlay = (overlays as DynObj)[id];
    if (!overlay) continue;
    
    let matches = true;
    
    if (filter.ids && Array.isArray(filter.ids)) {
      if (!filter.ids.includes(id)) matches = false;
    }
    if (matches && filter.excludeIds && Array.isArray(filter.excludeIds)) {
      if (filter.excludeIds.includes(id)) matches = false;
    }
    if (matches && filter.type) {
      if (overlay.type !== filter.type) matches = false;
    }
    if (matches && filter.types && Array.isArray(filter.types)) {
      if (!filter.types.includes(overlay.type)) matches = false;
    }
    if (matches && filter.excludeTypes && Array.isArray(filter.excludeTypes)) {
      if (filter.excludeTypes.includes(overlay.type)) matches = false;
    }
    if (matches && filter.scope) {
      if (overlay.scope !== filter.scope) matches = false;
    }
    if (matches && typeof filter.olderThan === 'number') {
      const createdAt = overlay.runtime?.createdAt || overlay.runtime?.openedAt || overlay.createdAt;
      if (createdAt) {
        if ((now - createdAt) < filter.olderThan) matches = false;
      } else {
        matches = false;
      }
    }
    if (matches && filter.priority && typeof filter.priority === 'object') {
      const overlayPriority = overlay.config?.priority || 50;
      if (filter.priority.lt !== undefined && overlayPriority >= filter.priority.lt) matches = false;
      if (filter.priority.gt !== undefined && overlayPriority <= filter.priority.gt) matches = false;
      if (filter.priority.eq !== undefined && overlayPriority !== filter.priority.eq) matches = false;
    }
    if (matches && filter.blocking !== undefined) {
      const isBlocking = overlay.config?.blocking || overlay.type === 'modal';
      if (filter.blocking !== isBlocking) matches = false;
    }
    if (matches && typeof filter.custom === 'function') {
      try {
        if (!filter.custom(overlay)) matches = false;
      } catch (e: any) {
        matches = false;
      }
    }
    
    if (matches) {
      result.push(overlay);
    }
  }
  
  return result;
}

/**
 * Conta overlays que correspondem ao filtro
 */
export function countMany(filter: DynObj) {
  return findMany(filter).length;
}

export function getMetrics() { return Object.assign({}, _metrics); }

export function healthCheck() {
  const checks = { 
    storeAvailable: !!Store, 
    lowErrorRate: _metrics.openCount === 0 || (_metrics.errors / _metrics.openCount) < 0.1 
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; }
  const total = checkKeys.length;
  return { 
    status: passed === total ? 'HEALTHY' : 'DEGRADED', 
    score: `${passed}/${total}`, 
    checks, 
    metrics: getMetrics(), 
    version: VERSION, 
    moduleId: MODULE_ID, 
    timestamp: Date.now() 
  };
}

export function info() { 
  return { 
    moduleId: MODULE_ID, 
    version: VERSION, 
    metrics: getMetrics(), 
    currentStack: Store.getStack(), 
    timestamp: Date.now() 
  }; 
}

export default { 
  open, 
  close, 
  closeAll, 
  closeMany,
  findMany,
  countMany,
  getMetrics, 
  healthCheck, 
  info, 
  VERSION, 
  MODULE_ID 
};

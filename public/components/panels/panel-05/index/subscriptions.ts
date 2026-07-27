// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:index:subscriptions
// PURPOSE: Panel-05 Index - Store Subscriptions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   store from ../state/store.js
//   updateKPIs from ../renderer/kpis.js
//   updateTable, updatePagination, updateSort from ../renderer/table.js
//   updateLoading, updateError, hideStatus from ../renderer/status.js
//   updateFilters from ../renderer/filters.js
//   _refs, _favoritos, addUnsubscribe from ./state.js
//
// PROVIDES:
//   setupSubscriptions() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { store } from '../state/store.js';
import { updateKPIs } from '../renderer/kpis.js';
import { updateTable, updatePagination, updateSort } from '../renderer/table.js';
import { updateLoading, updateError, hideStatus } from '../renderer/status.js';
import { updateFilters } from '../renderer/filters.js';
import { _refs, _favoritos, addUnsubscribe } from './state.js';

export function setupSubscriptions(showCliente360: (data: unknown) => void, hideCliente360: () => void) {
  addUnsubscribe(store.subscribe('kpis', (kpis: unknown) => { updateKPIs(_refs, kpis as Record<string, unknown> | null); hideStatus(_refs); }));
  addUnsubscribe(store.subscribe('clientes', (clientes: unknown) => { updateTable(_refs, clientes, _favoritos); hideStatus(_refs); }));
  addUnsubscribe(store.subscribe('pagination', (pagination: unknown) => { updatePagination(_refs, pagination); }));
  addUnsubscribe(store.subscribe('sort', (sort: unknown) => { updateSort(_refs, sort as Record<string, unknown> | null); }));
  addUnsubscribe(store.subscribe('loading', (loading: unknown) => { updateLoading(_refs, loading as boolean); }));
  addUnsubscribe(store.subscribe('error', (error: unknown) => { updateError(_refs, error); }));
  addUnsubscribe(store.subscribe('filters', (filters: unknown) => { updateFilters(_refs, filters as Record<string, unknown>); }));
  addUnsubscribe(store.subscribe('cliente360', (cliente360: unknown) => { if (cliente360) showCliente360(cliente360); else hideCliente360(); }));
}

export default { setupSubscriptions };

export const MODULE_ID = 'panel-05:index:subscriptions';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { subscriptionsReady: true } }; }

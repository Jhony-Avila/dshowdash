// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:handlers:subscriptions
// PURPOSE: Panel-05 - Store Subscriptions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   store from ../state/store.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setup() — exported function
//   clear() — exported function
//   add() — exported function
//   count() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
import * as Cliente360View from '../managers/cliente360-view.js';
import { updateTable, updatePagination, updateSort } from '../renderer/table.js';
import { updateLoading, updateError, hideStatus } from '../renderer/status.js';
import { updateFilters } from '../renderer/filters.js';
import * as Favoritos from '../managers/favoritos.js';

export const VERSION = '9.3.1-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:handlers:subscriptions';

let _unsubscribes: Array<() => void> = [];

export const setup = (ctx: Record<string, unknown>) => {
  // 2026-09-16 (rodada frontend 05/16): estas seis assinaturas só existiam em index/subscriptions.ts, módulo ÓRFÃO
  // (ninguém importa) — no caminho vivo a tabela nunca era preenchida e loading/erro/filtros nunca chegavam ao DOM.
  _unsubscribes.push(store.subscribe('clientes', (clientes: unknown) => { updateTable(ctx.refs as Record<string, unknown> | null, clientes, Favoritos.getAll()); hideStatus(ctx.refs as Record<string, unknown> | null); }));
  _unsubscribes.push(store.subscribe('pagination', (pagination: unknown) => { updatePagination(ctx.refs, pagination); }));
  _unsubscribes.push(store.subscribe('sort', (sort: unknown) => { updateSort(ctx.refs, sort as Record<string, unknown> | null); }));
  _unsubscribes.push(store.subscribe('loading', (loading: unknown) => { updateLoading(ctx.refs as Record<string, unknown> | null, !!loading); }));
  _unsubscribes.push(store.subscribe('error', (error: unknown) => { updateError(ctx.refs as Record<string, unknown> | null, error); }));
  _unsubscribes.push(store.subscribe('filters', (filters: unknown) => { updateFilters(ctx.refs as Record<string, unknown> | null, filters as Record<string, unknown>); }));
  _unsubscribes.push(store.subscribe('cliente360', (data: unknown) => { if (data) Cliente360View.show(ctx.refs, data, ctx.moduleId, ctx.version); else Cliente360View.hide(ctx.refs, ctx.moduleId, ctx.version); }));
  _unsubscribes.push(store.subscribe('kpis', (data: unknown) => { if (data && ctx.renderKPIs) (ctx.renderKPIs as (d: unknown) => void)(data); }));
  _unsubscribes.push(store.subscribe('charts', (data: unknown) => { if (data && (ctx.refs as Record<string, unknown>)?.chartsArea && ((ctx.refs as Record<string, unknown>).chartsArea as HTMLElement)?.style.display !== 'none' && ctx.renderCharts) (ctx.renderCharts as (d: unknown) => void)(data); }));
  _unsubscribes.push(store.subscribe('insights', (data: unknown) => { if (data && ctx.renderInsights) (ctx.renderInsights as (d: unknown) => void)(data); }));
  _unsubscribes.push(store.subscribe('comparativo', (data: unknown) => { if (data && ctx.renderComparativo) (ctx.renderComparativo as (d: unknown) => void)(data); }));
  _unsubscribes.push(store.subscribe('funil', (data: unknown) => { if (data && ctx.renderFunil) (ctx.renderFunil as (d: unknown) => void)(data); }));
  _unsubscribes.push(store.subscribe('churn', (data: unknown) => { if (data && ctx.renderChurn) (ctx.renderChurn as (d: unknown) => void)(data); }));
};

export const clear = () => { _unsubscribes.forEach(fn => { if (fn) fn(); }); _unsubscribes = []; };
export const add = (unsubFn: () => void) => { _unsubscribes.push(unsubFn); };
export const count = () => _unsubscribes.length;

export const healthCheck = () => { const checks = { storeAvailable: !!store, cliente360ViewAvailable: !!Cliente360View, subscriptionsArray: Array.isArray(_unsubscribes) }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, subscriptionsCount: _unsubscribes.length, timestamp: Date.now() }; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, subscriptions: _unsubscribes.length });

export default { setup, clear, add, count, healthCheck, info, VERSION, MODULE_ID };

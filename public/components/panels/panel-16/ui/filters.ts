// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-16-ui-filters
// PURPOSE: Panel-16 UI Filters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   COLUMN_TYPES from ./constants.js
//
// PROVIDES:
//   getActiveFiltersCount() — exported function
//   getActiveFilters() — exported function
//   applyClientFilters() — exported function
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

import { COLUMN_TYPES } from './constants.js';


// @ts-expect-error TS migration - TS2339
export function getActiveFiltersCount(filters) { return Object.entries(filters).filter(([k, v]) => v && v.length > 0 && k !== 'search').length; }

export function getActiveFilters(filters: Record<string, unknown>, clientSearchTerm: string) { const active = []; if (filters.status) active.push({ key: 'status', label: 'Status', value: filters.status }); if (filters.tipo) active.push({ key: 'tipo', label: 'Tipo', value: filters.tipo }); if (filters.uf) active.push({ key: 'uf', label: 'UF', value: filters.uf }); if (filters.risco) active.push({ key: 'risco', label: 'Risco', value: filters.risco }); if (filters.temPix) active.push({ key: 'temPix', label: 'PIX', value: filters.temPix === '1' ? 'Sim' : 'Não' }); if (filters.valorMin) active.push({ key: 'valorMin', label: 'Valor ≥', value: `R$ ${filters.valorMin}` }); if (filters.valorMax) active.push({ key: 'valorMax', label: 'Valor ≤', value: `R$ ${filters.valorMax}` }); if (clientSearchTerm) active.push({ key: 'clientSearch', label: 'Busca local', value: clientSearchTerm }); return active; }


// @ts-expect-error TS migration - TS2339
export function applyClientFilters(data, clientSearchTerm, filters) { if (!data || data.length === 0) return data; let filtered = [...data]; if (clientSearchTerm && clientSearchTerm.length >= 2) { const term = clientSearchTerm.toLowerCase().trim(); const searchableCols = Object.entries(COLUMN_TYPES).filter(([k, v]) => v.searchable).map(([k]) => k); filtered = filtered.filter(item => searchableCols.some(col => { const val = item[col] || item[col === 'cnpj' ? 'cpf' : col]; return val && String(val).toLowerCase().includes(term); })); } if (filters.valorMinClient) { const min = parseFloat(filters.valorMinClient); if (!isNaN(min)) filtered = filtered.filter(item => (parseFloat(item.total_pago) || 0) >= min); } if (filters.valorMaxClient) { const max = parseFloat(filters.valorMaxClient); if (!isNaN(max)) filtered = filtered.filter(item => (parseFloat(item.total_pago) || 0) <= max); } if (filters.reqMinClient) { const min = parseInt(filters.reqMinClient); if (!isNaN(min)) filtered = filtered.filter(item => (parseInt(item.qtd_requisicoes) || 0) >= min); } if (filters.reqMaxClient) { const max = parseInt(filters.reqMaxClient); if (!isNaN(max)) filtered = filtered.filter(item => (parseInt(item.qtd_requisicoes) || 0) <= max); } return filtered; }

export default { getActiveFiltersCount, getActiveFilters, applyClientFilters };

export const MODULE_ID = 'panels-panel-16-ui-filters';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: true } }; }

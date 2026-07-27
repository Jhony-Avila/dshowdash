// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.table-engine.mixins.filters.engine
// PURPOSE: Table Engine - Filters Engine
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   getOperatorsForType() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   cleanup() — exported function
//   registerOperator() — exported function
//   setFilter() — exported function
//   removeFilter() — exported function
//   clearFilters() — exported function
//   getFilters() — exported function
//   applyFilters() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.table-engine.mixins.filters.engine';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; filters: Record<string, { operator: string; value: unknown }>; operators: Record<string, (a: unknown, b: unknown) => boolean> } = { initialized: false, filters: {}, operators: {} };
const _metrics = { applied: 0, cleared: 0 };

const DEFAULT_OPERATORS: Record<string, (a: unknown, b: unknown) => boolean> = {
  equals(a: unknown, b: unknown) { return a === b; },
  notEquals(a: unknown, b: unknown) { return a !== b; },
  contains(a: unknown, b: unknown) { return String(a).toLowerCase().indexOf(String(b).toLowerCase()) >= 0; },
  startsWith(a: unknown, b: unknown) { return String(a).toLowerCase().indexOf(String(b).toLowerCase()) === 0; },
  endsWith(a: unknown, b: unknown) { const s = String(a).toLowerCase(); const e = String(b).toLowerCase(); return s.indexOf(e) === s.length - e.length; },
  greaterThan(a: unknown, b: unknown) { return Number(a) > Number(b); },
  lessThan(a: unknown, b: unknown) { return Number(a) < Number(b); },
  between(a: unknown, b: unknown) { return Number(a) >= (b as number[])[0] && Number(a) <= (b as number[])[1]; },
  inList(a: unknown, b: unknown) { return (b as unknown[]).indexOf(a) >= 0; }
};

// Operators by type with icons for filter-row.js
const OPERATORS_BY_TYPE = {
  text: [
    { id: 'contains', label: 'Contém', icon: '⊃' },
    { id: 'equals', label: 'Igual', icon: '=' },
    { id: 'notEquals', label: 'Diferente', icon: '≠' },
    { id: 'startsWith', label: 'Começa com', icon: 'A…' },
    { id: 'endsWith', label: 'Termina com', icon: '…Z' }
  ],
  number: [
    { id: 'equals', label: 'Igual', icon: '=' },
    { id: 'notEquals', label: 'Diferente', icon: '≠' },
    { id: 'greaterThan', label: 'Maior que', icon: '>' },
    { id: 'lessThan', label: 'Menor que', icon: '<' },
    { id: 'between', label: 'Entre', icon: '↔' }
  ],
  currency: [
    { id: 'equals', label: 'Igual', icon: '=' },
    { id: 'greaterThan', label: 'Maior que', icon: '>' },
    { id: 'lessThan', label: 'Menor que', icon: '<' },
    { id: 'between', label: 'Entre', icon: '↔' }
  ],
  date: [
    { id: 'equals', label: 'Igual', icon: '=' },
    { id: 'greaterThan', label: 'Após', icon: '>' },
    { id: 'lessThan', label: 'Antes', icon: '<' },
    { id: 'between', label: 'Entre', icon: '↔' }
  ],
  datetime: [
    { id: 'equals', label: 'Igual', icon: '=' },
    { id: 'greaterThan', label: 'Após', icon: '>' },
    { id: 'lessThan', label: 'Antes', icon: '<' },
    { id: 'between', label: 'Entre', icon: '↔' }
  ],
  select: [
    { id: 'equals', label: 'Igual', icon: '=' },
    { id: 'notEquals', label: 'Diferente', icon: '≠' },
    { id: 'inList', label: 'Em lista', icon: '∈' }
  ],
  status: [
    { id: 'equals', label: 'Igual', icon: '=' },
    { id: 'notEquals', label: 'Diferente', icon: '≠' }
  ],
  boolean: [
    { id: 'equals', label: 'Igual', icon: '=' }
  ],
  bool: [
    { id: 'equals', label: 'Igual', icon: '=' }
  ],
  enum: [
    { id: 'equals', label: 'Igual', icon: '=' },
    { id: 'notEquals', label: 'Diferente', icon: '≠' },
    { id: 'inList', label: 'Em lista', icon: '∈' }
  ]
};

// Default operators for unknown types
const DEFAULT_TYPE_OPERATORS = [
  { id: 'contains', label: 'Contém', icon: '⊃' },
  { id: 'equals', label: 'Igual', icon: '=' },
  { id: 'notEquals', label: 'Diferente', icon: '≠' }
];

// Get operators for a specific column type
export function getOperatorsForType(type: string | undefined) {
  if (!type) return DEFAULT_TYPE_OPERATORS;
  const normalizedType = String(type).toLowerCase();
  return (OPERATORS_BY_TYPE as Record<string, typeof DEFAULT_TYPE_OPERATORS>)[normalizedType] || DEFAULT_TYPE_OPERATORS;
}

function registerOperator(name: string, fn: (a: unknown, b: unknown) => boolean) { _state.operators[name] = fn; return { ok: true }; }

function setFilter(column: string, operator: string, value: unknown) { _state.filters[column] = { operator, value }; return { ok: true }; }
function removeFilter(column: string) { if (_state.filters[column]) { delete _state.filters[column]; return { ok: true }; } return { ok: false }; }
function clearFilters() { _metrics.cleared++; _state.filters = {}; return { ok: true }; }
function getFilters() { return Object.assign({}, _state.filters); }

function applyFilters(data: Record<string, unknown>[]) { _metrics.applied++; if (Object.keys(_state.filters).length === 0) return data; return data.filter(row => { for (const column in _state.filters) { const filter = _state.filters[column]; const op = _state.operators[filter.operator] || DEFAULT_OPERATORS[filter.operator]; if (op && !op(row[column], filter.value)) return false; } return true; }); }

function init(ctx: { ports?: Record<string, unknown> } | null) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); Object.assign(_state.operators, DEFAULT_OPERATORS); _state.initialized = true; return { ok: true, version: VERSION }; }
function cleanup() { _state.filters = {}; _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, activeFilters: Object.keys(_state.filters).length, operatorsCount: Object.keys(_state.operators).length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, cleanup, registerOperator, setFilter, removeFilter, clearFilters, getFilters, applyFilters, healthCheck, info };
export default { MODULE_ID, VERSION, init, cleanup, registerOperator, setFilter, removeFilter, clearFilters, getFilters, applyFilters, getOperatorsForType, healthCheck, info, injectPorts, getPorts };

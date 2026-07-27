import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.table-engine.mixins.filters.engine";
const VERSION = "2.2.0-P18EC";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _state = { initialized: false, filters: {}, operators: {} };
const _metrics = { applied: 0, cleared: 0 };
const DEFAULT_OPERATORS = {
  equals(a, b) {
    return a === b;
  },
  notEquals(a, b) {
    return a !== b;
  },
  contains(a, b) {
    return String(a).toLowerCase().indexOf(String(b).toLowerCase()) >= 0;
  },
  startsWith(a, b) {
    return String(a).toLowerCase().indexOf(String(b).toLowerCase()) === 0;
  },
  endsWith(a, b) {
    const s = String(a).toLowerCase();
    const e = String(b).toLowerCase();
    return s.indexOf(e) === s.length - e.length;
  },
  greaterThan(a, b) {
    return Number(a) > Number(b);
  },
  lessThan(a, b) {
    return Number(a) < Number(b);
  },
  between(a, b) {
    return Number(a) >= b[0] && Number(a) <= b[1];
  },
  inList(a, b) {
    return b.indexOf(a) >= 0;
  }
};
const OPERATORS_BY_TYPE = {
  text: [
    { id: "contains", label: "Cont\xE9m", icon: "\u2283" },
    { id: "equals", label: "Igual", icon: "=" },
    { id: "notEquals", label: "Diferente", icon: "\u2260" },
    { id: "startsWith", label: "Come\xE7a com", icon: "A\u2026" },
    { id: "endsWith", label: "Termina com", icon: "\u2026Z" }
  ],
  number: [
    { id: "equals", label: "Igual", icon: "=" },
    { id: "notEquals", label: "Diferente", icon: "\u2260" },
    { id: "greaterThan", label: "Maior que", icon: ">" },
    { id: "lessThan", label: "Menor que", icon: "<" },
    { id: "between", label: "Entre", icon: "\u2194" }
  ],
  currency: [
    { id: "equals", label: "Igual", icon: "=" },
    { id: "greaterThan", label: "Maior que", icon: ">" },
    { id: "lessThan", label: "Menor que", icon: "<" },
    { id: "between", label: "Entre", icon: "\u2194" }
  ],
  date: [
    { id: "equals", label: "Igual", icon: "=" },
    { id: "greaterThan", label: "Ap\xF3s", icon: ">" },
    { id: "lessThan", label: "Antes", icon: "<" },
    { id: "between", label: "Entre", icon: "\u2194" }
  ],
  datetime: [
    { id: "equals", label: "Igual", icon: "=" },
    { id: "greaterThan", label: "Ap\xF3s", icon: ">" },
    { id: "lessThan", label: "Antes", icon: "<" },
    { id: "between", label: "Entre", icon: "\u2194" }
  ],
  select: [
    { id: "equals", label: "Igual", icon: "=" },
    { id: "notEquals", label: "Diferente", icon: "\u2260" },
    { id: "inList", label: "Em lista", icon: "\u2208" }
  ],
  status: [
    { id: "equals", label: "Igual", icon: "=" },
    { id: "notEquals", label: "Diferente", icon: "\u2260" }
  ],
  boolean: [
    { id: "equals", label: "Igual", icon: "=" }
  ],
  bool: [
    { id: "equals", label: "Igual", icon: "=" }
  ],
  enum: [
    { id: "equals", label: "Igual", icon: "=" },
    { id: "notEquals", label: "Diferente", icon: "\u2260" },
    { id: "inList", label: "Em lista", icon: "\u2208" }
  ]
};
const DEFAULT_TYPE_OPERATORS = [
  { id: "contains", label: "Cont\xE9m", icon: "\u2283" },
  { id: "equals", label: "Igual", icon: "=" },
  { id: "notEquals", label: "Diferente", icon: "\u2260" }
];
function getOperatorsForType(type) {
  if (!type) return DEFAULT_TYPE_OPERATORS;
  const normalizedType = String(type).toLowerCase();
  return OPERATORS_BY_TYPE[normalizedType] || DEFAULT_TYPE_OPERATORS;
}
function registerOperator(name, fn) {
  _state.operators[name] = fn;
  return { ok: true };
}
function setFilter(column, operator, value) {
  _state.filters[column] = { operator, value };
  return { ok: true };
}
function removeFilter(column) {
  if (_state.filters[column]) {
    delete _state.filters[column];
    return { ok: true };
  }
  return { ok: false };
}
function clearFilters() {
  _metrics.cleared++;
  _state.filters = {};
  return { ok: true };
}
function getFilters() {
  return Object.assign({}, _state.filters);
}
function applyFilters(data) {
  _metrics.applied++;
  if (Object.keys(_state.filters).length === 0) return data;
  return data.filter((row) => {
    for (const column in _state.filters) {
      const filter = _state.filters[column];
      const op = _state.operators[filter.operator] || DEFAULT_OPERATORS[filter.operator];
      if (op && !op(row[column], filter.value)) return false;
    }
    return true;
  });
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  Object.assign(_state.operators, DEFAULT_OPERATORS);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.filters = {};
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, activeFilters: Object.keys(_state.filters).length, operatorsCount: Object.keys(_state.operators).length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var engine_default = { MODULE_ID, VERSION, init, cleanup, registerOperator, setFilter, removeFilter, clearFilters, getFilters, applyFilters, getOperatorsForType, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  applyFilters,
  cleanup,
  clearFilters,
  engine_default as default,
  getFilters,
  getOperatorsForType,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  registerOperator,
  removeFilter,
  setFilter
};

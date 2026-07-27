

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE3)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.highlighting
// PURPOSE: Highlighting Rules — Regras de destaque condicional para linhas de itens
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID, injectPorts, getPorts
//   OPERATORS — comparison operators enum
//   COLORS — available highlight colors
//   HighlightingRulesManager — exported class
//   createHighlightingRulesManager() — factory
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/table/highlighting-rules.js for nav-admin
// @changelog
//   10.1.0-MIGRATION-PHASE3: Initial creation — FASE 3 B.7
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE3';
export const MODULE_ID = 'panel-nav-admin.ui.highlighting';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

/**
 * Comparison operators for highlighting rules.
 * @readonly
 * @enum {string}
 */
export const OPERATORS = Object.freeze({
  EQUALS:       'equals',
  NOT_EQUALS:   'not_equals',
  GREATER:      'greater',
  LESS:         'less',
  CONTAINS:     'contains',
  IS_EMPTY:     'is_empty',
  IS_NOT_EMPTY: 'is_not_empty'
});

/**
 * Available highlight colors with display properties.
 * @readonly
 */
export const COLORS = Object.freeze([
  { id: 'red',    label: 'Vermelho', bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  { id: 'green',  label: 'Verde',    bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
  { id: 'blue',   label: 'Azul',     bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' },
  { id: 'yellow', label: 'Amarelo',  bg: '#fefce8', border: '#fef08a', text: '#ca8a04' },
  { id: 'purple', label: 'Roxo',     bg: '#faf5ff', border: '#e9d5ff', text: '#9333ea' },
  { id: 'orange', label: 'Laranja',  bg: '#fff7ed', border: '#fed7aa', text: '#ea580c' }
]);

/** @private Default fields available for nav-admin highlighting */
const NAV_ADMIN_FIELDS = [
  { id: 'section',      label: 'Contexto (seção)' },
  { id: 'itemType',     label: 'Tipo do item' },
  { id: 'minLevel',     label: 'Nível mínimo' },
  { id: 'isActive',     label: 'Ativo' },
  { id: 'isVisible',    label: 'Visível' },
  { id: 'uarpsTrigger', label: 'UARPS Trigger' },
  { id: 'href',         label: 'Rota' },
  { id: 'icon',         label: 'Ícone' },
  { id: 'order',        label: 'Ordem' }
];

const STORAGE_KEY = 'pna_highlighting_rules';

/**
 * HighlightingRulesManager — Regras de destaque condicional para linhas.
 */
export class HighlightingRulesManager {
  [key: string]: any;
  /**
   * @param {Object} [options]
   * @param {Array} [options.fields] — Available fields for rules
   * @param {Function} [options.onRulesChange] — (rules[]) => void
   * @param {string} [options.storageKey] — localStorage key
   */
  constructor(options: Record<string, unknown> = {}) {
    this.fields = options.fields || NAV_ADMIN_FIELDS;
    this.onRulesChange = options.onRulesChange || (() => {});
    this._storageKey = options.storageKey || STORAGE_KEY;
    this._rules = [];
    this._loadRules();
  }

  /** @private Load rules from localStorage */
  _loadRules() {
    try {
      const saved = localStorage.getItem(this._storageKey);
      if (saved) this._rules = JSON.parse(saved);
    } catch (e) {
      this._rules = [];
    }
  }

  /** @private Persist rules to localStorage */
  _saveRules() {
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(this._rules));
    } catch (e) { /* ignore */ }
    this.onRulesChange(this._rules);
  }

  /**
   * Update available fields.
   * @param {Array} fields — { id, label } objects
   */
  setFields(fields: { id: string; label: string }[]) {
    this.fields = fields || NAV_ADMIN_FIELDS;
  }

  /**
   * Add a new highlighting rule.
   * @param {Object} rule — { field, operator, value, color }
   * @returns {Object} The created rule (with generated id)
   */
  addRule(rule: Record<string, unknown>) {
    const newRule = {
      id: 'rule_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      field: rule.field,
      operator: rule.operator,
      value: rule.value,
      color: rule.color,
      enabled: true
    };
    this._rules.push(newRule);
    this._saveRules();
    return newRule;
  }

  /**
   * Update an existing rule.
   * @param {string} ruleId
   * @param {Object} updates — Partial rule fields
   * @returns {Object|null} Updated rule or null if not found
   */
  updateRule(ruleId: string, updates: Record<string, unknown>) {
    const rule = this._rules.find((r: Record<string, unknown>) => r.id === ruleId);
    if (!rule) return null;
    if (updates.field !== undefined) rule.field = updates.field;
    if (updates.operator !== undefined) rule.operator = updates.operator;
    if (updates.value !== undefined) rule.value = updates.value;
    if (updates.color !== undefined) rule.color = updates.color;
    if (updates.enabled !== undefined) rule.enabled = updates.enabled;
    this._saveRules();
    return rule;
  }

  /**
   * Toggle a rule's enabled state.
   * @param {string} ruleId
   * @returns {boolean} New enabled state
   */
  toggleRule(ruleId: string) {
    const rule = this._rules.find((r: Record<string, unknown>) => r.id === ruleId);
    if (!rule) return false;
    rule.enabled = !rule.enabled;
    this._saveRules();
    return rule.enabled;
  }

  /**
   * Remove a rule by ID.
   * @param {string} ruleId
   */
  removeRule(ruleId: string) {
    this._rules = this._rules.filter((r: Record<string, unknown>) => r.id !== ruleId);
    this._saveRules();
  }

  /** @returns {Array} All rules (copy) */
  getRules() { return this._rules.slice(); }

  /** @returns {Array} Only enabled rules */
  getEnabledRules() { return this._rules.filter((r: Record<string, unknown>) => r.enabled); }

  /** @returns {number} Total rule count */
  getRuleCount() { return this._rules.length; }

  /**
   * Evaluate a rule against a row's data.
   * @param {Object} rule
   * @param {Object} rowData — Nav item data
   * @returns {boolean}
   */
  _evaluateRule(rule: Record<string, unknown>, rowData: Record<string, unknown>) {
    const rawValue = rowData[rule.field as string];
    const fieldValue = String(rawValue != null ? rawValue : '').toLowerCase();
    const ruleValue = String(rule.value || '').toLowerCase();

    switch (rule.operator) {
      case OPERATORS.EQUALS:       return fieldValue === ruleValue;
      case OPERATORS.NOT_EQUALS:   return fieldValue !== ruleValue;
      case OPERATORS.GREATER:      return parseFloat(fieldValue) > parseFloat(ruleValue);
      case OPERATORS.LESS:         return parseFloat(fieldValue) < parseFloat(ruleValue);
      case OPERATORS.CONTAINS:     return fieldValue.indexOf(ruleValue) !== -1;
      case OPERATORS.IS_EMPTY:     return fieldValue === '' || rawValue == null;
      case OPERATORS.IS_NOT_EMPTY: return fieldValue !== '' && rawValue != null;
      default: return false;
    }
  }

  /**
   * Apply highlighting rules to a row.
   * @param {Object} rowData — Nav item data
   * @returns {{ style: string|null, classes: string[] }}
   */
  applyToRow(rowData: Record<string, unknown>) {
    const result: { style: string | null; classes: string[] } = { style: null, classes: [] };
    const enabledRules = this.getEnabledRules();

    for (const rule of enabledRules) {
      if (this._evaluateRule(rule, rowData)) {
        const color = COLORS.find(c => c.id === rule.color);
        if (color) {
          result.style = 'background-color: ' + color.bg + '; border-left: 3px solid ' + color.border + ';';
          result.classes.push('pna-row-highlighted--' + rule.color);
        }
      }
    }

    return result;
  }

  /**
   * Apply to multiple rows, returning a Map of id → result.
   * @param {Array<Object>} items — Nav items with .id
   * @returns {Map<string, { style: string|null, classes: string[] }>}
   */
  applyToRows(items: Record<string, unknown>[]) {
    const map = new Map();
    for (const item of (items || [])) {
      const result = this.applyToRow(item);
      if (result.style || result.classes.length > 0) {
        map.set(item.id, result);
      }
    }
    return map;
  }

  /** @returns {Array} Available fields for rules */
  getAvailableFields() { return this.fields.slice(); }

  /** @returns {Array} Available operators */
  getAvailableOperators() {
    return Object.entries(OPERATORS).map(([key, value]) => ({
      id: value,
      label: { equals: 'Igual a', not_equals: 'Diferente de', greater: 'Maior que', less: 'Menor que', contains: 'Contém', is_empty: 'Está vazio', is_not_empty: 'Não está vazio' }[value] || key
    }));
  }

  /** @returns {Array} Available colors */
  getAvailableColors() { return COLORS.slice(); }

  /** Clear all rules */
  clearAll() {
    this._rules = [];
    this._saveRules();
  }

  /** Reset — remove rules and clear storage */
  destroy() {
    this._rules = [];
    try { localStorage.removeItem(this._storageKey); } catch (e) { /* ignore */ }
  }
}

/**
 * Factory to create a HighlightingRulesManager instance.
 * @param {Object} [options]
 * @returns {HighlightingRulesManager}
 */
export function createHighlightingRulesManager(options: Record<string, unknown> = {}) {
  return new HighlightingRulesManager(options);
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    operators: Object.values(OPERATORS),
    colorCount: COLORS.length,
    fieldCount: NAV_ADMIN_FIELDS.length
  };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default {
  OPERATORS, COLORS, HighlightingRulesManager, createHighlightingRulesManager,
  info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID
};

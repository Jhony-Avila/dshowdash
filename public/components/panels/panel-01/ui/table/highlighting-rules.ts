// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/highlighting-rules
// PURPOSE: Panel-01 - Row Highlighting Rules
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   OPERATORS — exported value
//   COLORS — exported value
//   HighlightingRulesManager() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/highlighting-rules';

export const OPERATORS = { EQUALS: 'equals', NOT_EQUALS: 'not_equals', GREATER: 'greater', LESS: 'less', CONTAINS: 'contains', IS_EMPTY: 'is_empty', IS_NOT_EMPTY: 'is_not_empty' };
export const COLORS = [
  { id: 'red', label: 'Vermelho', bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  { id: 'green', label: 'Verde', bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
  { id: 'blue', label: 'Azul', bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' },
  { id: 'yellow', label: 'Amarelo', bg: '#fefce8', border: '#fef08a', text: '#ca8a04' }
];

export function HighlightingRulesManager(this: Record<string, unknown>, options: Record<string, unknown>) {
  options = options || {};
  this.columns = options.columns || [];
  this.onRulesChange = options.onRulesChange || (() => {});
  this.storageKey = options.storageKey || 'p01_highlighting_rules';
  this._rules = [];
  (this as Record<string, () => void>)._loadRules();
}

HighlightingRulesManager.prototype._loadRules = function() {
  try { const saved = localStorage.getItem(this.storageKey); if (saved) this._rules = JSON.parse(saved); } catch (e) { this._rules = []; }
};
HighlightingRulesManager.prototype._saveRules = function() {
  try { localStorage.setItem(this.storageKey, JSON.stringify(this._rules)); } catch (e) {}
  this.onRulesChange(this._rules);
};
HighlightingRulesManager.prototype.setColumns = function(columns: unknown[]) { this.columns = columns; };
HighlightingRulesManager.prototype.addRule = function(rule: Record<string, unknown>) { rule.id = `rule_${Date.now()}`; rule.enabled = true; this._rules.push(rule); this._saveRules(); return rule; };
HighlightingRulesManager.prototype.removeRule = function(ruleId: string) { this._rules = this._rules.filter((r: Record<string, unknown>) => r.id !== ruleId); this._saveRules(); };
HighlightingRulesManager.prototype.getRules = function() { return this._rules.slice(); };
HighlightingRulesManager.prototype.getEnabledRules = function() { return this._rules.filter((r: Record<string, unknown>) => r.enabled); };
HighlightingRulesManager.prototype.applyToRow = function(rowData: Record<string, unknown>) {
  const self = this;
  const result: { style: string | null; classes: string[] } = { style: null, classes: [] };
  this.getEnabledRules().forEach((rule: Record<string, unknown>) => {
    if (self._evaluateRule(rule, rowData)) {
      const color = COLORS.find(c => c.id === rule.color);
      if (color) { result.style = `background-color: ${color.bg};`; result.classes.push(`p01-row-highlighted--${rule.color}`); }
    }
  });
  return result;
};
HighlightingRulesManager.prototype._evaluateRule = (rule: Record<string, unknown>, rowData: Record<string, unknown>) => {
  const fieldValue = String(rowData[rule.field as string] || '').toLowerCase();
  const ruleValue = String(rule.value || '').toLowerCase();
  switch (rule.operator) {
    case OPERATORS.EQUALS: return fieldValue === ruleValue;
    case OPERATORS.NOT_EQUALS: return fieldValue !== ruleValue;
    case OPERATORS.GREATER: return parseFloat(fieldValue) > parseFloat(ruleValue);
    case OPERATORS.LESS: return parseFloat(fieldValue) < parseFloat(ruleValue);
    case OPERATORS.CONTAINS: return fieldValue.indexOf(ruleValue) !== -1;
    case OPERATORS.IS_EMPTY: return fieldValue === '';
    case OPERATORS.IS_NOT_EMPTY: return fieldValue !== '';
    default: return false;
  }
};
HighlightingRulesManager.prototype.destroy = function() { this._rules = []; };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { HighlightingRulesManager, OPERATORS, COLORS, info, healthCheck };

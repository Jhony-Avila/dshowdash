// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-AAA-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: action-registry
// PURPOSE: ActionRegistry - Registro Central de Ações P4 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getActionRegistry() — exported function
//   createActionRegistry() — exported function
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

export const VERSION = '2.0.0-AAA-P4';
export const MODULE_ID = 'action-registry';

export class ActionRegistry {
  [key: string]: any;
  constructor() {
    this._actions = new Map();
    this._initialized = false;
    this._metrics = { registered: 0, queries: 0, hits: 0, misses: 0 };
  }

  init() {
    if (this._initialized) return this;
    this._initialized = true;
    return this;
  }

  registerAction(def: Record<string, unknown>) {
    if (!def || !def.actionId) return { success: false, error: 'actionId required' };
    const entry = {
      actionId: def.actionId,
      kind: def.kind || 'ui',
      area: def.area || 'unknown',
      label: def.label || null,
      icon: def.icon || null,
      status: def.status || 'enabled',
      registeredAt: Date.now()
    };
    this._actions.set(def.actionId, entry);
    this._metrics.registered++;
    return { success: true, actionId: def.actionId };
  }

  registerMany(defs: Array<Record<string, unknown>> = []) {
    return defs.map(def => this.registerAction(def));
  }

  has(actionId: string) {
    this._metrics.queries++;
    const exists = this._actions.has(actionId);
    exists ? this._metrics.hits++ : this._metrics.misses++;
    return exists;
  }

  get(actionId: string) {
    this._metrics.queries++;
    const entry = this._actions.get(actionId);
    entry ? this._metrics.hits++ : this._metrics.misses++;
    return entry || null;
  }

  list() { return Array.from(this._actions.values()); }
  listByArea(area: string) { return this.list().filter(a => (a as any).area === area); }
  listByKind(kind: string) { return this.list().filter(a => (a as any).kind === kind); }
  unregister(actionId: string) { return this._actions.delete(actionId); }
  clear() { this._actions.clear(); this._metrics.registered = 0; }

  info() {
    return {
      version: VERSION, moduleId: MODULE_ID, initialized: this._initialized,
      totalActions: this._actions.size, metrics: { ...this._metrics }
    };
  }

  healthCheck() {
    const checks = { initialized: this._initialized, hasActions: this._actions.size > 0 };
    const passed = Object.values(checks).filter(Boolean).length;
    return {
      status: passed === 2 ? 'healthy' : passed >= 1 ? 'degraded' : 'unhealthy',
      score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID
    };
  }

  destroy() { this._actions.clear(); this._initialized = false; }
}

let _instance: Record<string, unknown> | null = null;
export function getActionRegistry() {
  if (!_instance) _instance = new ActionRegistry();
  return _instance;
}
export function createActionRegistry() { return new ActionRegistry(); }
export default { ActionRegistry, getActionRegistry, createActionRegistry, VERSION, MODULE_ID };

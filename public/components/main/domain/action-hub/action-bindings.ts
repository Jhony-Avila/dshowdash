// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: action-bindings
// PURPOSE: ActionBindings - Vinculações de Ações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   bind() — exported function
//   unbind() — exported function
//   trigger() — exported function
//   bindEffect() — exported function
//   getBinding() — exported function
//   hasBinding() — exported function
//   getHandlers() — exported function
//   getBindings() — exported function
//   clear() — exported function
//   getMetrics() — exported function
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

export const VERSION = '4.0.0-ENTERPRISE-UNIFIED';
export const MODULE_ID = 'action-bindings';

let _handlers = new Map();
let _bindings = new Map();
let _metrics = { binds: 0, unbinds: 0, triggers: 0, lookups: 0, effectBinds: 0, errors: 0 };

const DEFAULT_BINDINGS = {
  // HEADER - User Menu (FIX: prefixo completo header:user-menu:*)
  'header:user-menu:profile': { effect: 'NAVIGATE', params: { route: '#/meu-perfil' } },
  'header:user-menu:preferences': { effect: 'NAVIGATE', params: { route: '#/preferencias' } },
  'header:user-menu:security': { effect: 'NAVIGATE', params: { route: '#/seguranca' } },
  'header:user-menu:notifications': { effect: 'UI_EVENT', params: { event: 'notifications:open' } },
  'header:user-menu:sessions': { effect: 'NAVIGATE', params: { route: '#/sessoes' } },
  'header:user-menu:logout': { effect: 'LOGOUT', params: {} },
  
  // Header - Buttons
  'header:btn-notifications': { effect: 'UI_EVENT', params: { event: 'notifications:open' } },
  'header:btn-profile': { effect: 'NAVIGATE', params: { route: '#/meu-perfil' } },
  'header:btn-settings': { effect: 'NAVIGATE', params: { route: '#/preferencias' } },
  'header:btn-logout': { effect: 'LOGOUT', params: {} },
  'header:btn-search': { effect: 'UI_EVENT', params: { event: 'search:open' } },
  'header:refresh-action': { effect: 'REFRESH', params: {} },
  'header:fullscreen-action': { effect: 'FULLSCREEN', params: {} },
  'header:logout': { effect: 'LOGOUT', params: {} },
  
  // SIDEBAR
  'sidebar:navigate': { effect: 'NAVIGATE', params: { routeFromMeta: true } },
  
  // NAVRAIL
  'navrail:home': { effect: 'NAVIGATE', params: { route: '#/' } },
  'navrail:dashboard': { effect: 'NAVIGATE', params: { route: '#/dashboard' } },
  'navrail:financeiro': { effect: 'NAVIGATE', params: { route: '#/financeiro' } },
  'navrail:comercial': { effect: 'NAVIGATE', params: { route: '#/comercial' } },
  'navrail:clientes': { effect: 'NAVIGATE', params: { route: '#/clientes' } },
  'navrail:analytics': { effect: 'NAVIGATE', params: { route: '#/analytics' } },
  'navrail:relatorios': { effect: 'NAVIGATE', params: { route: '#/relatorios' } },
  'navrail:settings': { effect: 'NAVIGATE', params: { route: '#/settings' } },
  'navrail:help': { effect: 'UI_EVENT', params: { event: 'help:open' } },
  'navrail:bell': { effect: 'UI_EVENT', params: { event: 'notifications:open' } },
  'navrail:toggle-sidebar': { effect: 'UI_EVENT', params: { event: 'sidebar:toggle' } },
  
  // FOOTER
  'footer:logout': { effect: 'LOGOUT', params: {} },
  'footer:refresh': { effect: 'REFRESH', params: {} },
  'footer:fullscreen': { effect: 'FULLSCREEN', params: {} },
  
  // LEGACY
  'user-menu:profile': { effect: 'NAVIGATE', params: { route: '#/meu-perfil' } },
  'user-menu:settings': { effect: 'NAVIGATE', params: { route: '#/preferencias' } },
  'user-menu:logout': { effect: 'LOGOUT', params: {} }
};

function _initDefaultBindings() {
  for (const [actionId, binding] of Object.entries(DEFAULT_BINDINGS)) {
    if (!_bindings.has(actionId)) _bindings.set(actionId, binding);
  }
}
_initDefaultBindings();

export function bind(actionId: string, handler: (...args: unknown[]) => void) {
  try {
    if (!_handlers.has(actionId)) _handlers.set(actionId, new Set());
    _handlers.get(actionId).add(handler);
    _metrics.binds++;
    return () => unbind(actionId, handler);
  } catch (error) { _metrics.errors++; return () => {}; }
}

export function unbind(actionId: string, handler: (...args: unknown[]) => void) {
  try {
    const handlers = _handlers.get(actionId);
    if (handlers) { handlers.delete(handler); _metrics.unbinds++; }
  } catch (error) { _metrics.errors++; }
}

export function trigger(actionId: string, payload: Record<string, unknown>) {
  try {
    const handlers = _handlers.get(actionId);
    if (handlers) { handlers.forEach((h: (...args: unknown[]) => void) => { try { (h as (p: Record<string, unknown>) => void)(payload); } catch {} }); _metrics.triggers++; }
    return handlers?.size || 0;
  } catch (error) { _metrics.errors++; return 0; }
}

export function bindEffect(actionId: string, effect: (...args: unknown[]) => void, params: Record<string, unknown> = {}) {
  try { _bindings.set(actionId, { effect, params }); _metrics.effectBinds++; return true; }
  catch (error) { _metrics.errors++; return false; }
}

export function getBinding(actionId: string) {
  _metrics.lookups++;
  if (_bindings.has(actionId)) return _bindings.get(actionId);
  
  const prefix = actionId?.split(':')[0];
  if (prefix) {
    if (actionId === 'sidebar:navigate' || actionId?.startsWith('sidebar:')) {
      return { effect: 'NAVIGATE', params: { routeFromMeta: true } };
    }
    if (prefix === 'navrail') {
      const id = actionId.split(':')[1];
      if (id && !['bell', 'help', 'toggle-sidebar'].includes(id)) {
        return { effect: 'NAVIGATE', params: { route: `#/${id}` } };
      }
    }
    if (actionId?.startsWith('header:user-menu:')) {
      const action = actionId.split(':')[2];
      if (action === 'logout') return { effect: 'LOGOUT', params: {} };
      if (action && !['open', 'close', 'close-outside'].includes(action)) {
        return { effect: 'NAVIGATE', params: { route: `#/${action}` } };
      }
    }
  }
  return null;
}

export function hasBinding(actionId: string) {
  if (_bindings.has(actionId)) return true;
  if (_handlers.has(actionId) && _handlers.get(actionId).size > 0) return true;
  const prefix = actionId?.split(':')[0];
  if (prefix === 'sidebar' || prefix === 'navrail') return true;
  if (actionId?.startsWith('header:user-menu:')) return true;
  return false;
}

export function getHandlers(actionId: string) {
  const handlers = _handlers.get(actionId);
  return handlers ? Array.from(handlers) : [];
}

export function getBindings() { 
  return { 
    effects: Object.fromEntries(_bindings),
    handlers: Object.fromEntries([..._handlers.entries()].map(([k, v]) => [k, v.size]))
  }; 
}

export function clear() { _handlers.clear(); _bindings.clear(); _initDefaultBindings(); }
export function getMetrics() { return { ..._metrics, handlerCount: _handlers.size, bindingCount: _bindings.size }; }

export function healthCheck() {
  return { 
    status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED', 
    version: VERSION, 
    moduleId: MODULE_ID, 
    checks: { handlerCount: _handlers.size, bindingCount: _bindings.size, noErrors: _metrics.errors === 0 }, 
    metrics: getMetrics() 
  };
}

export default { bind, unbind, trigger, bindEffect, getBinding, hasBinding, getHandlers, getBindings, clear, getMetrics, healthCheck, VERSION, MODULE_ID };

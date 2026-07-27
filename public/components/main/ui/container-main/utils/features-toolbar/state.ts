
// Features Toolbar - State
// @version 8.0.0-SPRINT-I-ES6
// @changelog v8.0.0-SPRINT-I - #17 Async safety (guard unregister durante async), #25 freeze/unfreeze API
// @changelog v7.0.0-SPRINT-G - #16 Warning registerAction para buttonId inexistente no catálogo
// @changelog v6.0.0-SPRINT-F - #2 Idempotência destroy (resetThrottles/resetRewireState exports), #9 Polling pausa em document.hidden, #12 First-error logging para state providers
// @changelog v5.0.0-SPRINT-E - #8 Re-wire detection (action loss tracking), #28 Dynamic groups state registry
// @changelog v4.0.0-SPRINT-D - #26 Hooks before/after action (registerHook, unregisterHook)
// @changelog v3.1.0-NO-STACKTRACE - Migrate console.warn to console.log in first-error logging
// @changelog v3.0.0-SPRINT-B - #9 Timeout guard executeAction (5s), #12 First-error logging, #27 Async action support
// @changelog v2.0.0-ACTION-REGISTRY - Action Registry + State Providers (injeção de dependência)
// @changelog v1.3.0-FULL - Initial state with managers (acoplado — removido)
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: (none — self-contained state module)
// PROVIDES: isInitialized, setInitialized, getToolbarEl, setToolbarEl,
//           getContainer, setContainer, getEventBus, setEventBus,
//           getCleanups, addCleanup, clearCleanups,
//           registerAction, registerActions, unregisterAction, hasAction,
//           getRegisteredActions, getActionErrors, executeAction,
//           registerStateProvider, unregisterStateProvider, getButtonState,
//           getRegisteredStateProviders, registerHook, unregisterHook,
//           getRegisteredHooks, registerDynamicGroup, unregisterDynamicGroup,
//           getDynamicGroups, getDynamicGroup, snapshotActions, detectActionLoss,
//           isFrozen, freeze, unfreeze, resetAll
// BROWSER-APIS: document.getElementById, setTimeout, clearTimeout, Date.now
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.ui.container-main.utils.features-toolbar.state';

// ============================================================================
// CORE STATE
// ============================================================================

let _initialized = false;
export function isInitialized() { return _initialized; }
export function setInitialized(val: boolean) { _initialized = val as boolean; }

let _toolbarEl: HTMLElement | null = null;
export function getToolbarEl() { return _toolbarEl; }
export function setToolbarEl(el: HTMLElement) { _toolbarEl = el; }

let _container: HTMLElement | null = null;
export function getContainer() { return _container; }
export function setContainer(c: HTMLElement | null) { _container = c as HTMLElement | null; }

let _eventBus: Record<string, unknown> | null = null;
export function getEventBus() { return _eventBus; }
export function setEventBus(eb: Record<string, unknown> | null) { _eventBus = eb as Record<string, unknown> | null; }

// ============================================================================
// CLEANUPS
// ============================================================================

let _cleanups: unknown[] = [];
export function getCleanups() { return _cleanups; }
export function addCleanup(fn: (...args: unknown[]) => void) { _cleanups.push(fn); }
export function clearCleanups() { _cleanups = []; }

// ============================================================================
// UI STATE
// ============================================================================

let _currentPanelId: string | null = null;
export function getCurrentPanelId() { return _currentPanelId; }
export function setCurrentPanelId(id: string) { _currentPanelId = id; }

let _isDarkTheme = true;
export function isDarkTheme() { return _isDarkTheme; }
export function setIsDarkTheme(val: boolean) { _isDarkTheme = val as boolean; }

let _isFullscreen = false;
export function isFullscreen() { return _isFullscreen; }
export function setIsFullscreen(val: boolean) { _isFullscreen = val as boolean; }

let _isSplitActive = false;
export function isSplitActive() { return _isSplitActive; }
export function setIsSplitActive(val: boolean) { _isSplitActive = val as boolean; }

// ============================================================================
// #25-I: FREEZE STATE — desabilita todas as ações de uma vez
// ============================================================================

let _frozen = false;
let _frozenDisabledSnapshot: Record<string, unknown> | null = null;

/**
 * #25-I: Retorna se a toolbar está congelada.
 * @returns {boolean}
 */
export function isFrozen() { return _frozen; }

/**
 * #25-I: Congela a toolbar — salva estado disabled de todos os botões,
 * desabilita todos, e bloqueia executeAction.
 * @returns {boolean} true se congelou, false se já estava congelada
 */
export function freeze() {
  if (_frozen) return false;
  _frozen = true;

  // Salvar snapshot dos estados disabled atuais
  // @ts-expect-error TS migration - TS2352
  _frozenDisabledSnapshot = new Map() as Record<string, unknown>;
  if (_toolbarEl) {
    const buttons = _toolbarEl.querySelectorAll('.features-toolbar__btn');
    for (let i = 0; i < buttons.length; i++) {
      // @ts-expect-error TS migration - TS2339
      (_frozenDisabledSnapshot.set as (...args: unknown[]) => unknown)(buttons[i].id, buttons[i].disabled);
      // @ts-expect-error TS migration - TS2339
      buttons[i].disabled = true;
    }
  }

  // Emitir evento
  if (_eventBus && _eventBus.emit) {
    (_eventBus.emit as (...args: unknown[]) => unknown)('toolbar.frozen', {
      source: 'features-toolbar',
      timestamp: Date.now()
    });
  }

  return true;
}

/**
 * #25-I: Descongela a toolbar — restaura estados disabled do snapshot.
 * @returns {boolean} true se descongelou, false se não estava congelada
 */
export function unfreeze() {
  if (!_frozen) return false;
  _frozen = false;

  // Restaurar snapshot dos estados disabled
  if (_toolbarEl && _frozenDisabledSnapshot) {
    const buttons = _toolbarEl.querySelectorAll('.features-toolbar__btn');
    for (let i = 0; i < buttons.length; i++) {
      const wasDisabled = (_frozenDisabledSnapshot.get as (...args: unknown[]) => unknown)(buttons[i].id);
      if (wasDisabled !== undefined) {
        // @ts-expect-error TS migration - TS2339
        buttons[i].disabled = wasDisabled;
      } else {
        // Botão novo (adicionado durante freeze) — habilitar se tem action
        // @ts-expect-error TS migration - TS2339
        buttons[i].disabled = !_actions.has(buttons[i].id.replace('ft-btn-', ''));
      }
    }
  }
  _frozenDisabledSnapshot = null;

  // Emitir evento
  if (_eventBus && _eventBus.emit) {
    (_eventBus.emit as (...args: unknown[]) => unknown)('toolbar.unfrozen', {
      source: 'features-toolbar',
      timestamp: Date.now()
    });
  }

  return true;
}

// ============================================================================
// ACTION REGISTRY
// ============================================================================

const _actions = new Map();
const _handlerFirstErrors = new Map();
const _providerFirstErrors = new Map();
const ACTION_TIMEOUT_MS = 5000;

// #17-I: Set para rastrear ações async em andamento
const _pendingAsyncActions = new Set();

// ============================================================================
// #16-G — KNOWN IDS (catálogo para validação no registerAction)
// ============================================================================

const _KNOWN_BUTTON_IDS = [
  'back', 'forward', 'refresh', 'search', 'command',
  'split', 'fullscreen', 'zoomOut', 'zoomReset', 'zoomIn',
  'bookmark', 'export', 'print', 'theme', 'a11y', 'tour',
  'offline', 'tabs', 'layout', 'devtools',
  'clipboard', 'screenshot', 'wakeLock',
  'history'
];

const _KNOWN_DROPDOWN_IDS = [
  'history', 'export', 'a11y', 'layout',
  'clipboard-copy-url', 'clipboard-copy-content',
  'screenshot-png', 'screenshot-pdf'
];

const _KNOWN_ACTION_IDS = [
  'history-back-all', 'history-clear',
  'export-png', 'export-jpeg', 'export-pdf', 'export-svg',
  'a11y-font-increase', 'a11y-font-decrease', 'a11y-high-contrast', 'a11y-focus-mode',
  'layout-default', 'layout-compact', 'layout-wide'
];

// ============================================================================
// #8 — RE-WIRE DETECTION
// ============================================================================

let _previousActionKeys: unknown[] = [];

export function snapshotActions() {
  _previousActionKeys = Array.from(_actions.keys());
}

export function detectActionLoss() {
  const currentKeys = Array.from(_actions.keys());
  const lost = [];
  for (let i = 0; i < _previousActionKeys.length; i++) {
    if (currentKeys.indexOf(_previousActionKeys[i]) === -1) {
      lost.push(_previousActionKeys[i]);
    }
  }
  return {
    lost,
    current: currentKeys,
    hadActions: _previousActionKeys.length > 0
  };
}

// ============================================================================
// #28 — DYNAMIC GROUPS REGISTRY
// ============================================================================

const _dynamicGroups = new Map();

export function registerDynamicGroup(groupId: string, groupDef: unknown) {
  if (!groupId || !groupDef || typeof groupDef !== 'object') return false;
  // @ts-expect-error TS migration - TS2339
  if (!groupDef.label || !Array.isArray(groupDef.buttons) || groupDef.buttons.length === 0) return false;
  _dynamicGroups.set(groupId, Object.assign({ id: groupId }, groupDef));
  return true;
}

export function unregisterDynamicGroup(groupId: string) {
  return _dynamicGroups.delete(groupId);
}

export function getDynamicGroups() {
  const groups: unknown[] = [];
  _dynamicGroups.forEach(g => { groups.push(g); });
  return groups;
}

export function getDynamicGroup(groupId: string) {
  return _dynamicGroups.get(groupId) || null;
}

// ============================================================================
// #26 — HOOKS BEFORE/AFTER ACTION
// ============================================================================

const _hooks = new Map();

export function registerHook(buttonId: string, phase: string, fn: (...args: unknown[]) => void) {
  if (typeof fn !== 'function') return false;
  if (phase !== 'before' && phase !== 'after') return false;
  if (!_hooks.has(buttonId)) {
    _hooks.set(buttonId, { before: [], after: [] });
  }
  const entry = _hooks.get(buttonId);
  if (entry[phase].indexOf(fn) === -1) {
    entry[phase].push(fn);
  }
  return true;
}

export function unregisterHook(buttonId: string, phase: string, fn: (...args: unknown[]) => void) {
  if (!_hooks.has(buttonId)) return false;
  const entry = _hooks.get(buttonId);
  if (!entry[phase]) return false;
  const idx = entry[phase].indexOf(fn);
  if (idx === -1) return false;
  entry[phase].splice(idx, 1);
  if (entry.before.length === 0 && entry.after.length === 0) {
    _hooks.delete(buttonId);
  }
  return true;
}

export function getRegisteredHooks() {
  const result = {};
  _hooks.forEach((entry, id) => {
    (result as Record<string, unknown>)[id] = { before: entry.before.length, after: entry.after.length };
  });
  return result;
}

function _runHooks(phase: string, buttonId: string, context: Record<string, unknown>) {
  let cancelled = false;
  const hookSets = [];
  if (_hooks.has('*')) hookSets.push(_hooks.get('*')[phase]);
  if (_hooks.has(buttonId)) hookSets.push(_hooks.get(buttonId)[phase]);

  for (let s = 0; s < hookSets.length; s++) {
    const set = hookSets[s];
    if (!set) continue;
    for (let i = 0; i < set.length; i++) {
      try {
        const hookResult = set[i](context);
        if (phase === 'before' && hookResult && hookResult.cancel === true) {
          cancelled = true;
        }
      } catch (e) {
        // @ts-expect-error strict migration — TS2774
        if (typeof console !== 'undefined' && console.log) {
          console.debug(`[features-toolbar] Hook error (${phase}/${buttonId}):`, (e as Error).message || e);
        }
      }
    }
  }
  return { cancelled };
}

// ============================================================================
// ACTION REGISTRATION
// ============================================================================

export function registerAction(buttonId: string, handler: (...args: unknown[]) => void) {
  if (typeof handler !== 'function') return false;
  _actions.set(buttonId, handler);
  _handlerFirstErrors.delete(buttonId);
  _syncButtonEnabled(buttonId, true);
  // #16-G: Warning se buttonId nao existe no catalogo
  if (_KNOWN_BUTTON_IDS.indexOf(buttonId) === -1 &&
      _KNOWN_DROPDOWN_IDS.indexOf(buttonId) === -1 &&
      _KNOWN_ACTION_IDS.indexOf(buttonId) === -1) {
    if (typeof console !== 'undefined' && console.debug) {
      console.debug(`[features-toolbar] registerAction: "${buttonId}" not in known catalog.`);
    }
  }
  return true;
}

export function registerActions(actionsMap: unknown) {
  if (!actionsMap || typeof actionsMap !== 'object') return 0;
  let count = 0;
  const entries = Object.entries(actionsMap);
  for (let i = 0; i < entries.length; i++) {
    if (registerAction(entries[i][0], entries[i][1])) count++;
  }
  return count;
}

export function unregisterAction(buttonId: string) {
  const existed = _actions.delete(buttonId);
  if (existed) {
    _handlerFirstErrors.delete(buttonId);
    _syncButtonEnabled(buttonId, false);
  }
  return existed;
}

// ============================================================================
// EXECUTE ACTION
// #17-I: Guard contra unregister durante async — verifica _actions.has()
//        antes de emitir resultados no .then/.catch
// #25-I: Guard contra freeze — bloqueia execução quando _frozen
// ============================================================================

export function executeAction(buttonId: string, event: string, btnEl: HTMLElement) {
  // #25-I: Bloquear execução quando frozen
  if (_frozen) {
    return { ok: false, error: 'toolbar_frozen' };
  }

  const handler = _actions.get(buttonId);
  if (!handler) return { ok: false, error: 'no_action_registered' };

  const hookContext: any = { buttonId, event, btnEl };
  const beforeResult = _runHooks('before', buttonId, hookContext);
  if (beforeResult.cancelled) {
    _emitActionEvent('toolbar:action:cancelled', buttonId);
    return { ok: false, cancelled: true };
  }

  let result;
  try {
    result = handler(event, btnEl);
  } catch (error: any) {
    _handleActionError(buttonId, error, btnEl);
    hookContext.error = error.message;
    _runHooks('after', buttonId, hookContext);
    return { ok: false, error: error.message };
  }

  if (result && typeof result.then === 'function') {
    _handleAsyncAction(buttonId, result, btnEl, hookContext);
    return { ok: true, async: true };
  }

  _emitActionEvent('toolbar:action:executed', buttonId);
  hookContext.success = true;
  _runHooks('after', buttonId, hookContext);
  return { ok: true };
}

/**
 * #17-I: Async action handler com guard contra unregister.
 * Rastreia ações pendentes via _pendingAsyncActions.
 * Verifica _actions.has(buttonId) antes de emitir resultados,
 * evitando hooks/events órfãos se a action foi removida durante await.
 */
function _handleAsyncAction(buttonId: string, promise: Record<string, unknown>, btnEl: HTMLElement, hookContext: Record<string, unknown>) {
  if (btnEl) btnEl.classList.add('features-toolbar__btn--loading');
  let timedOut = false;

  // #17-I: Rastrear ação pendente
  _pendingAsyncActions.add(buttonId);

  const timeoutId = setTimeout(() => {
    timedOut = true;
    _pendingAsyncActions.delete(buttonId);
    if (btnEl) btnEl.classList.remove('features-toolbar__btn--loading');
    // @ts-expect-error TS migration - TS2345
    _handleActionError(buttonId, new Error(`Action timeout (${ACTION_TIMEOUT_MS}ms)`), btnEl);
    _emitActionEvent('toolbar:action:timeout', buttonId);
    hookContext.error = 'timeout';
    _runHooks('after', buttonId, hookContext);
  }, ACTION_TIMEOUT_MS);

  // @ts-expect-error strict migration — TS2571
  (promise.then as (...args: unknown[]) => unknown)(() => {
    if (timedOut) return;
    clearTimeout(timeoutId);
    _pendingAsyncActions.delete(buttonId);
    if (btnEl) btnEl.classList.remove('features-toolbar__btn--loading');

    // #17-I: Guard — só emitir resultado se action ainda está registrada
    if (!_actions.has(buttonId)) {
      if (typeof console !== 'undefined' && console.debug) {
        console.debug(`[features-toolbar] Async action "${buttonId}" completed but was unregistered during execution.`);
      }
      return;
    }

    _emitActionEvent('toolbar:action:executed', buttonId);
    hookContext.success = true;
    _runHooks('after', buttonId, hookContext);
  }).catch((error: Error) => {
    if (timedOut) return;
    clearTimeout(timeoutId);
    _pendingAsyncActions.delete(buttonId);
    if (btnEl) btnEl.classList.remove('features-toolbar__btn--loading');

    // #17-I: Guard — só emitir erro se action ainda está registrada
    if (!_actions.has(buttonId)) {
      if (typeof console !== 'undefined' && console.debug) {
        console.debug(`[features-toolbar] Async action "${buttonId}" failed but was unregistered during execution.`);
      }
      return;
    }

    // @ts-expect-error TS migration - TS2345
    const normalizedError = _normalizeError(error);
    _handleActionError(buttonId, normalizedError, btnEl);
    hookContext.error = normalizedError.message;
    _runHooks('after', buttonId, hookContext);
  });
}

function _normalizeError(error: Record<string, unknown>) {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return { message: error };
  if (error && typeof error === 'object' && error.message) return error;
  return { message: String(error || 'Unknown error') };
}

function _handleActionError(buttonId: string, error: Record<string, unknown>, btnEl: HTMLElement) {
  if (btnEl) {
    btnEl.classList.add('features-toolbar__btn--error');
    setTimeout(() => {
      btnEl.classList.remove('features-toolbar__btn--error');
    }, 200);
  }
  const errorMsg = (error && error.message) || String(error || 'Unknown error');
  if (!_handlerFirstErrors.has(buttonId)) {
    _handlerFirstErrors.set(buttonId, { error: errorMsg, timestamp: Date.now() });
    // @ts-expect-error strict migration — TS2774
    if (typeof console !== 'undefined' && console.log) {
      console.debug(`[features-toolbar] First error for action "${buttonId}":`, errorMsg);
    }
  }
  _emitActionEvent('toolbar:action:failed', buttonId, (errorMsg as Record<string, unknown>));
}

export function hasAction(buttonId: string) {
  return _actions.has(buttonId);
}

export function getRegisteredActions() {
  return Array.from(_actions.keys());
}

export function getActionErrors() {
  const errors = {};
  _handlerFirstErrors.forEach((val, key) => { (errors as Record<string, unknown>)[key] = val; });
  return errors;
}

// ============================================================================
// STATE PROVIDERS
// ============================================================================

const _stateProviders = new Map();

export function registerStateProvider(buttonId: string, provider: unknown) {
  if (typeof provider !== 'function') return false;
  _stateProviders.set(buttonId, provider);
  _providerFirstErrors.delete(buttonId);
  return true;
}

export function unregisterStateProvider(buttonId: string) {
  _providerFirstErrors.delete(buttonId);
  return _stateProviders.delete(buttonId);
}

export function getButtonState(buttonId: string) {
  const provider = _stateProviders.get(buttonId);
  if (!provider) return null;
  try {
    return (provider as (...args: unknown[]) => unknown)();
  } catch (e) {
    if (!_providerFirstErrors.has(buttonId)) {
      _providerFirstErrors.set(buttonId, {
        error: (e && (e as Error).message) || String(e),
        timestamp: Date.now()
      });
      // @ts-expect-error strict migration — TS2774
      if (typeof console !== 'undefined' && console.log) {
        console.debug(`[features-toolbar] First error for stateProvider "${buttonId}":`, (e as Error).message || e);
      }
    }
    return null;
  }
}

export function getRegisteredStateProviders() {
  return Array.from(_stateProviders.keys());
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function _syncButtonEnabled(buttonId: string, enabled: boolean) {
  if (typeof document === 'undefined') return;
  // #25-I: Não alterar disabled durante freeze — snapshot controla
  if (_frozen) return;
  let btn = null;
  if (_toolbarEl) {
    btn = _toolbarEl.querySelector(`#ft-btn-${buttonId}`) as HTMLElement | null;
  }
  if (!btn) {
    btn = document.getElementById(`ft-btn-${buttonId}`);
  }
  if (!btn) return;
  // @ts-expect-error strict migration — TS2339
  btn.disabled = !enabled;
}

function _emitActionEvent(eventName: string, buttonId: string, error?: Record<string, unknown>) {
  if (!_eventBus || !_eventBus.emit) return;
  (_eventBus.emit as (...args: unknown[]) => unknown)(eventName, {
    buttonId,
    timestamp: Date.now(),
    source: 'features-toolbar',
    error: error || null
  });
}

// ============================================================================
// RESET (para destroy)
// ============================================================================

export function resetAll() {
  _actions.clear();
  _stateProviders.clear();
  _handlerFirstErrors.clear();
  _providerFirstErrors.clear();
  _hooks.clear();
  _dynamicGroups.clear();
  _pendingAsyncActions.clear();
  _previousActionKeys = [];
  _initialized = false;
  _toolbarEl = null;
  _container = null;
  _eventBus = null;
  _cleanups = [];
  _currentPanelId = null;
  _isDarkTheme = true;
  _isFullscreen = false;
  _isSplitActive = false;
  _frozen = false;
  _frozenDisabledSnapshot = null;
}

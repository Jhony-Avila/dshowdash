
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-SPRINT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Features Toolbar - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isInitialized, setInitialized, getToolbarEl, setToolbarEl, getContainer, setC...
//   _buildToolbar, _appendDynamicGroup from ./ui/builder.js
//   _updateButtonStates from ./ui/state-updater.js
//   _injectStyles, _updateTooltipDelay from ./styles.js
//   _setupEventListeners, resetRewireState from ./events/listeners.js
//   resetThrottles from ./helpers/dom.js
//   BUTTON_IDS, DROPDOWN_IDS, ALL_BUTTON_IDS, ALL_DROPDOWN_IDS, GROUPS, GROUP_ORD...
//
// PROVIDES:
//   init() — exported function
//   destroy() — exported function
//   show() — exported function
//   hide() — exported function
//   toggle() — exported function
//   isVisible() — exported function
//   freeze() — exported function
//   unfreeze() — exported function
//   setConfig() — exported function
//   registerGroup() — exported function
//   unregisterGroup() — exported function
//   executeActionPublic() — exported function
//   updateButtonStates() — exported function
//   refresh() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   registerHook — exported value
//   unregisterHook — exported value
//   registerAction — exported value
//   registerActions — exported value
//   ... and 11 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   'toolbar.destroyed'
//   'toolbar.frozen'
//   'toolbar.group.added'
//   'toolbar.group.removed'
//   'toolbar.initialized'
//   'toolbar.initializing'
//   'toolbar.unfrozen'
// LISTENS (eventos):
//   'visibilitychange'
// WINDOW ACCESS:
//   window.Logger
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '1.1.0-SHELL-CSS';
export const MODULE_ID = 'main.ui.container-main.utils.features-toolbar.api';

import {
  isInitialized, setInitialized,
  getToolbarEl, setToolbarEl,
  getContainer, setContainer,
  getEventBus, setEventBus,
  getCleanups, clearCleanups,
  registerAction, registerActions, unregisterAction,
  hasAction, getRegisteredActions, getActionErrors,
  registerStateProvider, unregisterStateProvider, getRegisteredStateProviders,
  registerHook, unregisterHook, getRegisteredHooks,
  registerDynamicGroup, unregisterDynamicGroup, getDynamicGroups, getDynamicGroup,
  snapshotActions, getButtonState, executeAction,
  isFrozen, freeze as _freezeState, unfreeze as _unfreezeState,
  resetAll
} from './state.js';
import { _buildToolbar, _appendDynamicGroup } from './ui/builder.js';
import { _updateButtonStates } from './ui/state-updater.js';
import { _injectStyles, _updateTooltipDelay } from './styles.js';
import { _setupEventListeners, resetRewireState } from './events/listeners.js';
import { resetThrottles } from './helpers/dom.js';
import {
  BUTTON_IDS, DROPDOWN_IDS, ALL_BUTTON_IDS, ALL_DROPDOWN_IDS,
  GROUPS, GROUP_ORDER,
  getConfig, setConfig as _setConfigInternal, getAllConfig
} from './constants.js';

const Logger = (typeof window !== 'undefined' && (window as any).Logger) || { debug() {}, info() {}, warn() {}, error() {} };

// ============================================================================
// #30-J — SCHEMA VERSIONING LOCALSTORAGE
// ============================================================================

const VISIBILITY_STORAGE_KEY = 'ft-toolbar-visible';
const STORAGE_SCHEMA_VERSION = 1;

function _saveVisibility(visible: boolean) {
  try {
    localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify({
      v: STORAGE_SCHEMA_VERSION,
      visible
    }));
  } catch (e) {}
}

function _loadVisibility() {
  try {
    const raw = localStorage.getItem(VISIBILITY_STORAGE_KEY);
    if (raw === null) return true;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof parsed.v === 'number') {
        return parsed.visible !== false;
      }
    } catch (_parseErr) {}

    if (raw === '0') {
      _saveVisibility(false);
      return false;
    }
    _saveVisibility(true);
    return true;
  } catch (e) { return true; }
}

// ============================================================================
// #9-F — POLLING
// ============================================================================

let _pollingIntervalId: ReturnType<typeof setInterval> | null = null;
const POLLING_INTERVAL_MS = 2000;
let _visibilityListenerAdded = false;

function _startPolling() {
  if (_pollingIntervalId !== null) return;
  _pollingIntervalId = setInterval(() => {
    if (document.hidden) return;
    const toolbar = getToolbarEl();
    if (!toolbar || toolbar.style.display === 'none') return;
    if (isInitialized()) {
      _updateButtonStates();
    }
  }, POLLING_INTERVAL_MS);

  if (!_visibilityListenerAdded) {
    _visibilityListenerAdded = true;
    document.addEventListener('visibilitychange', _onVisibilityChange);
  }
}

function _onVisibilityChange() {
  if (!document.hidden && isInitialized() && getToolbarEl()) {
    _updateButtonStates();
  }
}

function _stopPolling() {
  if (_pollingIntervalId !== null) {
    clearInterval(_pollingIntervalId);
    _pollingIntervalId = null;
  }
  if (_visibilityListenerAdded) {
    document.removeEventListener('visibilitychange', _onVisibilityChange);
    _visibilityListenerAdded = false;
  }
}

// ============================================================================
// INIT — #1-F HTMLElement validation, #8-I Loading class
// ============================================================================

export function init(containerEl: unknown, eventBus: Record<string, unknown>) {
  if (isInitialized()) {
    Logger.debug('[features-toolbar] Already initialized, skipping.');
    return;
  }

  if (!containerEl || !(containerEl instanceof HTMLElement)) {
    Logger.debug('[features-toolbar] init() aborted: containerEl is not a valid HTMLElement.');
    return;
  }

  Logger.debug('[features-toolbar] Initializing...');

  if (eventBus && eventBus.emit) {
    (eventBus.emit as (...args: unknown[]) => unknown)('toolbar.initializing', { source: 'features-toolbar', timestamp: Date.now() });
  }

  setContainer(containerEl);
  setEventBus(eventBus);

  _injectStyles();

  const toolbar = _buildToolbar();
  setToolbarEl(toolbar);

  toolbar.classList.add('features-toolbar--loading');

  const header = containerEl.querySelector('.dsd-container__header') as HTMLElement | null;
  if (header) {
    const controls = header.querySelector('.dsd-container__controls') as HTMLElement | null;
    if (controls) {
      header.insertBefore(toolbar, controls);
    } else {
      header.appendChild(toolbar);
    }
  } else {
    containerEl.prepend(toolbar);
  }

  toolbar.classList.add('features-toolbar--entering');
  setTimeout(() => {
    toolbar.classList.remove('features-toolbar--entering');
  }, 300);

  const savedVisibility = _loadVisibility();
  if (!savedVisibility) {
    toolbar.style.display = 'none';
  }

  _setupEventListeners();
  _updateButtonStates();
  setInitialized(true);

  snapshotActions();

  // #SHELL-CSS: CSS agora carrega via index.html <link>, então o estilo
  // já está disponível quando init() roda. Um único rAF é suficiente
  // para garantir que o layout --entering esteja pintado antes de
  // remover --loading.
  requestAnimationFrame(() => {
    toolbar.classList.remove('features-toolbar--loading');
  });

  _startPolling();

  if (eventBus && eventBus.emit) {
    (eventBus.emit as (...args: unknown[]) => unknown)('toolbar.initialized', {
      source: 'features-toolbar',
      buttonCount: toolbar.querySelectorAll('.features-toolbar__btn').length,
      groups: GROUP_ORDER.length,
      timestamp: Date.now()
    });
  }

  Logger.debug('[features-toolbar] Initialized successfully.');
}

// ============================================================================
// DESTROY — #2-F Idempotência, #21-J remove <link> CSS externo
// ============================================================================

export function destroy() {
  if (!isInitialized()) return;

  Logger.debug('[features-toolbar] Destroying...');

  _stopPolling();

  const cleanups = getCleanups();
  for (let i = 0; i < cleanups.length; i++) {
    // @ts-expect-error TS migration - TS2349
    try { cleanups[i](); } catch (e) {}
  }
  clearCleanups();

  const toolbar = getToolbarEl();
  if (toolbar && toolbar.parentNode) {
    toolbar.parentNode.removeChild(toolbar);
  }

  // #21-J: Remove tanto <style> legado quanto <link> CSS externo
  const style = document.getElementById('features-toolbar-styles');
  if (style) style.remove();
  const cssLink = document.getElementById('features-toolbar-css');
  if (cssLink) cssLink.remove();

  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    (eventBus.emit as (...args: unknown[]) => unknown)('toolbar.destroyed', { source: 'features-toolbar', timestamp: Date.now() });
  }

  resetThrottles();
  resetRewireState();
  resetAll();

  Logger.debug('[features-toolbar] Destroyed.');
}

// ============================================================================
// SHOW / HIDE / TOGGLE / #19-J: isVisible()
// ============================================================================

export function show() {
  const toolbar = getToolbarEl();
  if (toolbar) { toolbar.style.display = ''; _saveVisibility(true); }
}

export function hide() {
  const toolbar = getToolbarEl();
  if (toolbar) { toolbar.style.display = 'none'; _saveVisibility(false); }
}

export function toggle() {
  const toolbar = getToolbarEl();
  if (!toolbar) return;
  const isHidden = toolbar.style.display === 'none';
  if (isHidden) { show(); } else { hide(); }
  return isHidden;
}

export function isVisible() {
  const toolbar = getToolbarEl();
  if (!toolbar) return false;
  return toolbar.style.display !== 'none';
}

// ============================================================================
// #25-I — FREEZE / UNFREEZE API
// ============================================================================

export function freeze() {
  if (!isInitialized()) return;
  _freezeState();
  _stopPolling();
  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    (eventBus.emit as (...args: unknown[]) => unknown)('toolbar.frozen', { source: 'features-toolbar', timestamp: Date.now() });
  }
  Logger.debug('[features-toolbar] Frozen.');
}

export function unfreeze() {
  if (!isInitialized()) return;
  _unfreezeState();
  _startPolling();
  _updateButtonStates();
  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    (eventBus.emit as (...args: unknown[]) => unknown)('toolbar.unfrozen', { source: 'features-toolbar', timestamp: Date.now() });
  }
  Logger.debug('[features-toolbar] Unfrozen.');
}

// ============================================================================
// HOOKS — Bridge re-export
// ============================================================================

export { registerHook, unregisterHook };

// ============================================================================
// CONFIG
// ============================================================================

export function setConfig(key: string, value: unknown) {
  _setConfigInternal(key, value);
  // @ts-expect-error TS migration - TS2349
  _updateTooltipDelay((getConfig as unknown as number)('tooltipDelay'));
  _updateButtonStates();
}

// ============================================================================
// REGISTER GROUP / UNREGISTER GROUP
// ============================================================================

export function registerGroup(groupId: string, groupDef: Record<string, unknown>) {
  if (!groupId || !groupDef) return false;

  const registered = registerDynamicGroup(groupId, groupDef);
  if (!registered) return false;

  const toolbar = getToolbarEl();
  if (toolbar) {
    const groupEl = _appendDynamicGroup(toolbar, groupId, groupDef.buttons);
    if (!groupEl) {
      unregisterDynamicGroup(groupId);
      return false;
    }
  }

  Logger.debug(`[features-toolbar] Dynamic group registered: ${groupId}`);

  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    (eventBus.emit as (...args: unknown[]) => unknown)('toolbar.group.added', {
      source: 'features-toolbar',
      groupId,
      buttonCount: (groupDef.buttons as unknown[]).length,
      timestamp: Date.now()
    });
  }

  return true;
}

export function unregisterGroup(groupId: string) {
  const removed = unregisterDynamicGroup(groupId);
  if (!removed) return false;

  const toolbar = getToolbarEl();
  if (toolbar) {
    const groupEl = toolbar.querySelector(`[data-group-id="${groupId}"]`) as HTMLElement | null;
    if (groupEl && groupEl.parentNode) {
      groupEl.parentNode.removeChild(groupEl);
    }
  }

  Logger.debug(`[features-toolbar] Dynamic group unregistered: ${groupId}`);

  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    (eventBus.emit as (...args: unknown[]) => unknown)('toolbar.group.removed', {
      source: 'features-toolbar',
      groupId,
      timestamp: Date.now()
    });
  }

  return true;
}

// ============================================================================
// ACTION REGISTRATION — Bridge re-exports
// ============================================================================

export { registerAction, registerActions, unregisterAction, hasAction, getRegisteredActions };
export { registerStateProvider, unregisterStateProvider };

// ============================================================================
// EXECUTE ACTION (PUBLIC)
// ============================================================================

export function executeActionPublic(buttonId: string, event: string) {
  if (!isInitialized()) return { ok: false, error: 'not_initialized' };
  if (!hasAction(buttonId)) return { ok: false, error: 'no_action' };

  let btn = null;
  const toolbar = getToolbarEl();
  if (toolbar) {
    btn = toolbar.querySelector(`#ft-btn-${buttonId}`) as HTMLElement | null || toolbar.querySelector(`[data-button-id="${buttonId}"]`);
  }

  try {
    // @ts-expect-error strict migration — TS2345
    const result = executeAction(buttonId, event, btn);
    return { ok: true, result };
  } catch (e) {
    // @ts-expect-error strict migration — TS2339
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

// ============================================================================
// UPDATE (manual trigger) / REFRESH
// ============================================================================

export function updateButtonStates() {
  _updateButtonStates();
}

export function refresh() {
  if (!isInitialized()) return;
  _updateButtonStates();
}

// ============================================================================
// CONSTANTS EXPORT
// ============================================================================

export { BUTTON_IDS, DROPDOWN_IDS, ALL_BUTTON_IDS, ALL_DROPDOWN_IDS, GROUPS, GROUP_ORDER };

// ============================================================================
// HEALTH CHECK DETALHADO POR BOTÃO
// ============================================================================

function _getDetailedButtonHealth() {
  const buttons = {};
  const toolbar = getToolbarEl();

  ALL_BUTTON_IDS.forEach(buttonId => {
    const btnEl = toolbar ? toolbar.querySelector(`#ft-btn-${buttonId}`) : null;
    const state = getButtonState(buttonId);

    (buttons as Record<string, unknown>)[buttonId] = {
      inDOM: !!btnEl,
      hasAction: hasAction(buttonId),
      hasStateProvider: getRegisteredStateProviders().indexOf(buttonId) !== -1,
      // @ts-expect-error TS migration - TS2339
      enabled: btnEl ? !btnEl.disabled : false,
      active: btnEl ? btnEl.classList.contains('features-toolbar__btn--active') : false,
      skeleton: btnEl ? btnEl.classList.contains('features-toolbar__btn--skeleton') : false,
      currentState: state || null
    };
  });

  return buttons;
}

function _getGroupsHealth() {
  const toolbar = getToolbarEl();
  const groups = {};

  GROUP_ORDER.forEach(groupId => {
    const groupEl = toolbar ? toolbar.querySelector(`[data-group-id="${groupId}"]`) : null;
    (groups as Record<string, unknown>)[groupId] = {
      type: 'static',
      inDOM: !!groupEl,
      // @ts-expect-error TS migration - TS2339
      visible: groupEl ? groupEl.style.display !== 'none' : false,
      buttonCount: groupEl ? groupEl.querySelectorAll('.features-toolbar__btn').length : 0
    };
  });

  const dynamicGroupsList = getDynamicGroups();
  dynamicGroupsList.forEach(g => {
    const groupEl = toolbar ? toolbar.querySelector(`[data-group-id="${(g as Record<string, unknown>).id}"]`) : null;
    // @ts-expect-error TS migration - TS2538
    (groups as Record<string, unknown>)[(g as Record<string, unknown>).id] = {
      type: 'dynamic',
      label: (g as Record<string, unknown>).label,
      inDOM: !!groupEl,
      // @ts-expect-error TS migration - TS2339
      visible: groupEl ? groupEl.style.display !== 'none' : false,
      buttonCount: groupEl ? groupEl.querySelectorAll('.features-toolbar__btn').length : 0
    };
  });

  return groups;
}

// ============================================================================
// DIAGNOSTICS — #19-J: isVisible, #30-J: schema version
// ============================================================================

export function info() {
  const toolbar = getToolbarEl();
  return {
    initialized: isInitialized(),
    visible: toolbar ? toolbar.style.display !== 'none' : false,
    frozen: isFrozen(),
    buttonCount: toolbar ? toolbar.querySelectorAll('.features-toolbar__btn').length : 0,
    registeredActions: getRegisteredActions(),
    registeredStateProviders: getRegisteredStateProviders(),
    registeredHooks: getRegisteredHooks(),
    dynamicGroups: getDynamicGroups().map(g => (g as Record<string, unknown>).id),
    actionErrors: getActionErrors(),
    config: getAllConfig(),
    pollingActive: _pollingIntervalId !== null,
    storageSchema: STORAGE_SCHEMA_VERSION
  };
}

export function healthCheck() {
  const toolbar = getToolbarEl();
  const registeredActionsList = getRegisteredActions();
  const totalButtons = ALL_BUTTON_IDS.length;
  const wiredButtons = registeredActionsList.filter(id => ALL_BUTTON_IDS.indexOf(id) !== -1).length;
  const dropdownActions = registeredActionsList.filter(id => ALL_DROPDOWN_IDS.indexOf(id) !== -1).length;

  const overflowEl = toolbar ? toolbar.querySelector('#ft-overflow') : null;
  // @ts-expect-error TS migration - TS2339
  const overflowActive = overflowEl ? overflowEl.style.display !== 'none' : false;

  return {
    status: isInitialized() ? 'healthy' : 'not_initialized',
    initialized: isInitialized(),
    inDOM: toolbar ? document.contains(toolbar) : false,
    visible: toolbar ? toolbar.style.display !== 'none' : false,
    frozen: isFrozen(),
    totalButtons,
    wiredButtons,
    wiredDropdownItems: dropdownActions,
    wiredPercentage: totalButtons > 0 ? `${Math.round((wiredButtons / totalButtons) * 100)}%` : '0%',
    buttons: _getDetailedButtonHealth(),
    groups: _getGroupsHealth(),
    overflow: {
      active: overflowActive,
      hiddenGroups: overflowActive && overflowEl ? overflowEl.querySelectorAll('.features-toolbar__overflow-header').length : 0
    },
    registeredHooks: getRegisteredHooks(),
    actionErrors: getActionErrors(),
    config: getAllConfig(),
    pollingActive: _pollingIntervalId !== null,
    storageSchema: STORAGE_SCHEMA_VERSION
  };
}

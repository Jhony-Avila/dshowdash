const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.utils.features-toolbar.state";
let _initialized = false;
function isInitialized() {
  return _initialized;
}
function setInitialized(val) {
  _initialized = val;
}
let _toolbarEl = null;
function getToolbarEl() {
  return _toolbarEl;
}
function setToolbarEl(el) {
  _toolbarEl = el;
}
let _container = null;
function getContainer() {
  return _container;
}
function setContainer(c) {
  _container = c;
}
let _eventBus = null;
function getEventBus() {
  return _eventBus;
}
function setEventBus(eb) {
  _eventBus = eb;
}
let _cleanups = [];
function getCleanups() {
  return _cleanups;
}
function addCleanup(fn) {
  _cleanups.push(fn);
}
function clearCleanups() {
  _cleanups = [];
}
let _currentPanelId = null;
function getCurrentPanelId() {
  return _currentPanelId;
}
function setCurrentPanelId(id) {
  _currentPanelId = id;
}
let _isDarkTheme = true;
function isDarkTheme() {
  return _isDarkTheme;
}
function setIsDarkTheme(val) {
  _isDarkTheme = val;
}
let _isFullscreen = false;
function isFullscreen() {
  return _isFullscreen;
}
function setIsFullscreen(val) {
  _isFullscreen = val;
}
let _isSplitActive = false;
function isSplitActive() {
  return _isSplitActive;
}
function setIsSplitActive(val) {
  _isSplitActive = val;
}
let _frozen = false;
let _frozenDisabledSnapshot = null;
function isFrozen() {
  return _frozen;
}
function freeze() {
  if (_frozen) return false;
  _frozen = true;
  _frozenDisabledSnapshot = /* @__PURE__ */ new Map();
  if (_toolbarEl) {
    const buttons = _toolbarEl.querySelectorAll(".features-toolbar__btn");
    for (let i = 0; i < buttons.length; i++) {
      _frozenDisabledSnapshot.set(buttons[i].id, buttons[i].disabled);
      buttons[i].disabled = true;
    }
  }
  if (_eventBus && _eventBus.emit) {
    _eventBus.emit("toolbar.frozen", {
      source: "features-toolbar",
      timestamp: Date.now()
    });
  }
  return true;
}
function unfreeze() {
  if (!_frozen) return false;
  _frozen = false;
  if (_toolbarEl && _frozenDisabledSnapshot) {
    const buttons = _toolbarEl.querySelectorAll(".features-toolbar__btn");
    for (let i = 0; i < buttons.length; i++) {
      const wasDisabled = _frozenDisabledSnapshot.get(buttons[i].id);
      if (wasDisabled !== void 0) {
        buttons[i].disabled = wasDisabled;
      } else {
        buttons[i].disabled = !_actions.has(buttons[i].id.replace("ft-btn-", ""));
      }
    }
  }
  _frozenDisabledSnapshot = null;
  if (_eventBus && _eventBus.emit) {
    _eventBus.emit("toolbar.unfrozen", {
      source: "features-toolbar",
      timestamp: Date.now()
    });
  }
  return true;
}
const _actions = /* @__PURE__ */ new Map();
const _handlerFirstErrors = /* @__PURE__ */ new Map();
const _providerFirstErrors = /* @__PURE__ */ new Map();
const ACTION_TIMEOUT_MS = 5e3;
const _pendingAsyncActions = /* @__PURE__ */ new Set();
const _KNOWN_BUTTON_IDS = [
  "back",
  "forward",
  "refresh",
  "search",
  "command",
  "split",
  "fullscreen",
  "zoomOut",
  "zoomReset",
  "zoomIn",
  "bookmark",
  "export",
  "print",
  "theme",
  "a11y",
  "tour",
  "offline",
  "tabs",
  "layout",
  "devtools",
  "clipboard",
  "screenshot",
  "wakeLock",
  "history"
];
const _KNOWN_DROPDOWN_IDS = [
  "history",
  "export",
  "a11y",
  "layout",
  "clipboard-copy-url",
  "clipboard-copy-content",
  "screenshot-png",
  "screenshot-pdf"
];
const _KNOWN_ACTION_IDS = [
  "history-back-all",
  "history-clear",
  "export-png",
  "export-jpeg",
  "export-pdf",
  "export-svg",
  "a11y-font-increase",
  "a11y-font-decrease",
  "a11y-high-contrast",
  "a11y-focus-mode",
  "layout-default",
  "layout-compact",
  "layout-wide"
];
let _previousActionKeys = [];
function snapshotActions() {
  _previousActionKeys = Array.from(_actions.keys());
}
function detectActionLoss() {
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
const _dynamicGroups = /* @__PURE__ */ new Map();
function registerDynamicGroup(groupId, groupDef) {
  if (!groupId || !groupDef || typeof groupDef !== "object") return false;
  if (!groupDef.label || !Array.isArray(groupDef.buttons) || groupDef.buttons.length === 0) return false;
  _dynamicGroups.set(groupId, Object.assign({ id: groupId }, groupDef));
  return true;
}
function unregisterDynamicGroup(groupId) {
  return _dynamicGroups.delete(groupId);
}
function getDynamicGroups() {
  const groups = [];
  _dynamicGroups.forEach((g) => {
    groups.push(g);
  });
  return groups;
}
function getDynamicGroup(groupId) {
  return _dynamicGroups.get(groupId) || null;
}
const _hooks = /* @__PURE__ */ new Map();
function registerHook(buttonId, phase, fn) {
  if (typeof fn !== "function") return false;
  if (phase !== "before" && phase !== "after") return false;
  if (!_hooks.has(buttonId)) {
    _hooks.set(buttonId, { before: [], after: [] });
  }
  const entry = _hooks.get(buttonId);
  if (entry[phase].indexOf(fn) === -1) {
    entry[phase].push(fn);
  }
  return true;
}
function unregisterHook(buttonId, phase, fn) {
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
function getRegisteredHooks() {
  const result = {};
  _hooks.forEach((entry, id) => {
    result[id] = { before: entry.before.length, after: entry.after.length };
  });
  return result;
}
function _runHooks(phase, buttonId, context) {
  let cancelled = false;
  const hookSets = [];
  if (_hooks.has("*")) hookSets.push(_hooks.get("*")[phase]);
  if (_hooks.has(buttonId)) hookSets.push(_hooks.get(buttonId)[phase]);
  for (let s = 0; s < hookSets.length; s++) {
    const set = hookSets[s];
    if (!set) continue;
    for (let i = 0; i < set.length; i++) {
      try {
        const hookResult = set[i](context);
        if (phase === "before" && hookResult && hookResult.cancel === true) {
          cancelled = true;
        }
      } catch (e) {
        if (typeof console !== "undefined" && console.log) {
          console.debug(`[features-toolbar] Hook error (${phase}/${buttonId}):`, e.message || e);
        }
      }
    }
  }
  return { cancelled };
}
function registerAction(buttonId, handler) {
  if (typeof handler !== "function") return false;
  _actions.set(buttonId, handler);
  _handlerFirstErrors.delete(buttonId);
  _syncButtonEnabled(buttonId, true);
  if (_KNOWN_BUTTON_IDS.indexOf(buttonId) === -1 && _KNOWN_DROPDOWN_IDS.indexOf(buttonId) === -1 && _KNOWN_ACTION_IDS.indexOf(buttonId) === -1) {
    if (typeof console !== "undefined" && console.debug) {
      console.debug(`[features-toolbar] registerAction: "${buttonId}" not in known catalog.`);
    }
  }
  return true;
}
function registerActions(actionsMap) {
  if (!actionsMap || typeof actionsMap !== "object") return 0;
  let count = 0;
  const entries = Object.entries(actionsMap);
  for (let i = 0; i < entries.length; i++) {
    if (registerAction(entries[i][0], entries[i][1])) count++;
  }
  return count;
}
function unregisterAction(buttonId) {
  const existed = _actions.delete(buttonId);
  if (existed) {
    _handlerFirstErrors.delete(buttonId);
    _syncButtonEnabled(buttonId, false);
  }
  return existed;
}
function executeAction(buttonId, event, btnEl) {
  if (_frozen) {
    return { ok: false, error: "toolbar_frozen" };
  }
  const handler = _actions.get(buttonId);
  if (!handler) return { ok: false, error: "no_action_registered" };
  const hookContext = { buttonId, event, btnEl };
  const beforeResult = _runHooks("before", buttonId, hookContext);
  if (beforeResult.cancelled) {
    _emitActionEvent("toolbar:action:cancelled", buttonId);
    return { ok: false, cancelled: true };
  }
  let result;
  try {
    result = handler(event, btnEl);
  } catch (error) {
    _handleActionError(buttonId, error, btnEl);
    hookContext.error = error.message;
    _runHooks("after", buttonId, hookContext);
    return { ok: false, error: error.message };
  }
  if (result && typeof result.then === "function") {
    _handleAsyncAction(buttonId, result, btnEl, hookContext);
    return { ok: true, async: true };
  }
  _emitActionEvent("toolbar:action:executed", buttonId);
  hookContext.success = true;
  _runHooks("after", buttonId, hookContext);
  return { ok: true };
}
function _handleAsyncAction(buttonId, promise, btnEl, hookContext) {
  if (btnEl) btnEl.classList.add("features-toolbar__btn--loading");
  let timedOut = false;
  _pendingAsyncActions.add(buttonId);
  const timeoutId = setTimeout(() => {
    timedOut = true;
    _pendingAsyncActions.delete(buttonId);
    if (btnEl) btnEl.classList.remove("features-toolbar__btn--loading");
    _handleActionError(buttonId, new Error(`Action timeout (${ACTION_TIMEOUT_MS}ms)`), btnEl);
    _emitActionEvent("toolbar:action:timeout", buttonId);
    hookContext.error = "timeout";
    _runHooks("after", buttonId, hookContext);
  }, ACTION_TIMEOUT_MS);
  promise.then(() => {
    if (timedOut) return;
    clearTimeout(timeoutId);
    _pendingAsyncActions.delete(buttonId);
    if (btnEl) btnEl.classList.remove("features-toolbar__btn--loading");
    if (!_actions.has(buttonId)) {
      if (typeof console !== "undefined" && console.debug) {
        console.debug(`[features-toolbar] Async action "${buttonId}" completed but was unregistered during execution.`);
      }
      return;
    }
    _emitActionEvent("toolbar:action:executed", buttonId);
    hookContext.success = true;
    _runHooks("after", buttonId, hookContext);
  }).catch((error) => {
    if (timedOut) return;
    clearTimeout(timeoutId);
    _pendingAsyncActions.delete(buttonId);
    if (btnEl) btnEl.classList.remove("features-toolbar__btn--loading");
    if (!_actions.has(buttonId)) {
      if (typeof console !== "undefined" && console.debug) {
        console.debug(`[features-toolbar] Async action "${buttonId}" failed but was unregistered during execution.`);
      }
      return;
    }
    const normalizedError = _normalizeError(error);
    _handleActionError(buttonId, normalizedError, btnEl);
    hookContext.error = normalizedError.message;
    _runHooks("after", buttonId, hookContext);
  });
}
function _normalizeError(error) {
  if (error instanceof Error) return error;
  if (typeof error === "string") return { message: error };
  if (error && typeof error === "object" && error.message) return error;
  return { message: String(error || "Unknown error") };
}
function _handleActionError(buttonId, error, btnEl) {
  if (btnEl) {
    btnEl.classList.add("features-toolbar__btn--error");
    setTimeout(() => {
      btnEl.classList.remove("features-toolbar__btn--error");
    }, 200);
  }
  const errorMsg = error && error.message || String(error || "Unknown error");
  if (!_handlerFirstErrors.has(buttonId)) {
    _handlerFirstErrors.set(buttonId, { error: errorMsg, timestamp: Date.now() });
    if (typeof console !== "undefined" && console.log) {
      console.debug(`[features-toolbar] First error for action "${buttonId}":`, errorMsg);
    }
  }
  _emitActionEvent("toolbar:action:failed", buttonId, errorMsg);
}
function hasAction(buttonId) {
  return _actions.has(buttonId);
}
function getRegisteredActions() {
  return Array.from(_actions.keys());
}
function getActionErrors() {
  const errors = {};
  _handlerFirstErrors.forEach((val, key) => {
    errors[key] = val;
  });
  return errors;
}
const _stateProviders = /* @__PURE__ */ new Map();
function registerStateProvider(buttonId, provider) {
  if (typeof provider !== "function") return false;
  _stateProviders.set(buttonId, provider);
  _providerFirstErrors.delete(buttonId);
  return true;
}
function unregisterStateProvider(buttonId) {
  _providerFirstErrors.delete(buttonId);
  return _stateProviders.delete(buttonId);
}
function getButtonState(buttonId) {
  const provider = _stateProviders.get(buttonId);
  if (!provider) return null;
  try {
    return provider();
  } catch (e) {
    if (!_providerFirstErrors.has(buttonId)) {
      _providerFirstErrors.set(buttonId, {
        error: e && e.message || String(e),
        timestamp: Date.now()
      });
      if (typeof console !== "undefined" && console.log) {
        console.debug(`[features-toolbar] First error for stateProvider "${buttonId}":`, e.message || e);
      }
    }
    return null;
  }
}
function getRegisteredStateProviders() {
  return Array.from(_stateProviders.keys());
}
function _syncButtonEnabled(buttonId, enabled) {
  if (typeof document === "undefined") return;
  if (_frozen) return;
  let btn = null;
  if (_toolbarEl) {
    btn = _toolbarEl.querySelector(`#ft-btn-${buttonId}`);
  }
  if (!btn) {
    btn = document.getElementById(`ft-btn-${buttonId}`);
  }
  if (!btn) return;
  btn.disabled = !enabled;
}
function _emitActionEvent(eventName, buttonId, error) {
  if (!_eventBus || !_eventBus.emit) return;
  _eventBus.emit(eventName, {
    buttonId,
    timestamp: Date.now(),
    source: "features-toolbar",
    error: error || null
  });
}
function resetAll() {
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
export {
  MODULE_ID,
  VERSION,
  addCleanup,
  clearCleanups,
  detectActionLoss,
  executeAction,
  freeze,
  getActionErrors,
  getButtonState,
  getCleanups,
  getContainer,
  getCurrentPanelId,
  getDynamicGroup,
  getDynamicGroups,
  getEventBus,
  getRegisteredActions,
  getRegisteredHooks,
  getRegisteredStateProviders,
  getToolbarEl,
  hasAction,
  isDarkTheme,
  isFrozen,
  isFullscreen,
  isInitialized,
  isSplitActive,
  registerAction,
  registerActions,
  registerDynamicGroup,
  registerHook,
  registerStateProvider,
  resetAll,
  setContainer,
  setCurrentPanelId,
  setEventBus,
  setInitialized,
  setIsDarkTheme,
  setIsFullscreen,
  setIsSplitActive,
  setToolbarEl,
  snapshotActions,
  unfreeze,
  unregisterAction,
  unregisterDynamicGroup,
  unregisterHook,
  unregisterStateProvider
};

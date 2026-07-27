const VERSION = "1.1.0-SHELL-CSS";
const MODULE_ID = "main.ui.container-main.utils.features-toolbar.api";
import {
  isInitialized,
  setInitialized,
  getToolbarEl,
  setToolbarEl,
  setContainer,
  getEventBus,
  setEventBus,
  getCleanups,
  clearCleanups,
  registerAction,
  registerActions,
  unregisterAction,
  hasAction,
  getRegisteredActions,
  getActionErrors,
  registerStateProvider,
  unregisterStateProvider,
  getRegisteredStateProviders,
  registerHook,
  unregisterHook,
  getRegisteredHooks,
  registerDynamicGroup,
  unregisterDynamicGroup,
  getDynamicGroups,
  snapshotActions,
  getButtonState,
  executeAction,
  isFrozen,
  freeze as _freezeState,
  unfreeze as _unfreezeState,
  resetAll
} from "./state.js";
import { _buildToolbar, _appendDynamicGroup } from "./ui/builder.js";
import { _updateButtonStates } from "./ui/state-updater.js";
import { _injectStyles, _updateTooltipDelay } from "./styles.js";
import { _setupEventListeners, resetRewireState } from "./events/listeners.js";
import { resetThrottles } from "./helpers/dom.js";
import {
  BUTTON_IDS,
  DROPDOWN_IDS,
  ALL_BUTTON_IDS,
  ALL_DROPDOWN_IDS,
  GROUPS,
  GROUP_ORDER,
  getConfig,
  setConfig as _setConfigInternal,
  getAllConfig
} from "./constants.js";
const Logger = typeof window !== "undefined" && window.Logger || { debug() {
}, info() {
}, warn() {
}, error() {
} };
const VISIBILITY_STORAGE_KEY = "ft-toolbar-visible";
const STORAGE_SCHEMA_VERSION = 1;
function _saveVisibility(visible) {
  try {
    localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify({
      v: STORAGE_SCHEMA_VERSION,
      visible
    }));
  } catch (e) {
  }
}
function _loadVisibility() {
  try {
    const raw = localStorage.getItem(VISIBILITY_STORAGE_KEY);
    if (raw === null) return true;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && typeof parsed.v === "number") {
        return parsed.visible !== false;
      }
    } catch (_parseErr) {
    }
    if (raw === "0") {
      _saveVisibility(false);
      return false;
    }
    _saveVisibility(true);
    return true;
  } catch (e) {
    return true;
  }
}
let _pollingIntervalId = null;
const POLLING_INTERVAL_MS = 2e3;
let _visibilityListenerAdded = false;
function _startPolling() {
  if (_pollingIntervalId !== null) return;
  _pollingIntervalId = setInterval(() => {
    if (document.hidden) return;
    const toolbar = getToolbarEl();
    if (!toolbar || toolbar.style.display === "none") return;
    if (isInitialized()) {
      _updateButtonStates();
    }
  }, POLLING_INTERVAL_MS);
  if (!_visibilityListenerAdded) {
    _visibilityListenerAdded = true;
    document.addEventListener("visibilitychange", _onVisibilityChange);
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
    document.removeEventListener("visibilitychange", _onVisibilityChange);
    _visibilityListenerAdded = false;
  }
}
function init(containerEl, eventBus) {
  if (isInitialized()) {
    Logger.debug("[features-toolbar] Already initialized, skipping.");
    return;
  }
  if (!containerEl || !(containerEl instanceof HTMLElement)) {
    Logger.debug("[features-toolbar] init() aborted: containerEl is not a valid HTMLElement.");
    return;
  }
  Logger.debug("[features-toolbar] Initializing...");
  if (eventBus && eventBus.emit) {
    eventBus.emit("toolbar.initializing", { source: "features-toolbar", timestamp: Date.now() });
  }
  setContainer(containerEl);
  setEventBus(eventBus);
  _injectStyles();
  const toolbar = _buildToolbar();
  setToolbarEl(toolbar);
  toolbar.classList.add("features-toolbar--loading");
  const header = containerEl.querySelector(".dsd-container__header");
  if (header) {
    const controls = header.querySelector(".dsd-container__controls");
    if (controls) {
      header.insertBefore(toolbar, controls);
    } else {
      header.appendChild(toolbar);
    }
  } else {
    containerEl.prepend(toolbar);
  }
  toolbar.classList.add("features-toolbar--entering");
  setTimeout(() => {
    toolbar.classList.remove("features-toolbar--entering");
  }, 300);
  const savedVisibility = _loadVisibility();
  if (!savedVisibility) {
    toolbar.style.display = "none";
  }
  _setupEventListeners();
  _updateButtonStates();
  setInitialized(true);
  snapshotActions();
  requestAnimationFrame(() => {
    toolbar.classList.remove("features-toolbar--loading");
  });
  _startPolling();
  if (eventBus && eventBus.emit) {
    eventBus.emit("toolbar.initialized", {
      source: "features-toolbar",
      buttonCount: toolbar.querySelectorAll(".features-toolbar__btn").length,
      groups: GROUP_ORDER.length,
      timestamp: Date.now()
    });
  }
  Logger.debug("[features-toolbar] Initialized successfully.");
}
function destroy() {
  if (!isInitialized()) return;
  Logger.debug("[features-toolbar] Destroying...");
  _stopPolling();
  const cleanups = getCleanups();
  for (let i = 0; i < cleanups.length; i++) {
    try {
      cleanups[i]();
    } catch (e) {
    }
  }
  clearCleanups();
  const toolbar = getToolbarEl();
  if (toolbar && toolbar.parentNode) {
    toolbar.parentNode.removeChild(toolbar);
  }
  const style = document.getElementById("features-toolbar-styles");
  if (style) style.remove();
  const cssLink = document.getElementById("features-toolbar-css");
  if (cssLink) cssLink.remove();
  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    eventBus.emit("toolbar.destroyed", { source: "features-toolbar", timestamp: Date.now() });
  }
  resetThrottles();
  resetRewireState();
  resetAll();
  Logger.debug("[features-toolbar] Destroyed.");
}
function show() {
  const toolbar = getToolbarEl();
  if (toolbar) {
    toolbar.style.display = "";
    _saveVisibility(true);
  }
}
function hide() {
  const toolbar = getToolbarEl();
  if (toolbar) {
    toolbar.style.display = "none";
    _saveVisibility(false);
  }
}
function toggle() {
  const toolbar = getToolbarEl();
  if (!toolbar) return;
  const isHidden = toolbar.style.display === "none";
  if (isHidden) {
    show();
  } else {
    hide();
  }
  return isHidden;
}
function isVisible() {
  const toolbar = getToolbarEl();
  if (!toolbar) return false;
  return toolbar.style.display !== "none";
}
function freeze() {
  if (!isInitialized()) return;
  _freezeState();
  _stopPolling();
  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    eventBus.emit("toolbar.frozen", { source: "features-toolbar", timestamp: Date.now() });
  }
  Logger.debug("[features-toolbar] Frozen.");
}
function unfreeze() {
  if (!isInitialized()) return;
  _unfreezeState();
  _startPolling();
  _updateButtonStates();
  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    eventBus.emit("toolbar.unfrozen", { source: "features-toolbar", timestamp: Date.now() });
  }
  Logger.debug("[features-toolbar] Unfrozen.");
}
function setConfig(key, value) {
  _setConfigInternal(key, value);
  _updateTooltipDelay(getConfig("tooltipDelay"));
  _updateButtonStates();
}
function registerGroup(groupId, groupDef) {
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
    eventBus.emit("toolbar.group.added", {
      source: "features-toolbar",
      groupId,
      buttonCount: groupDef.buttons.length,
      timestamp: Date.now()
    });
  }
  return true;
}
function unregisterGroup(groupId) {
  const removed = unregisterDynamicGroup(groupId);
  if (!removed) return false;
  const toolbar = getToolbarEl();
  if (toolbar) {
    const groupEl = toolbar.querySelector(`[data-group-id="${groupId}"]`);
    if (groupEl && groupEl.parentNode) {
      groupEl.parentNode.removeChild(groupEl);
    }
  }
  Logger.debug(`[features-toolbar] Dynamic group unregistered: ${groupId}`);
  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    eventBus.emit("toolbar.group.removed", {
      source: "features-toolbar",
      groupId,
      timestamp: Date.now()
    });
  }
  return true;
}
function executeActionPublic(buttonId, event) {
  if (!isInitialized()) return { ok: false, error: "not_initialized" };
  if (!hasAction(buttonId)) return { ok: false, error: "no_action" };
  let btn = null;
  const toolbar = getToolbarEl();
  if (toolbar) {
    btn = toolbar.querySelector(`#ft-btn-${buttonId}`) || toolbar.querySelector(`[data-button-id="${buttonId}"]`);
  }
  try {
    const result = executeAction(buttonId, event, btn);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}
function updateButtonStates() {
  _updateButtonStates();
}
function refresh() {
  if (!isInitialized()) return;
  _updateButtonStates();
}
function _getDetailedButtonHealth() {
  const buttons = {};
  const toolbar = getToolbarEl();
  ALL_BUTTON_IDS.forEach((buttonId) => {
    const btnEl = toolbar ? toolbar.querySelector(`#ft-btn-${buttonId}`) : null;
    const state = getButtonState(buttonId);
    buttons[buttonId] = {
      inDOM: !!btnEl,
      hasAction: hasAction(buttonId),
      hasStateProvider: getRegisteredStateProviders().indexOf(buttonId) !== -1,
      // @ts-expect-error TS migration - TS2339
      enabled: btnEl ? !btnEl.disabled : false,
      active: btnEl ? btnEl.classList.contains("features-toolbar__btn--active") : false,
      skeleton: btnEl ? btnEl.classList.contains("features-toolbar__btn--skeleton") : false,
      currentState: state || null
    };
  });
  return buttons;
}
function _getGroupsHealth() {
  const toolbar = getToolbarEl();
  const groups = {};
  GROUP_ORDER.forEach((groupId) => {
    const groupEl = toolbar ? toolbar.querySelector(`[data-group-id="${groupId}"]`) : null;
    groups[groupId] = {
      type: "static",
      inDOM: !!groupEl,
      // @ts-expect-error TS migration - TS2339
      visible: groupEl ? groupEl.style.display !== "none" : false,
      buttonCount: groupEl ? groupEl.querySelectorAll(".features-toolbar__btn").length : 0
    };
  });
  const dynamicGroupsList = getDynamicGroups();
  dynamicGroupsList.forEach((g) => {
    const groupEl = toolbar ? toolbar.querySelector(`[data-group-id="${g.id}"]`) : null;
    groups[g.id] = {
      type: "dynamic",
      label: g.label,
      inDOM: !!groupEl,
      // @ts-expect-error TS migration - TS2339
      visible: groupEl ? groupEl.style.display !== "none" : false,
      buttonCount: groupEl ? groupEl.querySelectorAll(".features-toolbar__btn").length : 0
    };
  });
  return groups;
}
function info() {
  const toolbar = getToolbarEl();
  return {
    initialized: isInitialized(),
    visible: toolbar ? toolbar.style.display !== "none" : false,
    frozen: isFrozen(),
    buttonCount: toolbar ? toolbar.querySelectorAll(".features-toolbar__btn").length : 0,
    registeredActions: getRegisteredActions(),
    registeredStateProviders: getRegisteredStateProviders(),
    registeredHooks: getRegisteredHooks(),
    dynamicGroups: getDynamicGroups().map((g) => g.id),
    actionErrors: getActionErrors(),
    config: getAllConfig(),
    pollingActive: _pollingIntervalId !== null,
    storageSchema: STORAGE_SCHEMA_VERSION
  };
}
function healthCheck() {
  const toolbar = getToolbarEl();
  const registeredActionsList = getRegisteredActions();
  const totalButtons = ALL_BUTTON_IDS.length;
  const wiredButtons = registeredActionsList.filter((id) => ALL_BUTTON_IDS.indexOf(id) !== -1).length;
  const dropdownActions = registeredActionsList.filter((id) => ALL_DROPDOWN_IDS.indexOf(id) !== -1).length;
  const overflowEl = toolbar ? toolbar.querySelector("#ft-overflow") : null;
  const overflowActive = overflowEl ? overflowEl.style.display !== "none" : false;
  return {
    status: isInitialized() ? "healthy" : "not_initialized",
    initialized: isInitialized(),
    inDOM: toolbar ? document.contains(toolbar) : false,
    visible: toolbar ? toolbar.style.display !== "none" : false,
    frozen: isFrozen(),
    totalButtons,
    wiredButtons,
    wiredDropdownItems: dropdownActions,
    wiredPercentage: totalButtons > 0 ? `${Math.round(wiredButtons / totalButtons * 100)}%` : "0%",
    buttons: _getDetailedButtonHealth(),
    groups: _getGroupsHealth(),
    overflow: {
      active: overflowActive,
      hiddenGroups: overflowActive && overflowEl ? overflowEl.querySelectorAll(".features-toolbar__overflow-header").length : 0
    },
    registeredHooks: getRegisteredHooks(),
    actionErrors: getActionErrors(),
    config: getAllConfig(),
    pollingActive: _pollingIntervalId !== null,
    storageSchema: STORAGE_SCHEMA_VERSION
  };
}
export {
  ALL_BUTTON_IDS,
  ALL_DROPDOWN_IDS,
  BUTTON_IDS,
  DROPDOWN_IDS,
  GROUPS,
  GROUP_ORDER,
  MODULE_ID,
  VERSION,
  destroy,
  executeActionPublic,
  freeze,
  getRegisteredActions,
  hasAction,
  healthCheck,
  hide,
  info,
  init,
  isVisible,
  refresh,
  registerAction,
  registerActions,
  registerGroup,
  registerHook,
  registerStateProvider,
  setConfig,
  show,
  toggle,
  unfreeze,
  unregisterAction,
  unregisterGroup,
  unregisterHook,
  unregisterStateProvider,
  updateButtonStates
};

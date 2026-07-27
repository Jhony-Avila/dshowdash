import { CONTAINER_MAIN_EVENTS } from "./constants.js";
import { createStateProxy, createStateEmitter, getInitialState } from "./state.js";
import { initComponents } from "../init-components.js";
import { destroyComponents } from "../container-factory/components/index.js";
import { buildContainerApi } from "../api-builder.js";
import { LIFECYCLE_HOOKS } from "../components/event-hooks.js";
import { VERSION, MODULE_ID } from "./constants.js";
function createContainerCore(config) {
  const { containerId, options, isAttachMode, eventBridge, labelResolver, eventBus, mode } = config;
  let _cleanups = [];
  let _currentPanelId = null;
  let _components = {};
  let _container = null;
  let _contentEl = null;
  let _api = null;
  const _emitStateChanged = createStateEmitter(eventBridge, containerId);
  const _onStateChange = (prop, newVal, oldVal, cId) => {
    _emitStateChanged(_state);
  };
  let _state = createStateProxy(getInitialState(isAttachMode), containerId, _onStateChange);
  function _setupRestoreListener() {
    const cleanup = eventBridge.subscribe(CONTAINER_MAIN_EVENTS.STATE_RESTORE, (data) => {
      if (data && data.containerId === containerId && data.state) {
        _applyRestoredState(data.state);
      }
    });
    _cleanups.push(cleanup);
  }
  function _setupNavigationSyncListener() {
    const cleanup = eventBridge.subscribe(CONTAINER_MAIN_EVENTS.NAVIGATION_SYNC, (data) => {
      if (data && data.panelId) {
        _onNavigationSync(data);
      }
    });
    _cleanups.push(cleanup);
  }
  function _onNavigationSync(data) {
    const panelId = data.panelId;
    const route = data.route;
    _currentPanelId = panelId;
    const label = labelResolver(panelId);
    if (_api && typeof _api.setTitle === "function") {
      _api.setTitle(label);
    }
    if (_components.breadcrumb && _components.breadcrumb.setItems) {
      const items = [{ id: "home", label: "In\xEDcio", href: "#/", panelId: "panel-cards" }];
      if (panelId !== "panel-cards") {
        items.push({ id: panelId, label, href: route || `#/${panelId}`, panelId });
      }
      _components.breadcrumb.setItems(items);
    }
  }
  function _resolveInitialPanelTitle() {
    try {
      const activePanelEl = _container?.querySelector("[data-panel-id]");
      const panelIdFromDom = activePanelEl?.getAttribute("data-panel-id");
      const hash = typeof location !== "undefined" ? location.hash : "";
      const panelIdFromHash = hash ? hash.replace("#/", "").split("/")[0] : null;
      const detectedPanelId = panelIdFromDom || panelIdFromHash || null;
      if (detectedPanelId && detectedPanelId !== _currentPanelId) {
        _onNavigationSync({
          panelId: detectedPanelId,
          route: hash || `#/${detectedPanelId}`
        });
      }
    } catch (e) {
    }
  }
  function _applyRestoredState(restoredState) {
    if (restoredState.collapsed !== void 0 && _state.collapsed !== restoredState.collapsed) {
      if (restoredState.collapsed) {
        _api?.collapse?.();
      } else {
        _api?.expand?.();
      }
    }
    if (restoredState.fullscreen !== void 0 && _state.fullscreen !== restoredState.fullscreen) {
      _api?.fullscreen?.(restoredState.fullscreen);
    }
    if (restoredState.minimized !== void 0 && _state.minimized !== restoredState.minimized) {
      _state.minimized = restoredState.minimized;
    }
  }
  function _handleUnmount() {
    _cleanups.forEach((fn) => {
      try {
        fn();
      } catch (e) {
      }
    });
    _cleanups = [];
    destroyComponents(_components);
  }
  function _postMount(container, contentEl, mountMode) {
    _container = container;
    _contentEl = contentEl;
    const initContext = {
      eventBus,
      storage: typeof localStorage !== "undefined" ? localStorage : null
    };
    _components = initComponents(_container, options, _state, initContext);
    _state.mounted = true;
    _container.setAttribute("data-state", "ready");
    _setupRestoreListener();
    _setupNavigationSyncListener();
    _components.eventHooks?.emit && _components.eventHooks.emit(LIFECYCLE_HOOKS.MOUNTED, { container: _container, mode: mountMode });
    options.onReady?.(_api);
    eventBridge.emit(CONTAINER_MAIN_EVENTS.READY, { containerId, mode: mountMode, diStrict: !!eventBus });
    Promise.resolve().then(() => {
      _resolveInitialPanelTitle();
    });
  }
  function _buildApi(extraMethods = {}) {
    const baseApi = buildContainerApi({
      // @ts-expect-error strict migration — TS2322
      container: _container,
      containerId,
      options,
      state: _state,
      components: _components,
      version: VERSION,
      moduleId: MODULE_ID,
      onUnmount: _handleUnmount,
      mode,
      eventBus
    });
    _api = {
      ...baseApi,
      getCurrentPanelId() {
        return _currentPanelId;
      },
      getContainer() {
        return _container;
      },
      getContentEl() {
        return _contentEl;
      },
      isAttachMode() {
        return _state.attachMode;
      },
      hasDIEventBus() {
        return !!eventBus;
      },
      ...extraMethods
    };
    return _api;
  }
  return {
    getState: () => _state,
    getComponents: () => _components,
    getContainer: () => _container,
    getContentEl: () => _contentEl,
    postMount: _postMount,
    buildApi: _buildApi,
    getApi: () => _api
  };
}
export {
  createContainerCore
};

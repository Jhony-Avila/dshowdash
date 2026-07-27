import { createLogger } from "./utils/logger.js";
const logger = createLogger("container-factory");
import {
  VERSION,
  MODULE_ID,
  DEFAULT_OPTIONS,
  createLifecycleAPI,
  createStateAPI,
  createActionsAPI,
  createContentAPI,
  createLoadingAPI,
  createToastAPI,
  createUIAPI,
  createAccessibilityAPI,
  createEventsAPI,
  createDebugAPI,
  createGettersAPI,
  info,
  healthCheck
} from "./container-factory/index.js";
function createContainer(targetElement, userOptions = {}) {
  const target = typeof targetElement === "string" ? document.querySelector(targetElement) : targetElement;
  if (!target) {
    logger.warn("Target element not found, using document.body");
  }
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  const containerId = options.id || `dsd-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const state = {
    mounted: false,
    collapsed: false,
    fullscreen: false,
    minimized: false,
    loading: false,
    error: null,
    attachMode: false
  };
  const refs = {
    target,
    container: null,
    contentEl: null,
    eventBus: null
  };
  let components = {};
  const getComponents = () => components;
  const setComponents = (c) => {
    components = c;
  };
  const context = {
    containerId,
    options,
    state,
    refs,
    getComponents,
    setComponents
  };
  const lifecycleAPI = createLifecycleAPI(context);
  const stateAPI = createStateAPI(context);
  const actionsAPI = createActionsAPI(context);
  const contentAPI = createContentAPI(context);
  const loadingAPI = createLoadingAPI(context);
  const toastAPI = createToastAPI(context);
  const uiAPI = createUIAPI(context);
  const accessibilityAPI = createAccessibilityAPI(context);
  const eventsAPI = createEventsAPI(context);
  const debugAPI = createDebugAPI(context);
  const gettersAPI = createGettersAPI(context);
  let containerApi;
  containerApi = {
    // Lifecycle
    mount: lifecycleAPI.mount.bind(containerApi),
    unmount: lifecycleAPI.unmount.bind(containerApi),
    // State
    ...stateAPI,
    // Actions
    collapse: actionsAPI.collapse.bind(containerApi),
    expand: actionsAPI.expand.bind(containerApi),
    toggle: actionsAPI.toggle.bind(containerApi),
    fullscreen: actionsAPI.fullscreen.bind(containerApi),
    close: actionsAPI.close.bind(containerApi),
    // Content
    setContent: contentAPI.setContent.bind(containerApi),
    getContent: contentAPI.getContent,
    setTitle: contentAPI.setTitle.bind(containerApi),
    setIcon: contentAPI.setIcon.bind(containerApi),
    // Loading
    showLoading: loadingAPI.showLoading.bind(containerApi),
    hideLoading: loadingAPI.hideLoading.bind(containerApi),
    setProgress: loadingAPI.setProgress.bind(containerApi),
    // Toast
    ...toastAPI,
    // UI (Badge, Toolbar, Zoom)
    setBadge: uiAPI.setBadge.bind(containerApi),
    clearBadge: uiAPI.clearBadge.bind(containerApi),
    setToolbarItems: uiAPI.setToolbarItems.bind(containerApi),
    addToolbarItem: uiAPI.addToolbarItem.bind(containerApi),
    zoomIn: uiAPI.zoomIn.bind(containerApi),
    zoomOut: uiAPI.zoomOut.bind(containerApi),
    setZoom: uiAPI.setZoom.bind(containerApi),
    resetZoom: uiAPI.resetZoom.bind(containerApi),
    getZoom: uiAPI.getZoom,
    // Accessibility
    announce: accessibilityAPI.announce.bind(containerApi),
    focusFirst: accessibilityAPI.focusFirst.bind(containerApi),
    enableFocusTrap: accessibilityAPI.enableFocusTrap.bind(containerApi),
    disableFocusTrap: accessibilityAPI.disableFocusTrap.bind(containerApi),
    // Events
    on: eventsAPI.on.bind(containerApi),
    off: eventsAPI.off.bind(containerApi),
    emit: eventsAPI.emit.bind(containerApi),
    // Debug
    debug: debugAPI.debug,
    // Getters
    getElement: gettersAPI.getElement,
    getId: gettersAPI.getId,
    getOptions: gettersAPI.getOptions,
    getComponent: gettersAPI.getComponent,
    healthCheck: gettersAPI.healthCheck
  };
  return containerApi;
}
var container_factory_default = { createContainer, info, healthCheck, VERSION, MODULE_ID, DEFAULT_OPTIONS };
export {
  DEFAULT_OPTIONS,
  MODULE_ID,
  VERSION,
  createContainer,
  container_factory_default as default,
  healthCheck,
  info
};

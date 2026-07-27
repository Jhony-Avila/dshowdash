// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-factory
// PURPOSE: Container Factory - Factory Unificada para Criação de Containers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./utils/logger.js
//   VERSION, MODULE_ID, DEFAULT_OPTIONS, createLifecycleAPI, createStateAPI, crea...
//
// PROVIDES:
//   createContainer() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   info — exported value
//   healthCheck — exported value
//   DEFAULT_OPTIONS — exported value
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
import { createLogger } from './utils/logger.js';
const logger = createLogger('container-factory');

import {
  VERSION, MODULE_ID, DEFAULT_OPTIONS,
  createLifecycleAPI, createStateAPI, createActionsAPI, createContentAPI,
  createLoadingAPI, createToastAPI, createUIAPI, createAccessibilityAPI,
  createEventsAPI, createDebugAPI, createGettersAPI,
  info, healthCheck
} from './container-factory/index.js';

export { VERSION, MODULE_ID };

export function createContainer(targetElement: unknown, userOptions: Record<string, unknown> = {}) {
  // Validar target
  const target = typeof targetElement === 'string'
    ? document.querySelector(targetElement)
    : targetElement;

  if (!target) {
    logger.warn('Target element not found, using document.body');
  }

  // Merge options
  const options = { ...DEFAULT_OPTIONS, ...userOptions };

  // Gerar ID único
  const containerId = options.id || `dsd-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // State
  const state = {
    mounted: false,
    collapsed: false,
    fullscreen: false,
    minimized: false,
    loading: false,
    error: null as Record<string, unknown> | null,
    attachMode: false
  };

  // Refs
  const refs = {
    target,
    container: null as HTMLElement | null,
    contentEl: null as HTMLElement | null,
    eventBus: null as Record<string, unknown> | null
  };

  // Components storage
  let components: Record<string, unknown> = {};
  const getComponents = () => components;
  const setComponents = (c: unknown) => { components = c as Record<string, unknown>; };

  // Context para APIs
  const context = {
    containerId,
    options,
    state,
    refs,
    getComponents,
    setComponents
  };

  // Criar APIs
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

  // Compor API final
  let containerApi: unknown;
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

export { info, healthCheck, DEFAULT_OPTIONS };

export default { createContainer, info, healthCheck, VERSION, MODULE_ID, DEFAULT_OPTIONS };

import { createLogger } from "../../utils/logger.js";
const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.components.component-initializer";
const logger = createLogger("container-factory:initializer");
import { createControls } from "../../components/controls.js";
import { createHeader } from "../../components/header.js";
import { createErrorBoundary } from "../../components/error-boundary.js";
import { createEventHooks, LIFECYCLE_HOOKS } from "../../components/event-hooks.js";
import { createConfigPresets } from "../../components/config-presets.js";
import { createContextMenu } from "../../components/context-menu.js";
import { createKeyboardHandler } from "../../components/keyboard-handler.js";
import { createDragHandler } from "../../components/drag-handler.js";
import { createResizeHandler } from "../../components/resize-handler.js";
import { createBreadcrumb } from "../../components/breadcrumb.js";
import { createSplitView } from "../../components/split-view.js";
import { createNotificationBadge } from "../../components/notification-badge.js";
import { createStatePersistence } from "../../components/state-persistence.js";
import { createToolbar } from "../../components/toolbar.js";
import { createSearchBox } from "../../components/search-box.js";
import { createProgressBar } from "../../components/progress-bar.js";
import { createToast } from "../../components/toast.js";
import { createSnapDock } from "../../components/snap-dock.js";
import { createZoomControls } from "../../components/zoom-controls.js";
import { createAccessibility } from "../../components/accessibility.js";
import { createDebugPanel } from "../../components/debug-panel.js";
function _safeInit(name, factory, container, config) {
  try {
    const component = factory(container, config);
    component?.init?.();
    return component;
  } catch (e) {
    logger.warn(`${name} init failed`, { error: e.message });
    return null;
  }
}
function initializeComponents(container, options, state, eventBus) {
  const components = {};
  if (options.errorBoundaryEnabled) {
    components.errorBoundary = _safeInit("ErrorBoundary", createErrorBoundary, container, {
      onError: options.onError,
      showFallback: true,
      eventBus
    });
  }
  if (options.eventHooksEnabled) {
    components.eventHooks = _safeInit("EventHooks", createEventHooks, container, {
      debugMode: options.debugEnabled
    });
  }
  components.configPresets = _safeInit("ConfigPresets", createConfigPresets, container, {
    defaultPreset: options.preset || "default"
  });
  components.header = _safeInit("Header", createHeader, container, {
    title: options.title,
    icon: options.icon
  });
  if (options.showControls) {
    components.controls = _safeInit("Controls", createControls, container, {
      collapsible: options.collapsible,
      closable: options.closable,
      fullscreenable: options.fullscreenable,
      eventBus,
      onCollapse: () => {
        state.collapsed = true;
        options.onCollapse?.();
      },
      onExpand: () => {
        state.collapsed = false;
        options.onExpand?.();
      },
      onClose: options.onClose,
      onFullscreen: (fs) => {
        state.fullscreen = fs;
        options.onFullscreen?.(fs);
      }
    });
  }
  if (options.contextMenuEnabled) {
    components.contextMenu = _safeInit("ContextMenu", createContextMenu, container, { eventBus });
  }
  if (options.keyboardEnabled) {
    components.keyboard = _safeInit("KeyboardHandler", createKeyboardHandler, container, { eventBus });
  }
  if (options.draggable) {
    components.drag = _safeInit("DragHandler", createDragHandler, container, {
      eventBus,
      onDragEnd: options.onDrag
    });
  }
  if (options.resizable) {
    components.resize = _safeInit("ResizeHandler", createResizeHandler, container, {
      eventBus,
      onResizeEnd: options.onResize
    });
  }
  if (options.breadcrumbEnabled) {
    components.breadcrumb = _safeInit("Breadcrumb", createBreadcrumb, container, { eventBus });
  }
  if (options.splitViewEnabled) {
    components.splitView = _safeInit("SplitView", createSplitView, container, { eventBus });
  }
  if (options.notificationBadgeEnabled) {
    components.notificationBadge = _safeInit("NotificationBadge", createNotificationBadge, container, { eventBus });
  }
  if (options.statePersistenceEnabled) {
    components.statePersistence = _safeInit("StatePersistence", createStatePersistence, container, { eventBus });
  }
  if (options.toolbarEnabled) {
    components.toolbar = _safeInit("Toolbar", createToolbar, container, {
      position: options.toolbarPosition,
      items: options.toolbarItems,
      eventBus
    });
  }
  if (options.searchEnabled) {
    components.searchBox = _safeInit("SearchBox", createSearchBox, container, {
      placeholder: options.searchPlaceholder,
      eventBus
    });
  }
  if (options.progressEnabled) {
    components.progressBar = _safeInit("ProgressBar", createProgressBar, container, { eventBus });
  }
  if (options.toastEnabled) {
    components.toast = _safeInit("Toast", createToast, container, {
      position: options.toastPosition,
      eventBus
    });
  }
  if (options.snapEnabled) {
    components.snapDock = _safeInit("SnapDock", createSnapDock, container, { eventBus });
  }
  if (options.zoomEnabled) {
    components.zoomControls = _safeInit("ZoomControls", createZoomControls, container, {
      minZoom: options.zoomMin,
      maxZoom: options.zoomMax,
      eventBus
    });
  }
  if (options.accessibilityEnabled) {
    components.accessibility = _safeInit("Accessibility", createAccessibility, container, {
      enableFocusTrap: options.accessibilityFocusTrap,
      announceChanges: options.accessibilityAnnounce
    });
  }
  if (options.debugEnabled) {
    components.debugPanel = _safeInit("DebugPanel", createDebugPanel, container, {
      startExpanded: options.debugStartExpanded,
      eventBus
    });
  }
  return components;
}
function destroyComponents(components) {
  Object.values(components).forEach((component) => {
    try {
      component?.destroy?.();
    } catch (e) {
    }
  });
}
var component_initializer_default = { initializeComponents, destroyComponents, LIFECYCLE_HOOKS };
export {
  LIFECYCLE_HOOKS,
  MODULE_ID,
  VERSION,
  component_initializer_default as default,
  destroyComponents,
  initializeComponents
};

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: component-initializer
// PURPOSE: Component Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../../utils/logger.js
//   createControls from ../../components/controls.js
//   createHeader from ../../components/header.js
//   createErrorBoundary from ../../components/error-boundary.js
//   createEventHooks, LIFECYCLE_HOOKS from ../../components/event-hooks.js
//   createConfigPresets from ../../components/config-presets.js
//   createContextMenu from ../../components/context-menu.js
//   createKeyboardHandler from ../../components/keyboard-handler.js
//   createDragHandler from ../../components/drag-handler.js
//   createResizeHandler from ../../components/resize-handler.js
//   createBreadcrumb from ../../components/breadcrumb.js
//   createSplitView from ../../components/split-view.js
//   createNotificationBadge from ../../components/notification-badge.js
//   createStatePersistence from ../../components/state-persistence.js
//   createToolbar from ../../components/toolbar.js
//   createSearchBox from ../../components/search-box.js
//   createProgressBar from ../../components/progress-bar.js
//   createToast from ../../components/toast.js
//   createSnapDock from ../../components/snap-dock.js
//   createZoomControls from ../../components/zoom-controls.js
//   createAccessibility from ../../components/accessibility.js
//   createDebugPanel from ../../components/debug-panel.js
//
// PROVIDES:
//   initializeComponents() — exported function
//   destroyComponents() — exported function
//   LIFECYCLE_HOOKS — exported value
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
import { createLogger } from '../../utils/logger.js';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.container-factory.components.component-initializer';
const logger = createLogger('container-factory:initializer');

import { createControls } from '../../components/controls.js';
import { createHeader } from '../../components/header.js';
import { createErrorBoundary } from '../../components/error-boundary.js';
import { createEventHooks, LIFECYCLE_HOOKS } from '../../components/event-hooks.js';
import { createConfigPresets } from '../../components/config-presets.js';
import { createContextMenu } from '../../components/context-menu.js';
import { createKeyboardHandler } from '../../components/keyboard-handler.js';
import { createDragHandler } from '../../components/drag-handler.js';
import { createResizeHandler } from '../../components/resize-handler.js';
import { createBreadcrumb } from '../../components/breadcrumb.js';
import { createSplitView } from '../../components/split-view.js';
import { createNotificationBadge } from '../../components/notification-badge.js';
import { createStatePersistence } from '../../components/state-persistence.js';
import { createToolbar } from '../../components/toolbar.js';
import { createSearchBox } from '../../components/search-box.js';
import { createProgressBar } from '../../components/progress-bar.js';
import { createToast } from '../../components/toast.js';
import { createSnapDock } from '../../components/snap-dock.js';
import { createZoomControls } from '../../components/zoom-controls.js';
import { createAccessibility } from '../../components/accessibility.js';
import { createDebugPanel } from '../../components/debug-panel.js';

export { LIFECYCLE_HOOKS };

function _safeInit(name: string, factory: (...args: unknown[]) => Record<string, unknown>, container: HTMLElement, config: Record<string, unknown>) {
  try {
    const component = factory(container, config);
    (component as Record<string, (...args: unknown[]) => unknown>)?.init?.();
    return component;
  } catch (e) {
    logger.warn(`${name} init failed`, { error: (e as Error).message });
    return null;
  }
}

export function initializeComponents(container: HTMLElement, options: Record<string, unknown>, state: Record<string, unknown>, eventBus: unknown) {
  const components: Record<string, unknown> = {};

  // Error Boundary (primeiro - para capturar erros dos outros)
  if (options.errorBoundaryEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.errorBoundary = _safeInit('ErrorBoundary', createErrorBoundary, container, {
      onError: options.onError,
      showFallback: true,
      eventBus
    });
  }

  // Event Hooks (segundo - para lifecycle)
  if (options.eventHooksEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.eventHooks = _safeInit('EventHooks', createEventHooks, container, {
      debugMode: options.debugEnabled
    });
  }

  // Config Presets
  // @ts-expect-error strict migration — TS2345
  components.configPresets = _safeInit('ConfigPresets', createConfigPresets, container, {
    defaultPreset: options.preset || 'default'
  });

  // Header
  // @ts-expect-error strict migration — TS2345
  components.header = _safeInit('Header', createHeader, container, {
    title: options.title,
    icon: options.icon
  });

  // Controls
  if (options.showControls) {
    // @ts-expect-error strict migration — TS2345
    components.controls = _safeInit('Controls', createControls, container, {
      collapsible: options.collapsible,
      closable: options.closable,
      fullscreenable: options.fullscreenable,
      eventBus,
      onCollapse: () => { state.collapsed = true; (options.onCollapse as (() => void) | undefined)?.(); },
      onExpand: () => { state.collapsed = false; (options.onExpand as (() => void) | undefined)?.(); },
      onClose: options.onClose,
      onFullscreen: (fs: unknown) => { state.fullscreen = fs; (options.onFullscreen as ((...a: unknown[]) => void) | undefined)?.(fs); }
    });
  }

  // Context Menu
  if (options.contextMenuEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.contextMenu = _safeInit('ContextMenu', createContextMenu, container, { eventBus });
  }

  // Keyboard Handler
  if (options.keyboardEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.keyboard = _safeInit('KeyboardHandler', createKeyboardHandler, container, { eventBus });
  }

  // Drag Handler
  if (options.draggable) {
    // @ts-expect-error strict migration — TS2345
    components.drag = _safeInit('DragHandler', createDragHandler, container, {
      eventBus,
      onDragEnd: options.onDrag
    });
  }

  // Resize Handler
  if (options.resizable) {
    // @ts-expect-error strict migration — TS2345
    components.resize = _safeInit('ResizeHandler', createResizeHandler, container, {
      eventBus,
      onResizeEnd: options.onResize
    });
  }

  // Breadcrumb
  if (options.breadcrumbEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.breadcrumb = _safeInit('Breadcrumb', createBreadcrumb, container, { eventBus });
  }

  // Split View
  if (options.splitViewEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.splitView = _safeInit('SplitView', createSplitView, container, { eventBus });
  }

  // Notification Badge
  if (options.notificationBadgeEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.notificationBadge = _safeInit('NotificationBadge', createNotificationBadge, container, { eventBus });
  }

  // State Persistence
  if (options.statePersistenceEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.statePersistence = _safeInit('StatePersistence', createStatePersistence, container, { eventBus });
  }

  // Toolbar
  if (options.toolbarEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.toolbar = _safeInit('Toolbar', createToolbar, container, {
      position: options.toolbarPosition,
      items: options.toolbarItems,
      eventBus
    });
  }

  // Search Box
  if (options.searchEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.searchBox = _safeInit('SearchBox', createSearchBox, container, {
      placeholder: options.searchPlaceholder,
      eventBus
    });
  }

  // Progress Bar
  if (options.progressEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.progressBar = _safeInit('ProgressBar', createProgressBar, container, { eventBus });
  }

  // Toast
  if (options.toastEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.toast = _safeInit('Toast', createToast, container, {
      position: options.toastPosition,
      eventBus
    });
  }

  // Snap/Dock
  if (options.snapEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.snapDock = _safeInit('SnapDock', createSnapDock, container, { eventBus });
  }

  // Zoom Controls
  if (options.zoomEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.zoomControls = _safeInit('ZoomControls', createZoomControls, container, {
      minZoom: options.zoomMin,
      maxZoom: options.zoomMax,
      eventBus
    });
  }

  // Accessibility
  if (options.accessibilityEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.accessibility = _safeInit('Accessibility', createAccessibility, container, {
      enableFocusTrap: options.accessibilityFocusTrap,
      announceChanges: options.accessibilityAnnounce
    });
  }

  // Debug Panel
  if (options.debugEnabled) {
    // @ts-expect-error strict migration — TS2345
    components.debugPanel = _safeInit('DebugPanel', createDebugPanel, container, {
      startExpanded: options.debugStartExpanded,
      eventBus
    });
  }

  return components;
}

export function destroyComponents(components: Record<string, unknown>) {
  Object.values(components).forEach(component => {
    try { (component as Record<string, (...args: unknown[]) => unknown>)?.destroy?.(); } catch (e) { /* ignore */ }
  });
}

export default { initializeComponents, destroyComponents, LIFECYCLE_HOOKS };

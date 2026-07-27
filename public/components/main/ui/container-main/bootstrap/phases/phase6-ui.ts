// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: phase6-ui
// PURPOSE: Phase 6 - UI/UX Managers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createNotificationManager from ../../utils/notification-manager.js
//   createFormValidator from ../../utils/form-validator.js
//   createStorageManager from ../../utils/storage-manager.js
//   createClipboardManager from ../../utils/clipboard-manager.js
//   createDragDropManager from ../../utils/drag-drop-manager.js
//   createModalManager from ../../utils/modal-manager.js
//   createTooltipManager from ../../utils/tooltip-manager.js
//   createContextMenuManager from ../../utils/context-menu-manager.js
//   createHotkeyManager from ../../utils/hotkey-manager.js
//   createScrollManager from ../../utils/scroll-manager.js
//   createFocusManager from ../../utils/focus-manager.js
//   createUndoManager from ../../utils/undo-manager.js
//   createThemeManager from ../../utils/theme-manager-v2.js
//   createAnimationManager from ../../utils/animation-manager-v2.js
//   createMediaQueryManager from ../../utils/media-query-manager.js
//   createIntersectionManager from ../../utils/intersection-manager.js
//   createResizeManager from ../../utils/resize-manager.js
//   createMutationManager from ../../utils/mutation-manager.js
//   registerLoaded from ../../core/dependency-map.js
//   getEnv, ENV from ../../config.js
//
// PROVIDES:
//   (none)
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

import { createNotificationManager } from '../../utils/notification-manager.js';
import { createFormValidator } from '../../utils/form-validator.js';
import { createStorageManager } from '../../utils/storage-manager.js';
import { createClipboardManager } from '../../utils/clipboard-manager.js';
import { createDragDropManager } from '../../utils/drag-drop-manager.js';
import { createModalManager } from '../../utils/modal-manager.js';
import { createTooltipManager } from '../../utils/tooltip-manager.js';
import { createContextMenuManager } from '../../utils/context-menu-manager.js';
import { createHotkeyManager } from '../../utils/hotkey-manager.js';
import { createScrollManager } from '../../utils/scroll-manager.js';
import { createFocusManager } from '../../utils/focus-manager.js';
import { createUndoManager } from '../../utils/undo-manager.js';
import { createThemeManager } from '../../utils/theme-manager-v2.js';
import { createAnimationManager } from '../../utils/animation-manager-v2.js';
import { createMediaQueryManager } from '../../utils/media-query-manager.js';
import { createIntersectionManager } from '../../utils/intersection-manager.js';
import { createResizeManager } from '../../utils/resize-manager.js';
import { createMutationManager } from '../../utils/mutation-manager.js';
import { registerLoaded } from '../../core/dependency-map.js';
import { getEnv, ENV } from '../../config.js';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap.phases.phase6-ui';

export async function initPhase6(context: Record<string, unknown>) {
  const config = context.config as Record<string, unknown>;
  const bootMetrics = context.bootMetrics as import("../types.js").ManagerRef | null;
  const logger = context.logger as import("../types.js").ManagerRef | null;
  
  bootMetrics?.startPhase('phase6');
  logger?.debug('Phase 6 starting...');
  
  let notificationManager = null, formValidator = null, storageManager = null;
  let clipboardManager = null, dragDropManager = null, modalManager = null;
  let tooltipManager = null, contextMenuManager = null, hotkeyManager = null;
  let scrollManager = null, focusManager = null, undoManager = null;
  let themeManager = null, animationManager = null, mediaQueryManager = null;
  let intersectionManager = null, resizeManager = null, mutationManager = null;
  
  // Core
  if (config.enableNotificationManager) {
    notificationManager = createNotificationManager({ position: 'top-right', maxVisible: 5 });
    registerLoaded('notification-manager');
  }
  if (config.enableFormValidator) {
    formValidator = createFormValidator({ validateOnBlur: true });
    registerLoaded('form-validator');
  }
  if (config.enableStorageManager) {
    storageManager = createStorageManager({ prefix: 'cm_', defaultStorage: 'local' });
    registerLoaded('storage-manager');
  }
  if (config.enableClipboardManager) {
    clipboardManager = createClipboardManager({});
    registerLoaded('clipboard-manager');
  }
  if (config.enableDragDropManager) {
    dragDropManager = createDragDropManager({});
    registerLoaded('drag-drop-manager');
  }
  if (config.enableModalManager) {
    modalManager = createModalManager({ closeOnEscape: true, closeOnBackdrop: true });
    registerLoaded('modal-manager');
  }
  
  // Extended
  if (config.enableTooltipManager) {
    tooltipManager = createTooltipManager({ position: 'top', showDelay: 200 });
    registerLoaded('tooltip-manager');
  }
  if (config.enableContextMenuManager) {
    contextMenuManager = createContextMenuManager({ theme: 'dark' });
    registerLoaded('context-menu-manager');
  }
  if (config.enableHotkeyManager) {
    hotkeyManager = createHotkeyManager({ debug: getEnv() === ENV.DEVELOPMENT });
    registerLoaded('hotkey-manager');
  }
  if (config.enableScrollManager) {
    scrollManager = createScrollManager({ throttleMs: 100 });
    registerLoaded('scroll-manager');
  }
  if (config.enableFocusManager) {
    focusManager = createFocusManager({ autoFocus: true });
    registerLoaded('focus-manager');
  }
  if (config.enableUndoManager) {
    undoManager = createUndoManager({ maxHistory: 100 });
    registerLoaded('undo-manager');
  }
  
  // Advanced
  if (config.enableThemeManager) {
    themeManager = createThemeManager({ defaultTheme: 'system' });
    registerLoaded('theme-manager-v2');
  }
  if (config.enableAnimationManager) {
    animationManager = createAnimationManager({ respectReducedMotion: true });
    registerLoaded('animation-manager-v2');
  }
  if (config.enableMediaQueryManager) {
    mediaQueryManager = createMediaQueryManager({ debounceMs: 100 });
    registerLoaded('media-query-manager');
  }
  if (config.enableIntersectionManager) {
    intersectionManager = createIntersectionManager({ rootMargin: '50px' });
    registerLoaded('intersection-manager');
  }
  if (config.enableResizeManager) {
    resizeManager = createResizeManager({ debounceMs: 100 });
    registerLoaded('resize-manager');
  }
  if (config.enableMutationManager) {
    mutationManager = createMutationManager({ batchMs: 16 });
    registerLoaded('mutation-manager');
  }
  
  bootMetrics?.endPhase('phase6');
  logger?.debug('Phase 6 ready');
  
  return {
    notificationManager, formValidator, storageManager, clipboardManager, dragDropManager, modalManager,
    tooltipManager, contextMenuManager, hotkeyManager, scrollManager, focusManager, undoManager,
    themeManager, animationManager, mediaQueryManager, intersectionManager, resizeManager, mutationManager
  };
}

export default { initPhase6 };

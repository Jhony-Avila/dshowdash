// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.2.0-LOG-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: phase-6
// PURPOSE: Bootstrap Phase 6 - UI/UX Managers
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
export const MODULE_ID = 'main.ui.container-main.bootstrap-integration.phase-initializers.phase-6';

export async function initPhase6(context: Record<string, unknown>) {
  const config = context.config as Record<string, unknown>;
  const bootMetrics = context.bootMetrics as import("../types.js").ManagerRef | null;
  const managers = context.managers as import("../types.js").ManagerRef;
  const logger = context.logger as import("../types.js").ManagerRef | null;
  
  bootMetrics?.startPhase('phase6');
  // v13.2.0: debug — phase start/ready are internal plumbing
  logger?.debug('Phase 6 starting...');
  
  // Core
  if (config.enableNotificationManager) { managers.set('notificationManager', createNotificationManager({ position: 'top-right', maxVisible: 5 })); registerLoaded('notification-manager'); }
  if (config.enableFormValidator) { managers.set('formValidator', createFormValidator({ validateOnBlur: true })); registerLoaded('form-validator'); }
  if (config.enableStorageManager) { managers.set('storageManager', createStorageManager({ prefix: 'cm_', defaultStorage: 'local' })); registerLoaded('storage-manager'); }
  if (config.enableClipboardManager) { managers.set('clipboardManager', createClipboardManager({})); registerLoaded('clipboard-manager'); }
  if (config.enableDragDropManager) { managers.set('dragDropManager', createDragDropManager({})); registerLoaded('drag-drop-manager'); }
  if (config.enableModalManager) { managers.set('modalManager', createModalManager({ closeOnEscape: true, closeOnBackdrop: true })); registerLoaded('modal-manager'); }
  
  // Extended
  if (config.enableTooltipManager) { managers.set('tooltipManager', createTooltipManager({ position: 'top', showDelay: 200 })); registerLoaded('tooltip-manager'); }
  if (config.enableContextMenuManager) { managers.set('contextMenuManager', createContextMenuManager({ theme: 'dark' })); registerLoaded('context-menu-manager'); }
  if (config.enableHotkeyManager) { managers.set('hotkeyManager', createHotkeyManager({ debug: getEnv() === ENV.DEVELOPMENT })); registerLoaded('hotkey-manager'); }
  if (config.enableScrollManager) { managers.set('scrollManager', createScrollManager({ throttleMs: 100 })); registerLoaded('scroll-manager'); }
  if (config.enableFocusManager) { managers.set('focusManager', createFocusManager({ autoFocus: true })); registerLoaded('focus-manager'); }
  if (config.enableUndoManager) { managers.set('undoManager', createUndoManager({ maxHistory: 100 })); registerLoaded('undo-manager'); }
  
  // Advanced
  if (config.enableThemeManager) { managers.set('themeManager', createThemeManager({ defaultTheme: 'system' })); registerLoaded('theme-manager-v2'); }
  if (config.enableAnimationManager) { managers.set('animationManager', createAnimationManager({ respectReducedMotion: true })); registerLoaded('animation-manager-v2'); }
  if (config.enableMediaQueryManager) { managers.set('mediaQueryManager', createMediaQueryManager({ debounceMs: 100 })); registerLoaded('media-query-manager'); }
  if (config.enableIntersectionManager) { managers.set('intersectionManager', createIntersectionManager({ rootMargin: '50px' })); registerLoaded('intersection-manager'); }
  if (config.enableResizeManager) { managers.set('resizeManager', createResizeManager({ debounceMs: 100 })); registerLoaded('resize-manager'); }
  if (config.enableMutationManager) { managers.set('mutationManager', createMutationManager({ batchMs: 16 })); registerLoaded('mutation-manager'); }
  
  bootMetrics?.endPhase('phase6');
  logger?.debug('Phase 6 ready');
}

export default { initPhase6 };

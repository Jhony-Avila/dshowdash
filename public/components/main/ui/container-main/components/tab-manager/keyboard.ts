// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-DI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-tab-manager-keyboard
// PURPOSE: Tab Manager - Keyboard Navigation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createKeyboardHandler() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.1.0-DI-STRICT';
export const MODULE_ID = 'container-tab-manager-keyboard';

export function createKeyboardHandler(state: Record<string, unknown>, callbacks: Record<string, any> = {}) {
  const { onActivate, onClose, closableTabs = true } = callbacks;

  function handleTabKeydown(e: KeyboardEvent, tabId: string) {
    const tabs = (state.tabBarEl as HTMLElement | null)?.querySelectorAll('.dsd-tab');
    if (!tabs || tabs.length === 0) return;
    const tabsArray = Array.from(tabs);
    const currentIndex = tabsArray.findIndex(t => (t as any).dataset.tabId === tabId);
    if (currentIndex === -1) return;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        navigateTo((currentIndex - 1 + tabsArray.length) % tabsArray.length);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        navigateTo((currentIndex + 1) % tabsArray.length);
        break;
      case 'Home':
        e.preventDefault();
        navigateTo(0);
        break;
      case 'End':
        e.preventDefault();
        navigateTo(tabsArray.length - 1);
        break;
      case 'Delete':
        if (closableTabs) { e.preventDefault(); onClose?.(tabId); }
        break;
    }
  }

  function navigateTo(index: number) {
    const tab = (state.tabs as Record<string, unknown>[])[index];
    if (tab) onActivate?.(tab.id);
  }

  function attachListener(tabEl: HTMLElement, tabId: string) {
    tabEl.addEventListener('keydown', (e: KeyboardEvent) => handleTabKeydown(e, tabId));
  }

  return { handleTabKeydown, attachListener };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { handlerReady: true } };
}

export default { createKeyboardHandler, info, healthCheck, VERSION, MODULE_ID };

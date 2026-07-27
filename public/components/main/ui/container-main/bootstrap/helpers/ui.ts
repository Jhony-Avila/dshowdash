// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui
// PURPOSE: Bootstrap Helpers - UI (Notifications, Modals, Forms, Scroll, Theme, etc)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createUIHelpers() — exported function
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

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap.helpers.ui';

export function createUIHelpers(refs: Record<string, unknown>) {
  const r = refs as Record<string, import('../types.js').ManagerRef | null>;
  return {
    // Notifications
    notify(message: string, options: Record<string, unknown>) { return r.notificationManager?.show({ message, ...options }); },
    notifySuccess(message: string, options: Record<string, unknown>) { return r.notificationManager?.success(message, options); },
    notifyError(message: string, options: Record<string, unknown>) { return r.notificationManager?.error(message, options); },
    // Forms
    registerForm(form: Record<string, unknown>, schema: Record<string, unknown>, options: Record<string, unknown>) { return r.formValidator?.register(form, schema, options); },
    validateForm(formId: unknown) { return r.formValidator?.validate(formId); },
    // Storage
    storageGet(key: string, options: Record<string, unknown>) { return r.storageManager?.get(key, options); },
    storageSet(key: string, value: unknown, options: Record<string, unknown>) { return r.storageManager?.set(key, value, options); },
    // Clipboard
    copyToClipboard(text: string, options: Record<string, unknown>) { return r.clipboardManager?.copy(text, options); },
    // Modal
    openModal(config: Record<string, unknown>) { return r.modalManager?.open(config); },
    closeModal(id: string, result: Record<string, unknown>) { return r.modalManager?.close(id, result); },
    modalAlert(message: string, options: Record<string, unknown>) { return r.modalManager?.alert(message, options); },
    modalConfirm(message: string, options: Record<string, unknown>) { return r.modalManager?.confirm(message, options); },
    // Tooltip
    registerTooltip(element: HTMLElement, content: string, options: Record<string, unknown>) { return r.tooltipManager?.register(element, content, options); },
    // Context Menu
    registerContextMenu(element: HTMLElement, items: unknown, options: Record<string, unknown>) { return r.contextMenuManager?.register(element, items, options); },
    // Hotkeys
    registerHotkey(combo: unknown, handler: (...args: unknown[]) => void, options: Record<string, unknown>) { return r.hotkeyManager?.register(combo, handler, options); },
    // Scroll
    scrollTo(target: HTMLElement, options: Record<string, unknown>) { return r.scrollManager?.scrollTo(target, options); },
    scrollToTop(options: Record<string, unknown>) { return r.scrollManager?.scrollToTop(options); },
    // Focus
    createFocusTrap(container: HTMLElement, options: Record<string, unknown>) { return r.focusManager?.createTrap(container, options); },
    // Undo/Redo
    recordAction(action: string) { return r.undoManager?.record(action); },
    undo() { return r.undoManager?.undo(); },
    redo() { return r.undoManager?.redo(); },
    canUndo() { return r.undoManager?.canUndo() ?? false; },
    canRedo() { return r.undoManager?.canRedo() ?? false; },
    // Theme
    setTheme(theme: string) { return r.themeManager?.setTheme(theme); },
    toggleTheme() { return r.themeManager?.toggle(); },
    isDarkMode() { return r.themeManager?.isDark() ?? false; },
    // Animation
    animate(element: HTMLElement, props: Record<string, unknown>, options: Record<string, unknown>) { return r.animationManager?.animate(element, props, options); },
    fadeIn(element: HTMLElement, duration: number) { return r.animationManager?.fadeIn(element, duration); },
    fadeOut(element: HTMLElement, duration: number) { return r.animationManager?.fadeOut(element, duration); },
    // Media Query
    getCurrentBreakpoint() { return r.mediaQueryManager?.getCurrentBreakpoint(); },
    isMobileDevice() { return r.mediaQueryManager?.isMobile() ?? false; },
    isDesktopDevice() { return r.mediaQueryManager?.isDesktop() ?? false; },
    onBreakpointChange(callback: (...args: unknown[]) => void) { return r.mediaQueryManager?.onBreakpointChange(callback); },
    // Intersection
    lazyLoad(selector: string, options: Record<string, unknown>) { return r.intersectionManager?.lazyLoad(selector, options); },
    observeIntersection(element: HTMLElement, callbacks: unknown, options: Record<string, unknown>) { return r.intersectionManager?.observe(element, callbacks, options); },
    // Resize
    observeResize(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown>) { return r.resizeManager?.observe(element, callback, options); },
    // Mutation
    watchDOM(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown>) { return r.mutationManager?.observe(element, callback, options); }
  };
}

export default { createUIHelpers };

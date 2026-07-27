const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.helpers.ui";
function createUIHelpers(refs) {
  const r = refs;
  return {
    // Notifications
    notify(message, options) {
      return r.notificationManager?.show({ message, ...options });
    },
    notifySuccess(message, options) {
      return r.notificationManager?.success(message, options);
    },
    notifyError(message, options) {
      return r.notificationManager?.error(message, options);
    },
    // Forms
    registerForm(form, schema, options) {
      return r.formValidator?.register(form, schema, options);
    },
    validateForm(formId) {
      return r.formValidator?.validate(formId);
    },
    // Storage
    storageGet(key, options) {
      return r.storageManager?.get(key, options);
    },
    storageSet(key, value, options) {
      return r.storageManager?.set(key, value, options);
    },
    // Clipboard
    copyToClipboard(text, options) {
      return r.clipboardManager?.copy(text, options);
    },
    // Modal
    openModal(config) {
      return r.modalManager?.open(config);
    },
    closeModal(id, result) {
      return r.modalManager?.close(id, result);
    },
    modalAlert(message, options) {
      return r.modalManager?.alert(message, options);
    },
    modalConfirm(message, options) {
      return r.modalManager?.confirm(message, options);
    },
    // Tooltip
    registerTooltip(element, content, options) {
      return r.tooltipManager?.register(element, content, options);
    },
    // Context Menu
    registerContextMenu(element, items, options) {
      return r.contextMenuManager?.register(element, items, options);
    },
    // Hotkeys
    registerHotkey(combo, handler, options) {
      return r.hotkeyManager?.register(combo, handler, options);
    },
    // Scroll
    scrollTo(target, options) {
      return r.scrollManager?.scrollTo(target, options);
    },
    scrollToTop(options) {
      return r.scrollManager?.scrollToTop(options);
    },
    // Focus
    createFocusTrap(container, options) {
      return r.focusManager?.createTrap(container, options);
    },
    // Undo/Redo
    recordAction(action) {
      return r.undoManager?.record(action);
    },
    undo() {
      return r.undoManager?.undo();
    },
    redo() {
      return r.undoManager?.redo();
    },
    canUndo() {
      return r.undoManager?.canUndo() ?? false;
    },
    canRedo() {
      return r.undoManager?.canRedo() ?? false;
    },
    // Theme
    setTheme(theme) {
      return r.themeManager?.setTheme(theme);
    },
    toggleTheme() {
      return r.themeManager?.toggle();
    },
    isDarkMode() {
      return r.themeManager?.isDark() ?? false;
    },
    // Animation
    animate(element, props, options) {
      return r.animationManager?.animate(element, props, options);
    },
    fadeIn(element, duration) {
      return r.animationManager?.fadeIn(element, duration);
    },
    fadeOut(element, duration) {
      return r.animationManager?.fadeOut(element, duration);
    },
    // Media Query
    getCurrentBreakpoint() {
      return r.mediaQueryManager?.getCurrentBreakpoint();
    },
    isMobileDevice() {
      return r.mediaQueryManager?.isMobile() ?? false;
    },
    isDesktopDevice() {
      return r.mediaQueryManager?.isDesktop() ?? false;
    },
    onBreakpointChange(callback) {
      return r.mediaQueryManager?.onBreakpointChange(callback);
    },
    // Intersection
    lazyLoad(selector, options) {
      return r.intersectionManager?.lazyLoad(selector, options);
    },
    observeIntersection(element, callbacks, options) {
      return r.intersectionManager?.observe(element, callbacks, options);
    },
    // Resize
    observeResize(element, callback, options) {
      return r.resizeManager?.observe(element, callback, options);
    },
    // Mutation
    watchDOM(element, callback, options) {
      return r.mutationManager?.observe(element, callback, options);
    }
  };
}
var ui_default = { createUIHelpers };
export {
  MODULE_ID,
  VERSION,
  createUIHelpers,
  ui_default as default
};

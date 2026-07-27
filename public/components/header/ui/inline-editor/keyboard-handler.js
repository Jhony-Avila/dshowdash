const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/ui/inline-editor/keyboard-handler";
function createKeyboardHandler(callbacks) {
  let _keydownHandler = null;
  function _handleKeydown(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "e" && !callbacks.isEditMode()) {
        e.preventDefault();
        callbacks.enterEditMode();
        return;
      }
      if (e.key === "z" && callbacks.isEditMode()) {
        e.preventDefault();
        if (e.shiftKey) callbacks.redo();
        else callbacks.undo();
        return;
      }
      if (e.key === "y" && callbacks.isEditMode()) {
        e.preventDefault();
        callbacks.redo();
        return;
      }
    }
    if (e.key === "Escape" && callbacks.isEditMode()) {
      e.preventDefault();
      callbacks.handleDoneClick();
      return;
    }
    if (!callbacks.isEditMode()) return;
    const wrappers = callbacks.getComponentWrappers();
    if (wrappers.length === 0) return;
    const selectedIndex = callbacks.getSelectedIndex();
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = selectedIndex < wrappers.length - 1 ? selectedIndex + 1 : 0;
      callbacks.setSelectedIndex(newIndex);
      callbacks.updateKeyboardSelection();
      wrappers[newIndex].focus();
      callbacks.announceToScreenReader(`Item ${newIndex + 1} de ${wrappers.length} selecionado`);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : wrappers.length - 1;
      callbacks.setSelectedIndex(newIndex);
      callbacks.updateKeyboardSelection();
      wrappers[newIndex].focus();
      callbacks.announceToScreenReader(`Item ${newIndex + 1} de ${wrappers.length} selecionado`);
    }
    if (e.shiftKey && selectedIndex >= 0) {
      const headerRight = callbacks.getHeaderRight();
      const currentWrapper = wrappers[selectedIndex];
      if (e.key === "ArrowRight" && selectedIndex < wrappers.length - 1) {
        e.preventDefault();
        callbacks.pushToUndoStack();
        const nextWrapper = wrappers[selectedIndex + 1];
        headerRight.insertBefore(nextWrapper, currentWrapper);
        callbacks.setSelectedIndex(selectedIndex + 1);
        callbacks.updatePositionBadges();
        callbacks.markUnsavedChanges();
        callbacks.playDropSound();
        callbacks.scheduleAutoSave();
        callbacks.announceToScreenReader(`Item movido para posi\xE7\xE3o ${selectedIndex + 2}`);
      }
      if (e.key === "ArrowLeft" && selectedIndex > 0) {
        e.preventDefault();
        callbacks.pushToUndoStack();
        const prevWrapper = wrappers[selectedIndex - 1];
        headerRight.insertBefore(currentWrapper, prevWrapper);
        callbacks.setSelectedIndex(selectedIndex - 1);
        callbacks.updatePositionBadges();
        callbacks.markUnsavedChanges();
        callbacks.playDropSound();
        callbacks.scheduleAutoSave();
        callbacks.announceToScreenReader(`Item movido para posi\xE7\xE3o ${selectedIndex}`);
      }
    }
  }
  return {
    setup() {
      _keydownHandler = _handleKeydown;
      document.addEventListener("keydown", _keydownHandler);
    },
    cleanup() {
      if (_keydownHandler) {
        document.removeEventListener("keydown", _keydownHandler);
        _keydownHandler = null;
      }
    }
  };
}
var keyboard_handler_default = { VERSION, createKeyboardHandler };
export {
  MODULE_ID,
  VERSION,
  createKeyboardHandler,
  keyboard_handler_default as default
};

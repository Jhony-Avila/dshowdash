const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "header-ui-inline-editor-keyboard-handler";
let _metrics = { keydowns: 0, navigates: 0, moves: 0 };
const SHORTCUTS = { TOGGLE_EDIT: { key: "E", ctrl: true, shift: true, description: "Ativar modo edi\xE7\xE3o" }, EXIT: { key: "Escape", description: "Sair do modo edi\xE7\xE3o" }, UNDO: { key: "z", ctrl: true, description: "Desfazer" }, REDO: { key: "y", ctrl: true, description: "Refazer" }, REDO_ALT: { key: "z", ctrl: true, shift: true, description: "Refazer (alternativo)" }, NAV_UP: { key: "ArrowUp", description: "Navegar para cima" }, NAV_DOWN: { key: "ArrowDown", description: "Navegar para baixo" }, MOVE_LEFT: { key: "ArrowLeft", description: "Mover item para esquerda" }, MOVE_RIGHT: { key: "ArrowRight", description: "Mover item para direita" }, SELECT: { key: "Enter", description: "Selecionar item" }, SELECT_ALT: { key: " ", description: "Selecionar item (espa\xE7o)" } };
function createKeyboardHandler(deps) {
  const { isEditMode, enterEditMode, handleDoneClick, undo, redo, getComponentWrappers, getHeaderRight, getSelectedIndex, setSelectedIndex, updateKeyboardSelection, pushToUndoStack, updatePositionBadges, markUnsavedChanges, playDropSound, scheduleAutoSave, announceToScreenReader } = deps;
  let cleanupFn = null;
  function navigateItems(direction) {
    _metrics.navigates++;
    const wrappers = getComponentWrappers?.() || [];
    if (wrappers.length === 0) return;
    let selectedIndex = getSelectedIndex?.() ?? -1;
    selectedIndex += direction;
    if (selectedIndex < 0) selectedIndex = wrappers.length - 1;
    if (selectedIndex >= wrappers.length) selectedIndex = 0;
    setSelectedIndex?.(selectedIndex);
    updateKeyboardSelection?.();
    wrappers[selectedIndex]?.focus();
    announceToScreenReader?.(`Item ${selectedIndex + 1} de ${wrappers.length}: ${wrappers[selectedIndex]?.dataset.componentLabel}`);
  }
  function moveSelectedItem(direction) {
    _metrics.moves++;
    const wrappers = getComponentWrappers?.() || [];
    const selectedIndex = getSelectedIndex?.() ?? -1;
    if (selectedIndex < 0 || selectedIndex >= wrappers.length) return;
    const currentWrapper = wrappers[selectedIndex];
    const newIndex = selectedIndex + direction;
    if (newIndex < 0 || newIndex >= wrappers.length) return;
    if (currentWrapper.dataset.draggable === "false") {
      currentWrapper.classList.add("hie-shake");
      setTimeout(() => currentWrapper.classList.remove("hie-shake"), 400);
      announceToScreenReader?.("Este item n\xE3o pode ser movido");
      return;
    }
    pushToUndoStack?.();
    const headerRight = getHeaderRight?.();
    const targetWrapper = wrappers[newIndex];
    if (direction < 0) {
      headerRight?.insertBefore(currentWrapper, targetWrapper);
    } else {
      headerRight?.insertBefore(targetWrapper, currentWrapper);
    }
    setSelectedIndex?.(newIndex);
    updateKeyboardSelection?.();
    updatePositionBadges?.();
    markUnsavedChanges?.();
    playDropSound?.();
    scheduleAutoSave?.();
    announceToScreenReader?.(`Movido para posi\xE7\xE3o ${newIndex + 1}`);
    currentWrapper.focus();
  }
  function handleKeydown(e) {
    _metrics.keydowns++;
    const editMode = isEditMode?.() ?? false;
    if (!editMode) {
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        enterEditMode?.();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      handleDoneClick?.();
      return;
    }
    if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo?.();
      return;
    }
    if (e.ctrlKey && e.key === "y" || e.ctrlKey && e.shiftKey && e.key === "z") {
      e.preventDefault();
      redo?.();
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      navigateItems(e.key === "ArrowUp" ? -1 : 1);
      return;
    }
    const isArrowLeft = e.key === "ArrowLeft";
    const isArrowRight = e.key === "ArrowRight";
    const selectedIndex = getSelectedIndex?.() ?? -1;
    if ((isArrowLeft || isArrowRight) && selectedIndex >= 0) {
      e.preventDefault();
      moveSelectedItem(isArrowLeft ? -1 : 1);
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && document.activeElement?.classList.contains("header-component-wrapper")) {
      e.preventDefault();
      const wrappers = getComponentWrappers?.() || [];
      const index = wrappers.indexOf(document.activeElement);
      setSelectedIndex?.(index);
      updateKeyboardSelection?.();
    }
  }
  function setup() {
    document.addEventListener("keydown", handleKeydown);
    cleanupFn = () => document.removeEventListener("keydown", handleKeydown);
  }
  function cleanup() {
    cleanupFn?.();
    cleanupFn = null;
  }
  return { setup, cleanup, navigateItems, moveSelectedItem };
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, shortcuts: Object.keys(SHORTCUTS).length, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { keyboardReady: true }, metrics: getMetrics() };
}
var keyboard_handler_default = { createKeyboardHandler, SHORTCUTS, getMetrics, info, healthCheck };
export {
  MODULE_ID,
  SHORTCUTS,
  VERSION,
  createKeyboardHandler,
  keyboard_handler_default as default,
  getMetrics,
  healthCheck,
  info
};

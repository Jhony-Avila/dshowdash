import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as DOMBuilder from "./inline-editor/dom-builder.js";
import { createDragHandler } from "./inline-editor/drag-handler.js";
import { createKeyboardHandler } from "./inline-editor/keyboard-handler.js";
import { createHistoryManager } from "./inline-editor/history-manager.js";
import * as ToastManager from "./inline-editor/toast-manager.js";
import { createAudioFeedback } from "./inline-editor/audio-feedback.js";
const VERSION = "5.1.0-ES6";
const MODULE_ID = "header/ui/inline-editor";
const id = "inline-editor";
const capabilities = { reorderable: false, hideable: false, critical: true, refreshable: false, configurable: false };
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info.apply(logger, [prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [prefix].concat(args));
};
function CustomizationOverlay(options) {
  options = options || {};
  this.header = options.header || null;
  this.registry = null;
  this.componentsLoader = null;
  this.isEditMode = false;
  this.isDestroyed = false;
  this.originalOrder = [];
  this.sessionStartOrder = [];
  this._saveTimeout = null;
  this._hasUnsavedChanges = false;
  this._isSaving = false;
  this._selectedIndex = -1;
  this._metrics = { editModeCount: 0, saveCount: 0, dragCount: 0, undoCount: 0, redoCount: 0, lastEditAt: null, lastSaveAt: null, autoSaveCount: 0 };
  this._eventCleanups = [];
  this._headerRight = null;
  this._editableItems = [];
  this._ariaLiveRegion = null;
  this._dropIndicator = null;
  this._broadcastChannel = null;
  this._historyManager = createHistoryManager({ maxSize: 20 });
  this._audioFeedback = createAudioFeedback({ soundEnabled: true });
  this._dragHandler = null;
  this._keyboardHandler = null;
  _log("info", "InlineEditor v5.1.0-ES6 instance created");
}
CustomizationOverlay.prototype.init = async function() {
  const self = this;
  if (this.isDestroyed) {
    _log("warn", "Editor destru\xEDdo - init ignorado");
    return false;
  }
  try {
    const module = await import("../registry/index.js");
    this.registry = module.default;
    this.componentsLoader = this.header ? this.header.componentsLoader : null;
    this._initBroadcastChannel();
    this._initDragHandler();
    this._initKeyboardHandler();
    DOMBuilder.injectStyles();
    this._createUI();
    this._keyboardHandler.setup();
    _log("info", "InlineEditor v5.1.0-ES6 inicializado", { hasComponentsLoader: !!this.componentsLoader, reducedMotion: this._audioFeedback.getPrefersReducedMotion() });
    return true;
  } catch (error) {
    _log("error", "Erro ao inicializar editor:", error.message);
    return false;
  }
};
CustomizationOverlay.prototype._initBroadcastChannel = function() {
  const self = this;
  try {
    this._broadcastChannel = new BroadcastChannel("header-customization");
    this._broadcastChannel.onmessage = (event) => {
      if (event.data.type === "order-saved" && !self.isEditMode) {
        _log("info", "Ordem atualizada de outra aba");
        ToastManager.showToast("Ordem atualizada de outra aba", "info");
      }
    };
  } catch (e) {
    _log("debug", "BroadcastChannel n\xE3o suportado");
  }
};
CustomizationOverlay.prototype._initDragHandler = function() {
  const self = this;
  this._dragHandler = createDragHandler({
    getHeaderRight() {
      return self._headerRight;
    },
    getDropIndicator() {
      return self._dropIndicator;
    },
    getEditableItems() {
      return self._editableItems;
    },
    pushToUndoStack() {
      self._pushToUndoStack();
    },
    markUnsavedChanges() {
      self._markUnsavedChanges();
    },
    updatePositionBadges() {
      self._updatePositionBadges();
    },
    scheduleAutoSave() {
      self._scheduleAutoSave();
    },
    playDropSound() {
      self._audioFeedback.playDropSound();
    },
    announceToScreenReader(msg) {
      self._announceToScreenReader(msg);
    },
    onDragCountIncrement() {
      self._metrics.dragCount++;
    }
  });
};
CustomizationOverlay.prototype._initKeyboardHandler = function() {
  const self = this;
  this._keyboardHandler = createKeyboardHandler({
    isEditMode() {
      return self.isEditMode;
    },
    enterEditMode() {
      self.enterEditMode();
    },
    handleDoneClick() {
      self._handleDoneClick();
    },
    undo() {
      self._undo();
    },
    redo() {
      self._redo();
    },
    getComponentWrappers() {
      return self._getComponentWrappers();
    },
    getHeaderRight() {
      return self._headerRight;
    },
    getSelectedIndex() {
      return self._selectedIndex;
    },
    setSelectedIndex(idx) {
      self._selectedIndex = idx;
    },
    updateKeyboardSelection() {
      self._updateKeyboardSelection();
    },
    pushToUndoStack() {
      self._pushToUndoStack();
    },
    updatePositionBadges() {
      self._updatePositionBadges();
    },
    markUnsavedChanges() {
      self._markUnsavedChanges();
    },
    playDropSound() {
      self._audioFeedback.playDropSound();
    },
    scheduleAutoSave() {
      self._scheduleAutoSave();
    },
    announceToScreenReader(msg) {
      self._announceToScreenReader(msg);
    }
  });
};
CustomizationOverlay.prototype._createUI = function() {
  const self = this;
  this._headerRight = document.querySelector(".header-right");
  if (!this._headerRight) {
    _log("warn", "Container .header-right n\xE3o encontrado");
    return;
  }
  if (document.getElementById("hie-trigger-btn")) return;
  const triggerBtn = DOMBuilder.createTriggerButton(() => {
    self.toggleEditMode();
  });
  const doneBtn = DOMBuilder.createDoneButton(() => {
    self._handleDoneClick();
  });
  const resetBtn = DOMBuilder.createResetButton(() => {
    self._resetToSessionStart();
  });
  this._headerRight.insertBefore(resetBtn, this._headerRight.firstChild);
  this._headerRight.insertBefore(doneBtn, this._headerRight.firstChild);
  this._headerRight.insertBefore(triggerBtn, this._headerRight.firstChild);
  document.body.appendChild(DOMBuilder.createEditBanner());
  document.body.appendChild(DOMBuilder.createConfirmOverlay((action) => {
    if (action === "cancel") ToastManager.hideConfirmDialog();
    else if (action === "discard") {
      ToastManager.hideConfirmDialog();
      self._forceExit();
    } else if (action === "save") {
      ToastManager.hideConfirmDialog();
      self._saveAndExit();
    }
  }));
  this._dropIndicator = DOMBuilder.createDropIndicator();
  document.body.appendChild(this._dropIndicator);
  this._ariaLiveRegion = DOMBuilder.createAriaLiveRegion();
  document.body.appendChild(this._ariaLiveRegion);
};
CustomizationOverlay.prototype._announceToScreenReader = function(message) {
  const self = this;
  if (this._ariaLiveRegion) {
    this._ariaLiveRegion.textContent = "";
    setTimeout(() => {
      self._ariaLiveRegion.textContent = message;
    }, 100);
  }
};
CustomizationOverlay.prototype._getComponentWrappers = function() {
  if (!this._headerRight) return [];
  return Array.from(this._headerRight.querySelectorAll(".header-component-wrapper[data-component-key]"));
};
CustomizationOverlay.prototype._updateKeyboardSelection = function() {
  const self = this;
  const wrappers = this._getComponentWrappers();
  wrappers.forEach((w, i) => {
    w.classList.toggle("hie-keyboard-selected", i === self._selectedIndex);
  });
};
CustomizationOverlay.prototype.toggleEditMode = function() {
  if (this.isEditMode) this._handleDoneClick();
  else this.enterEditMode();
};
CustomizationOverlay.prototype.enterEditMode = function() {
  if (this.isEditMode || this.isDestroyed) return;
  this.isEditMode = true;
  this._metrics.editModeCount++;
  this._metrics.lastEditAt = Date.now();
  this._hasUnsavedChanges = false;
  this._historyManager.clearAll();
  this._selectedIndex = -1;
  ToastManager.setEditModeUI(true);
  this._captureCurrentOrder();
  this.sessionStartOrder = this.originalOrder.slice();
  this._setupDraggableItems();
  this._addPositionBadges();
  this._animateItemsIn();
  this._audioFeedback.resume();
  _log("info", "Modo edi\xE7\xE3o ativado", { items: this.originalOrder.length });
  this._emitEvent("header:edit-mode:enter", { timestamp: Date.now() });
  this._announceToScreenReader(`Modo de edi\xE7\xE3o ativado. ${this.originalOrder.length} itens dispon\xEDveis para reorganizar.`);
};
CustomizationOverlay.prototype._animateItemsIn = function() {
  const self = this;
  if (this._audioFeedback.getPrefersReducedMotion()) return;
  const wrappers = this._getComponentWrappers();
  wrappers.forEach((wrapper, index) => {
    setTimeout(() => {
      wrapper.classList.add("hie-animate-in");
      setTimeout(() => {
        wrapper.classList.remove("hie-animate-in");
      }, 400);
    }, index * 50);
  });
};
CustomizationOverlay.prototype._addPositionBadges = function() {
  const wrappers = this._getComponentWrappers();
  wrappers.forEach((wrapper, index) => {
    let badge = wrapper.querySelector(".hie-position-badge");
    if (!badge) {
      badge = DOMBuilder.createPositionBadge(index + 1);
      wrapper.appendChild(badge);
    } else {
      badge.textContent = index + 1;
    }
  });
};
CustomizationOverlay.prototype._updatePositionBadges = function() {
  const wrappers = this._getComponentWrappers();
  wrappers.forEach((wrapper, index) => {
    const badge = wrapper.querySelector(".hie-position-badge");
    if (badge) badge.textContent = index + 1;
  });
};
CustomizationOverlay.prototype._removePositionBadges = () => {
  document.querySelectorAll(".hie-position-badge").forEach((b) => {
    b.remove();
  });
};
CustomizationOverlay.prototype._setupDraggableItems = function() {
  const self = this;
  if (!this._headerRight) return;
  this._editableItems = [];
  const wrappers = this._getComponentWrappers();
  wrappers.forEach((wrapper, index) => {
    wrapper.setAttribute("tabindex", "0");
    wrapper.setAttribute("role", "listitem");
    wrapper.setAttribute("aria-label", `${wrapper.dataset.componentLabel || ""}, posi\xE7\xE3o ${index + 1}`);
    wrapper.dataset.editIndex = index;
    const handlers = self._dragHandler.setupWrapper(wrapper);
    self._editableItems.push({ element: wrapper, handlers });
  });
  _log("debug", `${self._editableItems.length} wrappers configurados`);
};
CustomizationOverlay.prototype._cleanupDraggableItems = function() {
  const self = this;
  this._editableItems.forEach((item) => {
    item.element.removeAttribute("data-edit-index");
    item.element.removeAttribute("tabindex");
    item.element.removeAttribute("role");
    item.element.classList.remove("hie-keyboard-selected", "hie-animate-in");
    self._dragHandler.cleanupWrapper(item.element, item.handlers);
  });
  this._editableItems = [];
};
CustomizationOverlay.prototype._handleDoneClick = function() {
  if (this._hasUnsavedChanges) {
    ToastManager.showConfirmDialog();
  } else {
    this.exitEditMode();
  }
};
CustomizationOverlay.prototype._saveAndExit = async function() {
  await this._autoSave();
  this.exitEditMode();
};
CustomizationOverlay.prototype._forceExit = function() {
  if (this.componentsLoader && this.componentsLoader.reorderComponents) {
    this.componentsLoader.reorderComponents(this.sessionStartOrder);
  }
  this._hasUnsavedChanges = false;
  this.exitEditMode();
};
CustomizationOverlay.prototype.exitEditMode = function() {
  if (!this.isEditMode) return;
  this.isEditMode = false;
  this._selectedIndex = -1;
  ToastManager.setEditModeUI(false);
  this._cleanupDraggableItems();
  this._removePositionBadges();
  if (this._dropIndicator) this._dropIndicator.classList.remove("hie-visible");
  _log("info", "Modo edi\xE7\xE3o desativado");
  this._emitEvent("header:edit-mode:exit", { timestamp: Date.now() });
  this._announceToScreenReader("Modo de edi\xE7\xE3o desativado");
};
CustomizationOverlay.prototype._resetToSessionStart = function() {
  if (this.sessionStartOrder.length === 0) return;
  this._pushToUndoStack();
  if (this.componentsLoader && this.componentsLoader.reorderComponents) {
    this.componentsLoader.reorderComponents(this.sessionStartOrder);
  }
  this._updatePositionBadges();
  this._hasUnsavedChanges = false;
  ToastManager.setDoneButtonState("default");
  ToastManager.setResetButtonVisible(false);
  ToastManager.showToast("Ordem restaurada", "info");
  this._announceToScreenReader("Ordem restaurada para o in\xEDcio da sess\xE3o");
};
CustomizationOverlay.prototype._captureCurrentOrder = function() {
  if (this.componentsLoader && this.componentsLoader.getCurrentDOMOrder) {
    this.originalOrder = this.componentsLoader.getCurrentDOMOrder();
  } else {
    this.originalOrder = this._getCurrentDOMOrder();
  }
  _log("debug", "Ordem capturada:", { count: this.originalOrder.length });
};
CustomizationOverlay.prototype._getCurrentDOMOrder = function() {
  if (!this._headerRight) return [];
  const order = [];
  this._headerRight.querySelectorAll(".header-component-wrapper[data-component-key]").forEach((wrapper) => {
    const key = wrapper.dataset.componentKey;
    if (key) order.push(key);
  });
  return order;
};
CustomizationOverlay.prototype._pushToUndoStack = function() {
  const currentOrder = this._getCurrentDOMOrder();
  this._historyManager.push(currentOrder);
};
CustomizationOverlay.prototype._undo = function() {
  const currentOrder = this._getCurrentDOMOrder();
  const result = this._historyManager.undo(currentOrder);
  if (!result.success) {
    ToastManager.showToast("Nada para desfazer", "info");
    return;
  }
  if (this.componentsLoader && this.componentsLoader.reorderComponents) {
    this.componentsLoader.reorderComponents(result.state);
  }
  this._updatePositionBadges();
  this._metrics.undoCount++;
  ToastManager.showToast("Desfeito", "info");
  this._announceToScreenReader("A\xE7\xE3o desfeita");
  this._scheduleAutoSave();
};
CustomizationOverlay.prototype._redo = function() {
  const currentOrder = this._getCurrentDOMOrder();
  const result = this._historyManager.redo(currentOrder);
  if (!result.success) {
    ToastManager.showToast("Nada para refazer", "info");
    return;
  }
  if (this.componentsLoader && this.componentsLoader.reorderComponents) {
    this.componentsLoader.reorderComponents(result.state);
  }
  this._updatePositionBadges();
  this._metrics.redoCount++;
  ToastManager.showToast("Refeito", "info");
  this._announceToScreenReader("A\xE7\xE3o refeita");
  this._scheduleAutoSave();
};
CustomizationOverlay.prototype._markUnsavedChanges = function() {
  this._hasUnsavedChanges = true;
  ToastManager.setDoneButtonState("hasChanges");
  ToastManager.setResetButtonVisible(true);
};
CustomizationOverlay.prototype._scheduleAutoSave = function() {
  const self = this;
  if (this._saveTimeout) clearTimeout(this._saveTimeout);
  this._saveTimeout = setTimeout(() => {
    self._autoSave();
  }, 800);
};
CustomizationOverlay.prototype._autoSave = async function() {
  const self = this;
  if (!this.registry || this._isSaving) return;
  const newOrder = this._getCurrentDOMOrder();
  if (newOrder.length === 0) {
    _log("warn", "Ordem vazia, skip save");
    return;
  }
  this._isSaving = true;
  ToastManager.setDoneButtonState("saving");
  _log("info", "Auto-salvando ordem...", { count: newOrder.length });
  try {
    const result = await this.registry.saveComponentOrder(newOrder);
    if (result.success) {
      this._metrics.autoSaveCount++;
      this._metrics.saveCount++;
      this._metrics.lastSaveAt = Date.now();
      this.originalOrder = newOrder.slice();
      this._hasUnsavedChanges = false;
      ToastManager.setDoneButtonState("saved");
      ToastManager.setResetButtonVisible(false);
      if (this._broadcastChannel) this._broadcastChannel.postMessage({ type: "order-saved", order: newOrder });
      ToastManager.showToast("Ordem salva!");
      this._emitEvent("header:order:saved", { order: newOrder, timestamp: Date.now() });
      _log("info", "Ordem salva com sucesso", { count: newOrder.length });
    } else {
      throw new Error(result.error || "Erro ao salvar");
    }
  } catch (error) {
    _log("error", "Erro ao salvar ordem:", error.message);
    ToastManager.showToast("Erro ao salvar", "error");
  } finally {
    this._isSaving = false;
  }
};
CustomizationOverlay.prototype._emitEvent = (eventName, detail) => {
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) eventBus.emit(eventName, detail);
  document.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
};
CustomizationOverlay.prototype.open = function() {
  this.enterEditMode();
};
CustomizationOverlay.prototype.close = function() {
  this.exitEditMode();
};
CustomizationOverlay.prototype.setSoundEnabled = function(enabled) {
  this._audioFeedback.setSoundEnabled(enabled);
};
CustomizationOverlay.prototype.healthCheck = function() {
  const wrapperCount = this._getComponentWrappers().length;
  const checks = { notDestroyed: !this.isDestroyed, hasRegistry: !!this.registry, hasHeaderRight: !!this._headerRight, triggerButtonExists: !!document.getElementById("hie-trigger-btn"), dropIndicatorExists: !!this._dropIndicator, hasComponentWrappers: wrapperCount > 0, ariaLiveExists: !!this._ariaLiveRegion };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const historyStats = this._historyManager.getStats();
  return { status: passed === total ? "HEALTHY" : passed >= 5 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), version: VERSION, moduleId: MODULE_ID, isEditMode: this.isEditMode, wrapperCount, undoStackSize: historyStats.undoStackSize, redoStackSize: historyStats.redoStackSize, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
CustomizationOverlay.prototype.info = function() {
  const historyStats = this._historyManager.getStats();
  return { version: VERSION, moduleId: MODULE_ID, id, capabilities, isEditMode: this.isEditMode, metrics: Object.assign({}, this._metrics), currentOrder: this._getCurrentDOMOrder(), originalOrder: this.originalOrder, sessionStartOrder: this.sessionStartOrder, wrapperCount: this._getComponentWrappers().length, hasUnsavedChanges: this._hasUnsavedChanges, undoStackSize: historyStats.undoStackSize, redoStackSize: historyStats.redoStackSize, changeHistorySize: historyStats.changeHistorySize, soundEnabled: this._audioFeedback.isSoundEnabled(), prefersReducedMotion: this._audioFeedback.getPrefersReducedMotion(), portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
};
CustomizationOverlay.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
CustomizationOverlay.prototype.getChangeHistory = function() {
  return this._historyManager.getChangeHistory();
};
CustomizationOverlay.prototype.resetMetrics = function() {
  this._metrics = { editModeCount: 0, saveCount: 0, dragCount: 0, undoCount: 0, redoCount: 0, lastEditAt: null, lastSaveAt: null, autoSaveCount: 0 };
};
CustomizationOverlay.prototype.destroy = function() {
  if (this.isDestroyed) return;
  this.exitEditMode();
  if (this._keyboardHandler) this._keyboardHandler.cleanup();
  if (this._audioFeedback) this._audioFeedback.destroy();
  this._eventCleanups.forEach((cleanup) => {
    try {
      cleanup();
    } catch (e) {
    }
  });
  this._eventCleanups = [];
  if (this._saveTimeout) clearTimeout(this._saveTimeout);
  if (this._broadcastChannel) this._broadcastChannel.close();
  DOMBuilder.cleanupDOM();
  if (this._dropIndicator) this._dropIndicator.remove();
  this.isDestroyed = true;
  _log("info", "InlineEditor v5.1.0-ES6 destru\xEDdo");
};
function getVersion() {
  return VERSION;
}
var customization_overlay_default = CustomizationOverlay;
export {
  CustomizationOverlay,
  MODULE_ID,
  VERSION,
  capabilities,
  customization_overlay_default as default,
  getPorts,
  getVersion,
  id,
  injectPorts
};

import { CONTAINER_EVENTS, CONTAINER_INTENTS } from "/core/runtime/events/catalog/container.events.js";
import { ICONS } from "../utils/icons.js";
const VERSION = "9.0.0-UX-ENHANCED";
const MODULE_ID = "container-controls";
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
const SHORTCUTS = { minimize: "\u2318M", maximize: "\u2318\u21E7F", close: "\u2318W", menu: "\u2318." };
function createControls(container, options = {}) {
  const { collapsible = true, closable = false, fullscreenable = true, onCollapse, onExpand, onClose, onFullscreen, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _isMinimized = false;
  let _isFullscreen = false;
  let _controlsEl = null;
  let _buttonHandlers = [];
  let _keyboardHandler = null;
  function _emitEvent(eventType, data) {
    try {
      const eb = _getEventBus();
      if (eb?.emit) eb.emit(eventType, { source: MODULE_ID, containerId: container?.id, timestamp: Date.now(), ...data });
    } catch (e) {
    }
    const domEvent = eventType.replace(/\./g, ":");
    container?.dispatchEvent?.(new CustomEvent(domEvent, { bubbles: true, detail: { containerId: container?.id, ...data } }));
  }
  function _createButton(className, title, icon, onClick, shortcut) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `dsd-container__control ${className}`;
    btn.title = title;
    btn.setAttribute("aria-label", title);
    btn.setAttribute("data-tooltip", title);
    if (shortcut) {
      btn.setAttribute("data-shortcut", shortcut);
    }
    btn.innerHTML = `<span class="dsd-container__control-icon">${icon}</span>`;
    const handler = (e) => {
      e.stopPropagation();
      onClick();
    };
    btn.addEventListener("click", handler);
    _buttonHandlers.push({ btn, handler });
    return btn;
  }
  function _clearButtonHandlers() {
    _buttonHandlers.forEach(({ btn, handler }) => btn.removeEventListener("click", handler));
    _buttonHandlers = [];
  }
  function _setupKeyboardShortcuts() {
    if (_keyboardHandler) return;
    _keyboardHandler = (e) => {
      if (!container?.classList?.contains("dsd-container--active") && !container?.contains(document.activeElement)) {
        return;
      }
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === "m" && collapsible) {
        e.preventDefault();
        controls.toggle();
      } else if (isMeta && e.shiftKey && e.key === "f" && fullscreenable) {
        e.preventDefault();
        controls.maximize();
      } else if (isMeta && e.key === "w" && closable) {
        e.preventDefault();
        controls.close();
      }
    };
    document.addEventListener("keydown", _keyboardHandler);
  }
  function _removeKeyboardShortcuts() {
    if (_keyboardHandler) {
      document.removeEventListener("keydown", _keyboardHandler);
      _keyboardHandler = null;
    }
  }
  function _render() {
    _controlsEl = container?.querySelector(".dsd-container__controls");
    if (!_controlsEl) {
      const headerRight = container?.querySelector(".dsd-container__header-right");
      if (headerRight) {
        _controlsEl = document.createElement("div");
        _controlsEl.className = "dsd-container__controls";
        _controlsEl.setAttribute("role", "group");
        _controlsEl.setAttribute("aria-label", "Controles do container");
        headerRight.appendChild(_controlsEl);
      }
    }
    if (!_controlsEl) return;
    _clearButtonHandlers();
    _controlsEl.innerHTML = "";
    if (collapsible) {
      const toggleBtn = _createButton(
        "dsd-container__control--minimize",
        _isMinimized ? "Expandir" : "Minimizar",
        _isMinimized ? ICONS.chevronDown : ICONS.chevronUp,
        () => controls.toggle(),
        SHORTCUTS.minimize
      );
      toggleBtn.setAttribute("aria-expanded", String(!_isMinimized));
      _controlsEl.appendChild(toggleBtn);
    }
    if (fullscreenable) {
      const fsBtn = _createButton(
        "dsd-container__control--maximize",
        _isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia",
        _isFullscreen ? ICONS.exitFullscreen : ICONS.fullscreen,
        () => controls.maximize(),
        SHORTCUTS.maximize
      );
      fsBtn.setAttribute("aria-pressed", String(_isFullscreen));
      _controlsEl.appendChild(fsBtn);
    }
    if (closable) {
      const closeBtn = _createButton(
        "dsd-container__control--close",
        "Fechar",
        ICONS.close,
        () => controls.close(),
        SHORTCUTS.close
      );
      _controlsEl.appendChild(closeBtn);
    }
    _setupKeyboardShortcuts();
  }
  function _updateIcons() {
    if (!_controlsEl) return;
    const minimizeBtn = _controlsEl.querySelector(".dsd-container__control--minimize");
    if (minimizeBtn) {
      const title = _isMinimized ? "Expandir" : "Minimizar";
      minimizeBtn.title = title;
      minimizeBtn.setAttribute("aria-label", title);
      minimizeBtn.setAttribute("aria-expanded", String(!_isMinimized));
      minimizeBtn.setAttribute("data-tooltip", title);
      const icon = minimizeBtn.querySelector(".dsd-container__control-icon");
      if (icon) icon.innerHTML = _isMinimized ? ICONS.chevronDown : ICONS.chevronUp;
    }
    const fsBtn = _controlsEl.querySelector(".dsd-container__control--maximize");
    if (fsBtn) {
      const title = _isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia";
      fsBtn.title = title;
      fsBtn.setAttribute("aria-label", title);
      fsBtn.setAttribute("aria-pressed", String(_isFullscreen));
      fsBtn.setAttribute("data-tooltip", title);
      const icon = fsBtn.querySelector(".dsd-container__control-icon");
      if (icon) icon.innerHTML = _isFullscreen ? ICONS.exitFullscreen : ICONS.fullscreen;
    }
  }
  const controls = {
    init() {
      if (_initialized) return this;
      _initialized = true;
      _render();
      return this;
    },
    minimize() {
      if (_isFullscreen) return this;
      _isMinimized = !_isMinimized;
      container?.classList?.toggle("dsd-container--minimized", _isMinimized);
      container?.classList?.toggle("dsd-container--collapsed", _isMinimized);
      container?.setAttribute?.("aria-expanded", String(!_isMinimized));
      _updateIcons();
      _emitEvent(CONTAINER_EVENTS.COLLAPSED, { minimized: _isMinimized });
      if (_isMinimized) onCollapse?.();
      else onExpand?.();
      return this;
    },
    collapse() {
      if (!_isMinimized) this.minimize();
      return this;
    },
    expand() {
      if (_isMinimized) this.minimize();
      return this;
    },
    toggle() {
      return this.minimize();
    },
    maximize() {
      _isFullscreen = !_isFullscreen;
      if (_isFullscreen) {
        _isMinimized = false;
        container?.classList?.remove("dsd-container--minimized", "dsd-container--collapsed");
      }
      container?.classList?.toggle("dsd-container--fullscreen", _isFullscreen);
      _updateIcons();
      if (_isFullscreen) document.addEventListener("keydown", controls._handleEscape);
      else document.removeEventListener("keydown", controls._handleEscape);
      _emitEvent(CONTAINER_EVENTS.FULLSCREEN, { fullscreen: _isFullscreen });
      onFullscreen?.(_isFullscreen);
      return this;
    },
    enterFullscreen() {
      if (!_isFullscreen) this.maximize();
      return this;
    },
    exitFullscreen() {
      if (_isFullscreen) this.maximize();
      return this;
    },
    _handleEscape(e) {
      if (e.key === "Escape" && _isFullscreen) controls.maximize();
    },
    close() {
      container?.classList?.add("dsd-container--animate-out");
      _emitEvent(CONTAINER_INTENTS.CLOSE, {});
      onClose?.();
      setTimeout(() => {
        container?.remove();
        _emitEvent(CONTAINER_EVENTS.CLOSED, {});
      }, 200);
      return this;
    },
    isMinimized() {
      return _isMinimized;
    },
    isFullscreen() {
      return _isFullscreen;
    },
    isInitialized() {
      return _initialized;
    },
    restore() {
      if (_isMinimized) this.minimize();
      if (_isFullscreen) this.maximize();
      return this;
    },
    destroy() {
      document.removeEventListener("keydown", controls._handleEscape);
      _removeKeyboardShortcuts();
      _clearButtonHandlers();
      if (_controlsEl) _controlsEl.innerHTML = "";
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, state: { isMinimized: _isMinimized, isFullscreen: _isFullscreen }, hasControlsEl: !!_controlsEl, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasKeyboardShortcuts: !!_keyboardHandler };
    }
  };
  return controls;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, shortcuts: SHORTCUTS };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true };
}
var controls_default = { createControls, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createControls,
  controls_default as default,
  healthCheck,
  info,
  injectEventBus
};

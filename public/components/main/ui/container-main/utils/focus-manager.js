import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:focus-manager";
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
function createFocusManager(options = {}) {
  const { trapSelector = null, autoFocus = true, restoreFocus = true, wrapAround = true } = options;
  const _logger = createLogger(MODULE_ID);
  const _traps = /* @__PURE__ */ new Map();
  const _history = [];
  let _activeTrap = null;
  let _counter = 0;
  let _metrics = { trapsCreated: 0, focusChanges: 0 };
  function _getFocusableElements(container) {
    const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
    return elements.filter((el) => !el.disabled && el.offsetParent !== null && getComputedStyle(el).visibility !== "hidden");
  }
  function _handleKeydown(e) {
    if (!_activeTrap) return;
    if (e.key !== "Tab") return;
    const focusable = _getFocusableElements(_activeTrap.container);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;
    if (e.shiftKey) {
      if (current === first || !_activeTrap.container.contains(current)) {
        e.preventDefault();
        if (wrapAround) last.focus();
      }
    } else {
      if (current === last || !_activeTrap.container.contains(current)) {
        e.preventDefault();
        if (wrapAround) first.focus();
      }
    }
  }
  document.addEventListener("keydown", _handleKeydown);
  const manager = {
    // Cria focus trap
    createTrap(container, options2 = {}) {
      if (typeof container === "string") container = document.querySelector(container);
      if (!container) return null;
      const id = `trap-${++_counter}`;
      const config = { id, container, initialFocus: options2.initialFocus || null, returnFocus: options2.returnFocus !== false, previousFocus: document.activeElement };
      _traps.set(id, config);
      _metrics.trapsCreated++;
      return id;
    },
    // Ativa trap
    activateTrap(id) {
      const trap = _traps.get(id);
      if (!trap) return false;
      if (_activeTrap && restoreFocus) {
        _history.push(_activeTrap);
      }
      _activeTrap = trap;
      const focusable = _getFocusableElements(trap.container);
      if (trap.initialFocus) {
        const initial = typeof trap.initialFocus === "string" ? trap.container.querySelector(trap.initialFocus) : trap.initialFocus;
        initial?.focus();
      } else if (autoFocus && focusable.length > 0) {
        focusable[0].focus();
      }
      _metrics.focusChanges++;
      return true;
    },
    // Desativa trap
    deactivateTrap(id) {
      const trap = _traps.get(id);
      if (!trap) return false;
      if (_activeTrap?.id === id) {
        if (trap.returnFocus && trap.previousFocus) {
          trap.previousFocus.focus();
        }
        if (_history.length > 0) {
          _activeTrap = _history.pop();
        } else {
          _activeTrap = null;
        }
      }
      return true;
    },
    // Remove trap
    removeTrap(id) {
      this.deactivateTrap(id);
      return _traps.delete(id);
    },
    // Focus no primeiro elemento focável
    focusFirst(container) {
      if (typeof container === "string") container = document.querySelector(container);
      const focusable = _getFocusableElements(container || document.body);
      if (focusable.length > 0) {
        focusable[0].focus();
        _metrics.focusChanges++;
        return true;
      }
      return false;
    },
    // Focus no último elemento focável
    focusLast(container) {
      if (typeof container === "string") container = document.querySelector(container);
      const focusable = _getFocusableElements(container || document.body);
      if (focusable.length > 0) {
        focusable[focusable.length - 1].focus();
        _metrics.focusChanges++;
        return true;
      }
      return false;
    },
    // Próximo/anterior focável
    focusNext() {
      const focusable = _getFocusableElements(_activeTrap?.container || document.body);
      const current = focusable.indexOf(document.activeElement);
      const next = (current + 1) % focusable.length;
      focusable[next]?.focus();
      _metrics.focusChanges++;
    },
    focusPrevious() {
      const focusable = _getFocusableElements(_activeTrap?.container || document.body);
      const current = focusable.indexOf(document.activeElement);
      const prev = current <= 0 ? focusable.length - 1 : current - 1;
      focusable[prev]?.focus();
      _metrics.focusChanges++;
    },
    // Salva/restaura foco
    saveFocus(key = "default") {
      const saved = document.activeElement;
      _history.push({ key, element: saved });
      return saved;
    },
    restoreFocus(key = "default") {
      const index = _history.findIndex((h) => h.key === key);
      if (index !== -1) {
        const { element } = _history.splice(index, 1)[0];
        element?.focus();
        _metrics.focusChanges++;
        return true;
      }
      return false;
    },
    // Obtém elementos focáveis
    getFocusable(container) {
      if (typeof container === "string") container = document.querySelector(container);
      return _getFocusableElements(container || document.body);
    },
    // Verifica se é focável
    isFocusable(element) {
      if (!element) return false;
      return element.matches(FOCUSABLE_SELECTOR) && !element.disabled && element.offsetParent !== null;
    },
    // Skip link helper
    createSkipLink(targetId, label = "Pular para conte\xFAdo principal") {
      const link = document.createElement("a");
      link.href = `#${targetId}`;
      link.className = "cm-skip-link";
      link.textContent = label;
      link.style.cssText = "position:absolute;top:-100px;left:0;background:#1a1a2e;color:#fff;padding:8px 16px;z-index:99999;transition:top 0.2s;";
      link.addEventListener("focus", () => {
        link.style.top = "0";
      });
      link.addEventListener("blur", () => {
        link.style.top = "-100px";
      });
      document.body.insertBefore(link, document.body.firstChild);
      return link;
    },
    getActiveTrap() {
      return _activeTrap?.id || null;
    },
    getMetrics() {
      return { ..._metrics, traps: _traps.size, historySize: _history.length };
    },
    resetMetrics() {
      _metrics = { trapsCreated: 0, focusChanges: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, traps: _traps.size, activeTrap: _activeTrap?.id || null, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, traps: _traps.size, activeTrap: _activeTrap?.id || null };
    },
    destroy() {
      document.removeEventListener("keydown", _handleKeydown);
      _traps.clear();
      _history.length = 0;
      _activeTrap = null;
    }
  };
  return manager;
}
let _instance = null;
function getFocusManager(options = {}) {
  if (!_instance) _instance = createFocusManager(options);
  return _instance;
}
function resetFocusManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var focus_manager_default = { VERSION, MODULE_ID, createFocusManager, getFocusManager, resetFocusManager, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createFocusManager,
  focus_manager_default as default,
  getFocusManager,
  healthCheck,
  info,
  resetFocusManager
};

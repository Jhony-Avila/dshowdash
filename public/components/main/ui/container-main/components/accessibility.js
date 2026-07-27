const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-accessibility";
import { createLogger } from "../utils/logger.js";
const logger = createLogger(MODULE_ID);
function _validateOptions(options) {
  const errors = [];
  if (options.enableFocusTrap !== void 0 && typeof options.enableFocusTrap !== "boolean") errors.push("enableFocusTrap must be a boolean");
  if (options.enableRovingTabindex !== void 0 && typeof options.enableRovingTabindex !== "boolean") errors.push("enableRovingTabindex must be a boolean");
  if (options.respectReducedMotion !== void 0 && typeof options.respectReducedMotion !== "boolean") errors.push("respectReducedMotion must be a boolean");
  if (options.announceChanges !== void 0 && typeof options.announceChanges !== "boolean") errors.push("announceChanges must be a boolean");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
function createAccessibility(container, options = {}) {
  _validateOptions(options);
  const { enableFocusTrap = true, enableRovingTabindex = true, respectReducedMotion = true, announceChanges = true, keyboardNavigation = true } = options;
  let _initialized = false;
  let _focusTrapActive = false;
  let _focusableElements = [];
  let _firstFocusable = null;
  let _lastFocusable = null;
  let _previousActiveElement = null;
  let _liveRegion = null;
  let _rovingIndex = 0;
  let _mutationObserver = null;
  let _motionMediaQuery = null;
  let _boundFocusTrap = null;
  let _boundRovingTabindex = null;
  let _boundMotionChange = null;
  const FOCUSABLE_SELECTORS = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
  function _createLiveRegion() {
    let existing = container.querySelector(".dsd-a11y-live");
    if (existing) return existing;
    const region = document.createElement("div");
    region.className = "dsd-a11y-live";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
    container.appendChild(region);
    return region;
  }
  function _updateFocusableElements() {
    _focusableElements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)).filter((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    _firstFocusable = _focusableElements[0] || null;
    _lastFocusable = _focusableElements[_focusableElements.length - 1] || null;
  }
  function _handleFocusTrap(e) {
    if (!_focusTrapActive || e.key !== "Tab") return;
    _updateFocusableElements();
    if (_focusableElements.length === 0) {
      e.preventDefault();
      return;
    }
    if (e.shiftKey) {
      if (document.activeElement === _firstFocusable) {
        e.preventDefault();
        _lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === _lastFocusable) {
        e.preventDefault();
        _firstFocusable?.focus();
      }
    }
  }
  function _handleRovingTabindex(e) {
    if (!enableRovingTabindex) return;
    const group = e.target.closest('[role="toolbar"], [role="tablist"], [role="menu"]');
    if (!group) return;
    const items = Array.from(group.querySelectorAll('[role="button"], [role="tab"], [role="menuitem"]'));
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement);
    if (currentIndex === -1) return;
    let newIndex = currentIndex;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        newIndex = (currentIndex + 1) % items.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        newIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case "Home":
        e.preventDefault();
        newIndex = 0;
        break;
      case "End":
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }
    items.forEach((item, i) => item.setAttribute("tabindex", i === newIndex ? "0" : "-1"));
    items[newIndex]?.focus();
    _rovingIndex = newIndex;
  }
  function _checkReducedMotion() {
    if (!respectReducedMotion) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function _applyReducedMotion() {
    const prefersReduced = _checkReducedMotion();
    container.classList.toggle("dsd-container--reduced-motion", prefersReduced);
    container.setAttribute("data-reduced-motion", String(prefersReduced));
  }
  function _setupKeyboardNavigation() {
    if (!keyboardNavigation) return;
    container.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = container.querySelector('.dsd-context-menu--visible, [role="dialog"]');
        if (modal) {
          e.preventDefault();
          modal.classList.remove("dsd-context-menu--visible");
          _previousActiveElement?.focus();
        }
      }
      if (e.key === "Enter" || e.key === " ") {
        const target = e.target;
        if (target.matches('[role="button"]')) {
          e.preventDefault();
          target.click();
        }
      }
    });
  }
  function _setupMutationObserver() {
    const observer = new MutationObserver(() => _updateFocusableElements());
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "hidden", "aria-hidden"] });
    return observer;
  }
  const a11y = {
    init() {
      if (_initialized) return this;
      _liveRegion = _createLiveRegion();
      _updateFocusableElements();
      _applyReducedMotion();
      _setupKeyboardNavigation();
      _mutationObserver = _setupMutationObserver();
      _motionMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      _boundMotionChange = _applyReducedMotion;
      _motionMediaQuery.addEventListener("change", _boundMotionChange);
      _boundFocusTrap = _handleFocusTrap;
      _boundRovingTabindex = _handleRovingTabindex;
      container.addEventListener("keydown", _boundFocusTrap);
      container.addEventListener("keydown", _boundRovingTabindex);
      if (!container.hasAttribute("role")) container.setAttribute("role", "region");
      if (!container.hasAttribute("aria-label")) {
        const title = container.querySelector(".dsd-container__title");
        if (title) container.setAttribute("aria-label", title.textContent || "Container");
      }
      _initialized = true;
      return this;
    },
    enableFocusTrap() {
      _focusTrapActive = true;
      _previousActiveElement = document.activeElement;
      _updateFocusableElements();
      _firstFocusable?.focus();
      return this;
    },
    disableFocusTrap() {
      _focusTrapActive = false;
      _previousActiveElement?.focus();
      return this;
    },
    isFocusTrapActive() {
      return _focusTrapActive;
    },
    announce(message, priority = "polite") {
      if (!announceChanges || !_liveRegion) return this;
      if (typeof message !== "string") return this;
      _liveRegion.setAttribute("aria-live", priority);
      _liveRegion.textContent = "";
      requestAnimationFrame(() => {
        _liveRegion.textContent = message;
      });
      return this;
    },
    announcePolite(message) {
      return this.announce(message, "polite");
    },
    announceAssertive(message) {
      return this.announce(message, "assertive");
    },
    focusFirst() {
      _updateFocusableElements();
      _firstFocusable?.focus();
      return this;
    },
    focusLast() {
      _updateFocusableElements();
      _lastFocusable?.focus();
      return this;
    },
    focusElement(selector) {
      const el = container.querySelector(selector);
      if (el) {
        el.focus();
      }
      return this;
    },
    saveFocus() {
      _previousActiveElement = document.activeElement;
      return this;
    },
    restoreFocus() {
      _previousActiveElement?.focus();
      return this;
    },
    getFocusableElements() {
      _updateFocusableElements();
      return [..._focusableElements];
    },
    prefersReducedMotion() {
      return _checkReducedMotion();
    },
    setAriaLabel(label) {
      if (typeof label === "string") container.setAttribute("aria-label", label);
      return this;
    },
    setAriaBusy(busy) {
      container.setAttribute("aria-busy", String(!!busy));
      if (busy) this.announce("Carregando...");
      return this;
    },
    // @ts-expect-error strict migration — TS2322
    setAriaExpanded(element, expanded) {
      if (typeof element === "string") element = container.querySelector(element);
      element?.setAttribute("aria-expanded", String(!!expanded));
      return this;
    },
    // @ts-expect-error strict migration — TS2322
    setAriaHidden(element, hidden) {
      if (typeof element === "string") element = container.querySelector(element);
      element?.setAttribute("aria-hidden", String(!!hidden));
      return this;
    },
    initRovingTabindex(groupSelector, itemSelector) {
      const group = container.querySelector(groupSelector);
      if (!group) return this;
      const items = group.querySelectorAll(itemSelector);
      items.forEach((item, i) => item.setAttribute("tabindex", i === 0 ? "0" : "-1"));
      return this;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _mutationObserver?.disconnect();
      _mutationObserver = null;
      if (_motionMediaQuery && _boundMotionChange) _motionMediaQuery.removeEventListener("change", _boundMotionChange);
      if (_boundFocusTrap) container.removeEventListener("keydown", _boundFocusTrap);
      if (_boundRovingTabindex) container.removeEventListener("keydown", _boundRovingTabindex);
      _boundFocusTrap = null;
      _boundRovingTabindex = null;
      _boundMotionChange = null;
      _liveRegion?.remove();
      _liveRegion = null;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, focusTrapActive: _focusTrapActive, focusableCount: _focusableElements.length, prefersReducedMotion: _checkReducedMotion(), domOnly: true, hasValidation: true };
    }
  };
  return a11y;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, domOnly: true, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, domOnly: true, hasValidation: true };
}
var accessibility_default = { createAccessibility, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createAccessibility,
  accessibility_default as default,
  healthCheck,
  info
};

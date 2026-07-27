import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-notification-badge";
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
function _emitEvent(eventType, payload) {
  const eb = _getEventBus();
  if (eb?.emit) {
    eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
    return true;
  }
  return false;
}
const BADGE_VARIANTS = { DEFAULT: "default", SUCCESS: "success", WARNING: "warning", ERROR: "error", INFO: "info" };
function createNotificationBadge(container, options = {}) {
  const { position = "top-right", maxCount = 99, showZero = false, animate = true, variant = BADGE_VARIANTS.DEFAULT, onClick, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _count = 0;
  let _badgeEl = null;
  let _variant = variant;
  let _visible = false;
  let _flashInterval = null;
  let _clickHandler = null;
  function _createBadgeElement() {
    const header = container.querySelector(".dsd-container__header");
    if (!header) return null;
    let existing = header.querySelector(".dsd-notification-badge");
    if (existing) return existing;
    const badge2 = document.createElement("div");
    badge2.className = `dsd-notification-badge dsd-notification-badge--${position}`;
    badge2.setAttribute("role", "status");
    badge2.setAttribute("aria-live", "polite");
    badge2.innerHTML = `<span class="dsd-notification-badge__count">0</span><span class="dsd-notification-badge__pulse"></span>`;
    const titleEl = header.querySelector(".dsd-container__title");
    if (titleEl) {
      titleEl.style.position = "relative";
      titleEl.appendChild(badge2);
    } else {
      header.style.position = "relative";
      header.appendChild(badge2);
    }
    if (onClick) {
      badge2.style.cursor = "pointer";
      _clickHandler = (e) => {
        e.stopPropagation();
        onClick(_count);
      };
      badge2.addEventListener("click", _clickHandler);
    }
    return badge2;
  }
  function _updateBadge() {
    if (!_badgeEl) return;
    const countEl = _badgeEl.querySelector(".dsd-notification-badge__count");
    const displayCount = _count > maxCount ? `${maxCount}+` : String(_count);
    if (countEl) countEl.textContent = displayCount;
    _badgeEl.setAttribute("aria-label", `${_count} notifica\xE7\xF5es`);
    const shouldShow = _count > 0 || showZero;
    _badgeEl.classList.toggle("dsd-notification-badge--visible", shouldShow);
    _badgeEl.classList.toggle("dsd-notification-badge--hidden", !shouldShow);
    _visible = shouldShow;
    Object.values(BADGE_VARIANTS).forEach((v) => {
      _badgeEl.classList.remove(`dsd-notification-badge--${v}`);
    });
    _badgeEl.classList.add(`dsd-notification-badge--${_variant}`);
    if (animate && _count > 0) {
      _badgeEl.classList.add("dsd-notification-badge--bump");
      setTimeout(() => {
        _badgeEl?.classList.remove("dsd-notification-badge--bump");
      }, 300);
    }
  }
  const badge = {
    init() {
      if (_initialized) return this;
      _badgeEl = _createBadgeElement();
      _updateBadge();
      _initialized = true;
      return this;
    },
    setCount(count) {
      const prevCount = _count;
      _count = Math.max(0, Math.floor(count));
      _updateBadge();
      if (_count !== prevCount) _emitEvent(MAIN_EVENTS.BADGE_CHANGE, { count: _count, prevCount, containerId: container.id });
      return this;
    },
    increment(amount = 1) {
      return badge.setCount(_count + amount);
    },
    decrement(amount = 1) {
      return badge.setCount(_count - amount);
    },
    clear() {
      return badge.setCount(0);
    },
    getCount() {
      return _count;
    },
    setVariant(v) {
      if (Object.values(BADGE_VARIANTS).includes(v)) {
        _variant = v;
        _updateBadge();
      }
      return this;
    },
    getVariant() {
      return _variant;
    },
    pulse() {
      if (!_badgeEl) return this;
      _badgeEl.classList.add("dsd-notification-badge--pulse-active");
      setTimeout(() => {
        _badgeEl?.classList.remove("dsd-notification-badge--pulse-active");
      }, 1e3);
      return this;
    },
    flash(times = 3) {
      if (!_badgeEl) return this;
      if (_flashInterval) clearInterval(_flashInterval);
      let count = 0;
      _flashInterval = setInterval(() => {
        _badgeEl?.classList.toggle("dsd-notification-badge--flash");
        count++;
        if (count >= times * 2) {
          clearInterval(_flashInterval);
          _flashInterval = null;
          _badgeEl?.classList.remove("dsd-notification-badge--flash");
        }
      }, 200);
      return this;
    },
    isVisible() {
      return _visible;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      if (_flashInterval) {
        clearInterval(_flashInterval);
        _flashInterval = null;
      }
      if (_badgeEl && _clickHandler) {
        _badgeEl.removeEventListener("click", _clickHandler);
        _clickHandler = null;
      }
      _badgeEl?.remove();
      _badgeEl = null;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, count: _count, variant: _variant, visible: _visible, hasInjectedEventBus: !!_injectedEventBus };
    }
  };
  return badge;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus };
}
var notification_badge_default = { createNotificationBadge, injectEventBus, info, healthCheck, VERSION, MODULE_ID, BADGE_VARIANTS };
export {
  BADGE_VARIANTS,
  MODULE_ID,
  VERSION,
  createNotificationBadge,
  notification_badge_default as default,
  healthCheck,
  info,
  injectEventBus
};

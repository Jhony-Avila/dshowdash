const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-popover";
let _injectedEventBus = null;
let _activePopovers = /* @__PURE__ */ new Map();
let _popoverCounter = 0;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _emitEvent(eventType, payload) {
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}
const POPOVER_POSITION = {
  TOP: "top",
  TOP_START: "top-start",
  TOP_END: "top-end",
  BOTTOM: "bottom",
  BOTTOM_START: "bottom-start",
  BOTTOM_END: "bottom-end",
  LEFT: "left",
  LEFT_START: "left-start",
  LEFT_END: "left-end",
  RIGHT: "right",
  RIGHT_START: "right-start",
  RIGHT_END: "right-end"
};
const POPOVER_TRIGGER = { CLICK: "click", HOVER: "hover", FOCUS: "focus", MANUAL: "manual" };
function createPopover(triggerElement, options = {}) {
  const {
    content = "",
    position = POPOVER_POSITION.BOTTOM,
    trigger = POPOVER_TRIGGER.CLICK,
    offset = 8,
    showArrow = true,
    closeOnClickOutside = true,
    closeOnEscape = true,
    showDelay = 0,
    hideDelay = 0,
    className = "",
    onShow,
    onHide,
    eventBus
  } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  const popoverId = `popover-${++_popoverCounter}`;
  let _isOpen = false;
  let _popoverEl = null;
  let _showTimeout = null;
  let _hideTimeout = null;
  let _clickOutsideHandler = null;
  let _keydownHandler = null;
  let _hoverHandlers = {};
  function _createPopoverElement() {
    const popover2 = document.createElement("div");
    popover2.id = popoverId;
    popover2.className = `dsd-popover dsd-popover--${position.split("-")[0]} ${className}`.trim();
    popover2.setAttribute("role", "dialog");
    popover2.setAttribute("aria-hidden", "true");
    popover2.tabIndex = -1;
    let contentHtml = typeof content === "string" ? content : "";
    popover2.innerHTML = `
      ${showArrow ? '<div class="dsd-popover__arrow"></div>' : ""}
      <div class="dsd-popover__content">${contentHtml}</div>
    `;
    if (content instanceof HTMLElement) {
      popover2.querySelector(".dsd-popover__content").appendChild(content);
    }
    return popover2;
  }
  function _positionPopover() {
    if (!_popoverEl || !triggerElement) return;
    const triggerRect = triggerElement.getBoundingClientRect();
    const popoverRect = _popoverEl.getBoundingClientRect();
    let top = 0;
    let left = 0;
    const [mainPos, align = "center"] = position.split("-");
    switch (mainPos) {
      case "top":
        top = triggerRect.top - popoverRect.height - offset;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;
      case "left":
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.left - popoverRect.width - offset;
        break;
      case "right":
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.right + offset;
        break;
    }
    if (mainPos === "top" || mainPos === "bottom") {
      if (align === "start") left = triggerRect.left;
      else if (align === "end") left = triggerRect.right - popoverRect.width;
    } else {
      if (align === "start") top = triggerRect.top;
      else if (align === "end") top = triggerRect.bottom - popoverRect.height;
    }
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - popoverRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - popoverRect.height - padding));
    _popoverEl.style.top = `${top + window.scrollY}px`;
    _popoverEl.style.left = `${left + window.scrollX}px`;
  }
  function _handleClickOutside(e) {
    if (!_popoverEl?.contains(e.target) && !triggerElement?.contains(e.target)) {
      popover.hide();
    }
  }
  function _handleKeydown(e) {
    if (e.key === "Escape" && closeOnEscape) {
      popover.hide();
      triggerElement?.focus();
    }
  }
  const popover = {
    show() {
      if (_isOpen) return this;
      if (_hideTimeout) {
        clearTimeout(_hideTimeout);
        _hideTimeout = null;
      }
      const doShow = () => {
        if (!_popoverEl) {
          _popoverEl = _createPopoverElement();
          document.body.appendChild(_popoverEl);
        }
        _popoverEl.classList.add("dsd-popover--visible");
        _popoverEl.setAttribute("aria-hidden", "false");
        triggerElement?.setAttribute("aria-expanded", "true");
        requestAnimationFrame(() => _positionPopover());
        if (closeOnClickOutside && trigger !== POPOVER_TRIGGER.HOVER) {
          _clickOutsideHandler = _handleClickOutside;
          setTimeout(() => document.addEventListener("click", _clickOutsideHandler), 0);
        }
        _keydownHandler = _handleKeydown;
        document.addEventListener("keydown", _keydownHandler);
        _isOpen = true;
        _activePopovers.set(popoverId, this);
        _emitEvent("popover:show", { popoverId });
        onShow?.();
      };
      if (showDelay > 0) {
        _showTimeout = setTimeout(doShow, showDelay);
      } else {
        doShow();
      }
      return this;
    },
    hide() {
      if (!_isOpen) return this;
      if (_showTimeout) {
        clearTimeout(_showTimeout);
        _showTimeout = null;
      }
      const doHide = () => {
        _popoverEl?.classList.remove("dsd-popover--visible");
        _popoverEl?.setAttribute("aria-hidden", "true");
        triggerElement?.setAttribute("aria-expanded", "false");
        if (_clickOutsideHandler) document.removeEventListener("click", _clickOutsideHandler);
        if (_keydownHandler) document.removeEventListener("keydown", _keydownHandler);
        _isOpen = false;
        _activePopovers.delete(popoverId);
        _emitEvent("popover:hide", { popoverId });
        onHide?.();
      };
      if (hideDelay > 0) {
        _hideTimeout = setTimeout(doHide, hideDelay);
      } else {
        doHide();
      }
      return this;
    },
    toggle() {
      return _isOpen ? this.hide() : this.show();
    },
    setContent(newContent) {
      const contentEl = _popoverEl?.querySelector(".dsd-popover__content");
      if (!contentEl) return this;
      if (typeof newContent === "string") contentEl.innerHTML = newContent;
      else if (newContent instanceof HTMLElement) {
        contentEl.innerHTML = "";
        contentEl.appendChild(newContent);
      }
      if (_isOpen) _positionPopover();
      return this;
    },
    reposition() {
      _positionPopover();
      return this;
    },
    isOpen() {
      return _isOpen;
    },
    getId() {
      return popoverId;
    },
    getElement() {
      return _popoverEl;
    },
    destroy() {
      this.hide();
      _popoverEl?.remove();
      _popoverEl = null;
      if (_hoverHandlers.enter) triggerElement?.removeEventListener("mouseenter", _hoverHandlers.enter);
      if (_hoverHandlers.leave) triggerElement?.removeEventListener("mouseleave", _hoverHandlers.leave);
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, popoverId, isOpen: _isOpen, hasEventBus: !!_injectedEventBus };
    }
  };
  if (triggerElement) {
    triggerElement.setAttribute("aria-haspopup", "dialog");
    triggerElement.setAttribute("aria-expanded", "false");
    switch (trigger) {
      case POPOVER_TRIGGER.CLICK:
        triggerElement.addEventListener("click", () => popover.toggle());
        break;
      case POPOVER_TRIGGER.HOVER:
        _hoverHandlers.enter = () => popover.show();
        _hoverHandlers.leave = () => popover.hide();
        triggerElement.addEventListener("mouseenter", _hoverHandlers.enter);
        triggerElement.addEventListener("mouseleave", _hoverHandlers.leave);
        break;
      case POPOVER_TRIGGER.FOCUS:
        triggerElement.addEventListener("focus", () => popover.show());
        triggerElement.addEventListener("blur", () => popover.hide());
        break;
    }
  }
  return popover;
}
function closeAll() {
  [..._activePopovers.values()].forEach((p) => p.hide());
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, activeCount: _activePopovers.size, hasEventBus: !!_injectedEventBus };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, activeCount: _activePopovers.size, hasEventBus: !!_injectedEventBus };
}
var popover_default = {
  createPopover,
  closeAll,
  injectEventBus,
  info,
  healthCheck,
  VERSION,
  MODULE_ID,
  POPOVER_POSITION,
  POPOVER_TRIGGER
};
export {
  MODULE_ID,
  POPOVER_POSITION,
  POPOVER_TRIGGER,
  VERSION,
  closeAll,
  createPopover,
  popover_default as default,
  healthCheck,
  info,
  injectEventBus
};

import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:tooltip-manager";
const POSITIONS = Object.freeze({ TOP: "top", BOTTOM: "bottom", LEFT: "left", RIGHT: "right", AUTO: "auto" });
const TRIGGERS = Object.freeze({ HOVER: "hover", CLICK: "click", FOCUS: "focus", MANUAL: "manual" });
function createTooltipManager(options = {}) {
  const { defaultPosition = POSITIONS.TOP, defaultTrigger = TRIGGERS.HOVER, showDelay = 200, hideDelay = 100, offset = 8, maxWidth = 300, zIndex = 9999, animation = "fade", theme = "dark" } = options;
  const _logger = createLogger(MODULE_ID);
  const _tooltips = /* @__PURE__ */ new Map();
  let _activeTooltip = null;
  let _container = null;
  let _counter = 0;
  let _metrics = { shown: 0, hidden: 0 };
  const STYLES = `
    .cm-tooltip-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: ${zIndex}; }
    .cm-tooltip { position: absolute; padding: 8px 12px; border-radius: 6px; font-size: 13px; line-height: 1.4; max-width: ${maxWidth}px; word-wrap: break-word; opacity: 0; transform: scale(0.95); transition: opacity 0.15s ease, transform 0.15s ease; pointer-events: none; }
    .cm-tooltip.visible { opacity: 1; transform: scale(1); }
    .cm-tooltip.theme-dark { background: #1a1a2e; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .cm-tooltip.theme-light { background: #fff; color: #1a1a2e; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e0e0e0; }
    .cm-tooltip-arrow { position: absolute; width: 8px; height: 8px; transform: rotate(45deg); }
    .cm-tooltip.theme-dark .cm-tooltip-arrow { background: #1a1a2e; }
    .cm-tooltip.theme-light .cm-tooltip-arrow { background: #fff; border: 1px solid #e0e0e0; }
    .cm-tooltip.pos-top .cm-tooltip-arrow { bottom: -4px; left: 50%; margin-left: -4px; border-top: none; border-left: none; }
    .cm-tooltip.pos-bottom .cm-tooltip-arrow { top: -4px; left: 50%; margin-left: -4px; border-bottom: none; border-right: none; }
    .cm-tooltip.pos-left .cm-tooltip-arrow { right: -4px; top: 50%; margin-top: -4px; border-left: none; border-bottom: none; }
    .cm-tooltip.pos-right .cm-tooltip-arrow { left: -4px; top: 50%; margin-top: -4px; border-right: none; border-top: none; }
  `;
  function _injectStyles() {
    if (document.getElementById("cm-tooltip-styles")) return;
    const style = document.createElement("style");
    style.id = "cm-tooltip-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }
  function _createContainer() {
    if (_container) return;
    _container = document.createElement("div");
    _container.className = "cm-tooltip-container";
    document.body.appendChild(_container);
  }
  function _calculatePosition(targetRect, tooltipRect, position) {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    let pos = position;
    if (pos === POSITIONS.AUTO) {
      const spaceTop = targetRect.top;
      const spaceBottom = viewport.height - targetRect.bottom;
      const spaceLeft = targetRect.left;
      const spaceRight = viewport.width - targetRect.right;
      const max = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
      if (max === spaceTop) pos = POSITIONS.TOP;
      else if (max === spaceBottom) pos = POSITIONS.BOTTOM;
      else if (max === spaceLeft) pos = POSITIONS.LEFT;
      else pos = POSITIONS.RIGHT;
    }
    let x, y;
    switch (pos) {
      case POSITIONS.TOP:
        x = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        y = targetRect.top - tooltipRect.height - Number(offset);
        break;
      case POSITIONS.BOTTOM:
        x = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        y = targetRect.bottom + Number(offset);
        break;
      case POSITIONS.LEFT:
        x = targetRect.left - tooltipRect.width - Number(offset);
        y = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        break;
      case POSITIONS.RIGHT:
        x = targetRect.right + Number(offset);
        y = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        break;
    }
    x = Math.max(8, Math.min(x, viewport.width - tooltipRect.width - 8));
    y = Math.max(8, Math.min(y, viewport.height - tooltipRect.height - 8));
    return { x, y, position: pos };
  }
  function _showTooltip(config) {
    _createContainer();
    _injectStyles();
    if (_activeTooltip) _hideTooltip(_activeTooltip);
    const tooltip = document.createElement("div");
    tooltip.className = `cm-tooltip theme-${config.theme || theme}`;
    tooltip.innerHTML = `${config.html ? config.content : `<span>${config.content}</span>`}<div class="cm-tooltip-arrow"></div>`;
    _container.appendChild(tooltip);
    const targetRect = config.target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const { x, y, position } = _calculatePosition(targetRect, tooltipRect, config.position || defaultPosition);
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.classList.add(`pos-${position}`);
    requestAnimationFrame(() => tooltip.classList.add("visible"));
    _activeTooltip = { id: config.id, element: tooltip, config };
    _metrics.shown++;
  }
  function _hideTooltip(tooltipData) {
    if (!tooltipData) return;
    tooltipData.element.classList.remove("visible");
    setTimeout(() => tooltipData.element.remove(), 150);
    if (_activeTooltip?.id === tooltipData.id) _activeTooltip = null;
    _metrics.hidden++;
  }
  const manager = {
    register(element, content, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      const id = `tooltip-${++_counter}`;
      const config = { id, target: element, content, position: options2.position || defaultPosition, trigger: options2.trigger || defaultTrigger, theme: options2.theme || theme, html: options2.html || false, showDelay: options2.showDelay ?? showDelay, hideDelay: options2.hideDelay ?? hideDelay };
      let showTimer = null, hideTimer = null;
      const show = () => {
        clearTimeout(hideTimer);
        showTimer = setTimeout(() => _showTooltip(config), Number(config.showDelay));
      };
      const hide = () => {
        clearTimeout(showTimer);
        hideTimer = setTimeout(() => _hideTooltip(_activeTooltip), Number(config.hideDelay));
      };
      const handlers = {};
      if (config.trigger === TRIGGERS.HOVER) {
        handlers.mouseenter = show;
        handlers.mouseleave = hide;
        element.addEventListener("mouseenter", handlers.mouseenter);
        element.addEventListener("mouseleave", handlers.mouseleave);
      } else if (config.trigger === TRIGGERS.CLICK) {
        handlers.click = () => _activeTooltip?.id === id ? hide() : show();
        element.addEventListener("click", handlers.click);
      } else if (config.trigger === TRIGGERS.FOCUS) {
        handlers.focus = show;
        handlers.blur = hide;
        element.addEventListener("focus", handlers.focus);
        element.addEventListener("blur", handlers.blur);
      }
      _tooltips.set(id, { config, handlers, showTimer: null, hideTimer: null });
      element.dataset.tooltipId = id;
      return id;
    },
    unregister(id) {
      const tooltip = _tooltips.get(id);
      if (!tooltip) return;
      const el = tooltip.config.target;
      for (const [event, handler] of Object.entries(tooltip.handlers)) {
        el.removeEventListener(event, handler);
      }
      delete el.dataset.tooltipId;
      _tooltips.delete(id);
    },
    show(id) {
      const t = _tooltips.get(id);
      if (t) _showTooltip(t.config);
    },
    // @ts-expect-error TS migration - TS2339
    hide(id) {
      if (_activeTooltip?.id === id) _hideTooltip(_activeTooltip);
    },
    hideAll() {
      if (_activeTooltip) _hideTooltip(_activeTooltip);
    },
    updateContent(id, content) {
      const t = _tooltips.get(id);
      if (t) {
        t.config.content = content;
        if (_activeTooltip?.id === id) {
          _hideTooltip(_activeTooltip);
          _showTooltip(t.config);
        }
      }
    },
    getMetrics() {
      return { ..._metrics, registered: _tooltips.size };
    },
    resetMetrics() {
      _metrics = { shown: 0, hidden: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, registered: _tooltips.size, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, registered: _tooltips.size, positions: Object.keys(POSITIONS), triggers: Object.keys(TRIGGERS) };
    },
    destroy() {
      _tooltips.forEach((_, id) => this.unregister(id));
      if (_container) {
        _container.remove();
        _container = null;
      }
      const styles = document.getElementById("cm-tooltip-styles");
      if (styles) styles.remove();
    }
  };
  return manager;
}
let _instance = null;
function getTooltipManager(options = {}) {
  if (!_instance) _instance = createTooltipManager(options);
  return _instance;
}
function resetTooltipManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, positions: Object.keys(POSITIONS), triggers: Object.keys(TRIGGERS) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var tooltip_manager_default = { VERSION, MODULE_ID, POSITIONS, TRIGGERS, createTooltipManager, getTooltipManager, resetTooltipManager, info, healthCheck };
export {
  MODULE_ID,
  POSITIONS,
  TRIGGERS,
  VERSION,
  createTooltipManager,
  tooltip_manager_default as default,
  getTooltipManager,
  healthCheck,
  info,
  resetTooltipManager
};

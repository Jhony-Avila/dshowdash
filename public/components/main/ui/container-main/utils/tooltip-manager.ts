// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:tooltip-manager
// PURPOSE: Tooltip Manager - Sistema de tooltips customizáveis
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   POSITIONS — exported value
//   TRIGGERS — exported value
//   createTooltipManager() — exported function
//   getTooltipManager() — exported function
//   resetTooltipManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'blur'
//   'click'
//   'focus'
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   window.innerHeight
//   window.innerWidth
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:tooltip-manager';

export const POSITIONS = Object.freeze({ TOP: 'top', BOTTOM: 'bottom', LEFT: 'left', RIGHT: 'right', AUTO: 'auto' });
export const TRIGGERS = Object.freeze({ HOVER: 'hover', CLICK: 'click', FOCUS: 'focus', MANUAL: 'manual' });

export function createTooltipManager(options: Record<string, unknown> = {}) {
  const { defaultPosition = POSITIONS.TOP, defaultTrigger = TRIGGERS.HOVER, showDelay = 200, hideDelay = 100, offset = 8, maxWidth = 300, zIndex = 9999, animation = 'fade', theme = 'dark' } = options;

  const _logger = createLogger(MODULE_ID);
  const _tooltips = new Map();
  let _activeTooltip: unknown = null;
  let _container: HTMLElement | null = null;
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
    if (document.getElementById('cm-tooltip-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-tooltip-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function _createContainer() {
    if (_container) return;
    _container = document.createElement('div');
    _container.className = 'cm-tooltip-container';
    document.body.appendChild(_container);
  }

  function _calculatePosition(targetRect: Record<string, unknown>, tooltipRect: Record<string, unknown>, position: string) {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    let pos = position;

    if (pos === POSITIONS.AUTO) {
      const spaceTop = targetRect.top;
      const spaceBottom = viewport.height - (targetRect.bottom as number);
      const spaceLeft = targetRect.left;
      const spaceRight = viewport.width - (targetRect.right as number);
      const max = Math.max((spaceTop as number), spaceBottom, (spaceLeft as number), spaceRight);
      if (max === spaceTop) pos = POSITIONS.TOP;
      else if (max === spaceBottom) pos = POSITIONS.BOTTOM;
      else if (max === spaceLeft) pos = POSITIONS.LEFT;
      else pos = POSITIONS.RIGHT;
    }

    let x, y;
    switch (pos) {
      case POSITIONS.TOP:
        x = (targetRect.left as number) + ((targetRect.width as number) - (tooltipRect.width as number)) / 2;
        y = (targetRect.top as number) - (tooltipRect.height as number) - Number(offset);
        break;
      case POSITIONS.BOTTOM:
        x = (targetRect.left as number) + ((targetRect.width as number) - (tooltipRect.width as number)) / 2;
        y = (targetRect.bottom as number) + Number(offset);
        break;
      case POSITIONS.LEFT:
        x = (targetRect.left as number) - (tooltipRect.width as number) - Number(offset);
        y = (targetRect.top as number) + ((targetRect.height as number) - (tooltipRect.height as number)) / 2;
        break;
      case POSITIONS.RIGHT:
        x = (targetRect.right as number) + Number(offset);
        y = (targetRect.top as number) + ((targetRect.height as number) - (tooltipRect.height as number)) / 2;
        break;
    }

    // @ts-expect-error strict migration — TS2345
    x = Math.max(8, Math.min(x, viewport.width - (tooltipRect.width as number) - 8));
    // @ts-expect-error strict migration — TS2345
    y = Math.max(8, Math.min(y, viewport.height - (tooltipRect.height as number) - 8));

    return { x, y, position: pos };
  }

  function _showTooltip(config: Record<string, unknown>) {
    _createContainer();
    _injectStyles();

    if (_activeTooltip) _hideTooltip((_activeTooltip as Record<string, unknown>));

    const tooltip = document.createElement('div');
    tooltip.className = `cm-tooltip theme-${config.theme || theme}`;
    tooltip.innerHTML = `${config.html ? config.content : `<span>${config.content}</span>`}<div class="cm-tooltip-arrow"></div>`;
    _container!.appendChild(tooltip);

    const targetRect = (config.target as HTMLElement).getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    // @ts-expect-error TS migration - TS2345
    const { x, y, position } = _calculatePosition(targetRect, tooltipRect, config.position || defaultPosition);

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.classList.add(`pos-${position}`);

    requestAnimationFrame(() => tooltip.classList.add('visible'));

    _activeTooltip = { id: config.id, element: tooltip, config };
    _metrics.shown++;
  }

  function _hideTooltip(tooltipData: Record<string, unknown>) {
    if (!tooltipData) return;
    (tooltipData.element as HTMLElement).classList.remove('visible');
    setTimeout(() => (tooltipData.element as HTMLElement).remove(), 150);
    // @ts-expect-error TS migration - TS2339
    if (_activeTooltip?.id === tooltipData.id) _activeTooltip = null;
    _metrics.hidden++;
  }

  const manager = {
    register(element: HTMLElement, content: string, options: Record<string, unknown> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      const id = `tooltip-${++_counter}`;
      const config = { id, target: element, content, position: options.position || defaultPosition, trigger: options.trigger || defaultTrigger, theme: options.theme || theme, html: options.html || false, showDelay: options.showDelay ?? showDelay, hideDelay: options.hideDelay ?? hideDelay };

      let showTimer: ReturnType<typeof setTimeout> | null = null, hideTimer: ReturnType<typeof setTimeout> | null = null;

      // @ts-expect-error strict migration — TS2769
      const show = () => { clearTimeout(hideTimer); showTimer = setTimeout(() => _showTooltip(config), Number(config.showDelay)); };
      // @ts-expect-error strict migration — TS2769
      const hide = () => { clearTimeout(showTimer); hideTimer = setTimeout(() => _hideTooltip((_activeTooltip as Record<string, unknown>)), Number(config.hideDelay)); };

      const handlers: Record<string, unknown> = {};
      if (config.trigger === TRIGGERS.HOVER) {
        handlers.mouseenter = show;
        handlers.mouseleave = hide;
        // @ts-expect-error TS migration - TS2769
        element.addEventListener('mouseenter', handlers.mouseenter);
        // @ts-expect-error TS migration - TS2769
        element.addEventListener('mouseleave', handlers.mouseleave);
      } else if (config.trigger === TRIGGERS.CLICK) {
        // @ts-expect-error TS migration - TS2339
        handlers.click = () => _activeTooltip?.id === id ? hide() : show();
        // @ts-expect-error TS migration - TS2769
        element.addEventListener('click', handlers.click);
      } else if (config.trigger === TRIGGERS.FOCUS) {
        handlers.focus = show;
        handlers.blur = hide;
        // @ts-expect-error TS migration - TS2769
        element.addEventListener('focus', handlers.focus);
        // @ts-expect-error TS migration - TS2769
        element.addEventListener('blur', handlers.blur);
      }

      _tooltips.set(id, { config, handlers, showTimer: null, hideTimer: null });
      element.dataset.tooltipId = id;
      return id;
    },

    unregister(id: string) {
      const tooltip = _tooltips.get(id);
      if (!tooltip) return;
      const el = tooltip.config.target;
      for (const [event, handler] of Object.entries(tooltip.handlers)) {
        el.removeEventListener(event, handler);
      }
      delete el.dataset.tooltipId;
      _tooltips.delete(id);
    },

    show(id: string) { const t = _tooltips.get(id); if (t) _showTooltip(t.config); },
    // @ts-expect-error TS migration - TS2339
    hide(id: string) { if (_activeTooltip?.id === id) _hideTooltip((_activeTooltip as Record<string, unknown>)); },
    hideAll() { if (_activeTooltip) _hideTooltip((_activeTooltip as Record<string, unknown>)); },

    updateContent(id: string, content: string) {
      const t = _tooltips.get(id);
      // @ts-expect-error TS migration - TS2339
      if (t) { t.config.content = content; if (_activeTooltip?.id === id) { _hideTooltip((_activeTooltip as Record<string, unknown>)); _showTooltip(t.config); } }
    },

    getMetrics() { return { ..._metrics, registered: _tooltips.size }; },
    resetMetrics() { _metrics = { shown: 0, hidden: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, registered: _tooltips.size, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, registered: _tooltips.size, positions: Object.keys(POSITIONS), triggers: Object.keys(TRIGGERS) }; },

    destroy() {
      _tooltips.forEach((_, id) => this.unregister(id));
      if (_container) { _container.remove(); _container = null; }
      const styles = document.getElementById('cm-tooltip-styles');
      if (styles) styles.remove();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getTooltipManager(options: Record<string, unknown> = {}) { if (!_instance) _instance = createTooltipManager(options); return _instance; }
export function resetTooltipManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function info() { return { moduleId: MODULE_ID, version: VERSION, positions: Object.keys(POSITIONS), triggers: Object.keys(TRIGGERS) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, POSITIONS, TRIGGERS, createTooltipManager, getTooltipManager, resetTooltipManager, info, healthCheck };

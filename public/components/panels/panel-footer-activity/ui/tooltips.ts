// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P22-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-footer-activity/ui/tooltips
// PURPOSE: Footer Activity - Tooltips (Autocontido AAA)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   show() — exported function
//   hide() — exported function
//   attach() — exported function
//   detach() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'blur'
//   'focus'
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-footer-activity/ui/tooltips';

let _tooltip: HTMLElement | null = null;
let _container: HTMLElement | null = null;
const _attachedElements = new WeakMap();
let _metrics = { attached: 0, detached: 0 };

function _ensureContainer() {
  if (!_container) {
    _container = document.createElement('div');
    _container.className = 'panel-tooltip-container';
    _container.setAttribute('data-tooltip-owner', MODULE_ID);
    _container.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:10000;pointer-events:none;';
    const panel = document.querySelector('[data-panel="panel-footer-activity"]') || document.querySelector('.panel-footer-activity');
    (panel || document.documentElement).appendChild(_container);
  }
  return _container;
}

function _ensureTooltip() {
  if (!_tooltip) {
    _tooltip = document.createElement('div');
    _tooltip.className = 'tooltip';
    _tooltip.style.cssText = 'position:fixed;padding:0.5rem 0.75rem;background:#333;color:#fff;font-size:0.75rem;border-radius:0.25rem;pointer-events:none;opacity:0;transition:opacity 0.2s;white-space:nowrap;';
    _ensureContainer().appendChild(_tooltip);
  }
  return _tooltip;
}

export function show(element: HTMLElement, text: string, position = 'top') {
  const tooltip = _ensureTooltip();
  tooltip.textContent = text;
  tooltip.style.opacity = '1';
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  let top, left;
  switch (position) {
    case 'bottom': top = rect.bottom + 8; left = rect.left + (rect.width - tooltipRect.width) / 2; break;
    case 'left': top = rect.top + (rect.height - tooltipRect.height) / 2; left = rect.left - tooltipRect.width - 8; break;
    case 'right': top = rect.top + (rect.height - tooltipRect.height) / 2; left = rect.right + 8; break;
    default: top = rect.top - tooltipRect.height - 8; left = rect.left + (rect.width - tooltipRect.width) / 2;
  }
  tooltip.style.top = `${Math.max(4, top)}px`;
  tooltip.style.left = `${Math.max(4, left)}px`;
}

export function hide() { if (_tooltip) _tooltip.style.opacity = '0'; }

export function attach(element: HTMLElement, text: string, position: string) {
  if (_attachedElements.has(element)) return false;
  const handlers = { mouseenter: () => show(element, text, position), mouseleave: hide, focus: () => show(element, text, position), blur: hide };
  element.addEventListener('mouseenter', handlers.mouseenter);
  element.addEventListener('mouseleave', handlers.mouseleave);
  element.addEventListener('focus', handlers.focus);
  element.addEventListener('blur', handlers.blur);
  _attachedElements.set(element, handlers);
  _metrics.attached++;
  return true;
}

export function detach(element: HTMLElement) {
  if (!_attachedElements.has(element)) return false;
  const handlers = _attachedElements.get(element);
  element.removeEventListener('mouseenter', handlers.mouseenter);
  element.removeEventListener('mouseleave', handlers.mouseleave);
  element.removeEventListener('focus', handlers.focus);
  element.removeEventListener('blur', handlers.blur);
  _attachedElements.delete(element);
  _metrics.detached++;
  return true;
}

export function destroy() { if (_container) { _container.remove(); _container = null; _tooltip = null; } _metrics = { attached: 0, detached: 0 }; }

export function getMetrics() { return { ..._metrics }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, noBodyAppend: true, p22Compliant: true, metrics: getMetrics(), timestamp: Date.now() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, p22Compliant: true, metrics: getMetrics(), healthCheck: healthCheck() }; }

export default { show, hide, attach, detach, destroy, getMetrics, healthCheck, info, VERSION, MODULE_ID };

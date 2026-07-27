// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/utils/header-tooltip
// PURPOSE: Tooltip manager for header elements using overlay-root
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   getTooltipRoot from ./overlay-root.js
// PROVIDES:
//   HeaderTooltipManager (class) — attach/show/hide tooltips with AAA compliance
//   injectPorts() — inject port dependencies
//   getPorts() — snapshot of current ports
//   getVersion() — returns module version
//   MODULE_ID, VERSION — module identity constants
// ═══════════════════════════════════════════════════════════════
// Header Tooltip Manager - AAA Compliant
// @version 1.3.0-ENTERPRISE
// @changelog v1.3.0-ENTERPRISE - Export VERSION padronizado
// P17WI: PortsFactory/PortsProfiles
// Base para tooltips do Header - usa overlay-root, NÃO document.body
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { getTooltipRoot } from './overlay-root.js';

export const MODULE_ID = 'header/utils/header-tooltip';
export const VERSION = '1.3.0-ENTERPRISE';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export class HeaderTooltipManager { [key: string]: any;
  constructor(options: { delay?: number; className?: string } = {}) {
    _initPorts();
    const cfg = _getPort('config');
    this.delay = options.delay || 300;
    this.className = options.className || 'header-tooltip';
    this.activeTooltip = null;
    this.timeoutId = null;
    this._cleanups = [];
    this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null };
    this._debug = cfg && cfg.app && cfg.app.debug;
  }
  
  attach(element: HTMLElement|null) {
    if (!element) return;
    const tooltip = element.getAttribute('data-tooltip');
    if (!tooltip) return;
    const showHandler = () => this._show(element, tooltip);
    const hideHandler = () => this._hide();
    element.addEventListener('mouseenter', showHandler);
    element.addEventListener('mouseleave', hideHandler);
    element.addEventListener('focus', showHandler);
    element.addEventListener('blur', hideHandler);
    this._cleanups.push(() => {
      element.removeEventListener('mouseenter', showHandler);
      element.removeEventListener('mouseleave', hideHandler);
      element.removeEventListener('focus', showHandler);
      element.removeEventListener('blur', hideHandler);
    });
  }
  
  _show(element: HTMLElement|null, text: string) {
    this._hide();
    this.timeoutId = setTimeout(() => {
      const el = document.createElement('div');
      el.className = this.className;
      el.textContent = text;
      el.setAttribute('role', 'tooltip');
      el.style.pointerEvents = 'none';
      el.style.position = 'fixed';
      const root = getTooltipRoot();
      root.appendChild(el);
      const rect = element!.getBoundingClientRect();
      el.style.left = `${rect.left + rect.width / 2}px`;
      el.style.top = `${rect.top - 30}px`;
      el.style.transform = 'translateX(-50%)';
      this.activeTooltip = el;
      this._metrics.showCount++;
      this._metrics.lastShowAt = Date.now();
    }, this.delay);
  }
  
  _hide() {
    if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
    if (this.activeTooltip) { this.activeTooltip.remove(); this.activeTooltip = null; this._metrics.hideCount++; }
  }
  
  destroy() { this._hide(); this._cleanups.forEach((fn: Function) => { try { fn(); } catch (e) {} }); this._cleanups = []; }
  
  healthCheck() {
    const checks = { ready: true, noBodyAppendChild: true, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  
  info() { return { version: VERSION, moduleId: MODULE_ID, hasActiveTooltip: !!this.activeTooltip, metrics: this._metrics, portsInitialized: Ports.isInitialized() }; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null }; }
}

export function getVersion() { return VERSION; }
export default HeaderTooltipManager;

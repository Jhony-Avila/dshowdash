
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: renderer
// PURPOSE: Sidebar UI - Renderer (Orquestrador)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   VERSION as MODULE_ID, CAPABILITIES from ./constants.js
//   CSS_CLASSES as C from ./constants.js
//   createTemplate, createTemplateElement from ./template.js
//   showOverlay, hideOverlay from ./overlay.js
//   renderNavigation, renderFallback from ./navigation-renderer.js
//   setActiveItem, setCollapsed, setMobileOpen, announce, filterItems, clearSearch from ./state-manager.js
//   createHealthCheck, createInfo from ./health.js
//   showSkeleton, hideSkeleton, setupRippleEffect, setLoading from ./visual-features.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createRenderer() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getMetrics() — exported function
//   MODULE_ID — module constant
//   CAPABILITIES — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.DEGRADED
// LISTENS (eventos):
//   'click'
//   'navigation:icons:updated' (window)
//   'navigation:items:changed' (window)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { VERSION as MODULE_ID, CAPABILITIES } from './constants.js';
import { CSS_CLASSES as C } from './constants.js';
import { createTemplate, createTemplateElement } from './template.js';
import { showOverlay, hideOverlay } from './overlay.js';
import { renderNavigation, renderFallback } from './navigation-renderer.js';
import { setActiveItem, setCollapsed, setMobileOpen, announce, filterItems, clearSearch } from './state-manager.js';
import { createHealthCheck, createInfo } from './health.js';
import { showSkeleton, hideSkeleton, setupRippleEffect, setLoading } from './visual-features.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.2.0-RELOAD-FIX';
export { MODULE_ID, CAPABILITIES };


const Ports = createUiPorts({ moduleId: MODULE_ID });

let _moduleMetrics = { instancesCreated: 0, activeInstances: 0 };
let _defaultInstance: DynObj | null = null;

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function expandSectionUI(sidebar: DynObj, sectionId: string, expandedSections: DynObj) {
  try {
    const section = sidebar?.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return false;
    section.classList.add(C.SECTION_EXPANDED);
    const items = section.querySelector(`.${C.SECTION_ITEMS}`);
    if (items) items.style.height = '';
    const btn = section.querySelector('[data-section-toggle]');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    expandedSections?.add(sectionId);
    return true;
  } catch (error: any) {
    return false;
  }
}

function collapseSectionUI(sidebar: DynObj, sectionId: string, expandedSections: DynObj) {
  try {
    const section = sidebar?.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return false;
    section.classList.remove(C.SECTION_EXPANDED);
    const items = section.querySelector(`.${C.SECTION_ITEMS}`);
    if (items) items.style.height = '0';
    const btn = section.querySelector('[data-section-toggle]');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    expandedSections?.delete(sectionId);
    return true;
  } catch (error: any) {
    return false;
  }
}

function toggleSectionUI(sidebar: DynObj, sectionId: string, expandedSections: DynObj) {
  if (expandedSections?.has(sectionId)) return collapseSectionUI(sidebar, sectionId, expandedSections);
  return expandSectionUI(sidebar, sectionId, expandedSections);
}

function syncExpandedSections(sidebar: DynObj, expandedIds: DynObj, expandedSections: DynObj) {
  try {
    expandedSections?.clear();
    expandedIds?.forEach((id: DynObj) => { expandSectionUI(sidebar, id, expandedSections); });
    return true;
  } catch (error: any) {
    return false;
  }
}

function preloadExpandedSections(expandedIds: DynObj, expandedSections: DynObj) {
  try {
    expandedSections?.clear();
    if (Array.isArray(expandedIds)) {
      expandedIds.forEach(id => { expandedSections?.add(id); });
    }
    return true;
  } catch (error: any) {
    return false;
  }
}

function setupAccordionHandlers(sidebar: DynObj, expandedSections: DynObj, onToggle: DynObj) {
  if (!sidebar) return null;
  const handler = (e: DynObj) => {
    const btn = (e.target as DynObj).closest('[data-section-toggle]');
    if (btn) {
      const sectionId = btn.getAttribute('data-section-toggle');
      if (onToggle) onToggle(sectionId);
    }
  };
  sidebar.addEventListener('click', handler);
  return handler;
}

function removeAccordionHandlers(sidebar: DynObj, handler: DynObj) {
  if (sidebar && handler) sidebar.removeEventListener('click', handler);
}

export class SidebarRenderer {
  [key: string]: any;
  constructor(options: DynObj = {}) {
    this._container = null;
    this._sidebar = null;
    this._options = options;
    this._activeItemId = null;
    this._mobileOpen = false;
    this._status = 'healthy';
    this._lastError = null;
    this._degradedComponents = [];
    this._initialized = false;
    this._metrics = { renders: 0, errors: 0 };
    this._expandedSections = new Set();
    this._sectionClickHandler = null;
    this._rippleCleanup = null;
    this._itemsChangedCallback = null;
    _moduleMetrics.instancesCreated++;
    _moduleMetrics.activeInstances++;
  }

  get status() { return this._status; }

  init() {
    try {
      _initPorts();
      this._initialized = true;
      this._status = 'healthy';
      // Listen for icon updates from panel-nav-admin
      this._navIconsHandler = () => { this.renderNavigation(); };
      window.addEventListener('navigation:icons:updated', this._navIconsHandler);
      // Listen for item changes (label edit, group change, etc.) from panel-nav-admin
      // Uses _itemsChangedCallback if set (full reload cycle), otherwise falls back to renderNavigation() (cache only)
      this._navItemsChangedHandler = () => {
        if (this._itemsChangedCallback) { this._itemsChangedCallback(); }
        else { this.renderNavigation(); }
      };
      window.addEventListener('navigation:items:changed', this._navItemsChangedHandler);
      return { success: true };
    } catch (error: any) {
      this._status = 'error';
      this._lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  _emitDegraded(component: DynObj, error: Error) {
    try {
      if (!this._degradedComponents.includes(component)) {
        this._degradedComponents.push(component);
      }
      this._status = 'degraded';
      this._lastError = error;
      const bus = _getPort('eventBus');
      if (bus?.emit) {
        bus.emit(SIDEBAR_EVENTS.DEGRADED, {
          source: MODULE_ID,
          component,
          error,
          degradedComponents: this._degradedComponents,
          timestamp: Date.now()
        });
      }
    } catch (e) {}
  }

  setItemsChangedCallback(fn: (() => void) | null) { this._itemsChangedCallback = fn; }

  setContainer(container: HTMLElement) { this._container = container; }

  render() {
    try {
      if (!this._container) {
        this._emitDegraded('container', 'No container provided' as DynObj);
        return { success: false, error: 'No container' };
      }
      if (typeof createTemplateElement === 'function') {
        const sidebarEl = createTemplateElement({ title: this._options.title || 'DshowDash' });
        this._container.textContent = '';
        this._container.appendChild(sidebarEl);
        this._sidebar = sidebarEl;
      } else {
        const html = createTemplate({ title: this._options.title || 'DshowDash' });
        this._container.innerHTML = html;
        this._sidebar = this._container.querySelector(`.${C.ROOT}`);
      }
      if (!this._sidebar) {
        this._emitDegraded('sidebar', 'Sidebar element not created' as DynObj);
        return { success: false, error: 'Sidebar element not created' };
      }
      this.renderNavigation();
      this._setupRipple();
      this._metrics.renders++;
      this._status = this._degradedComponents.length > 0 ? 'degraded' : 'healthy';
      return { success: true };
    } catch (error: any) {
      this._metrics.errors++;
      this._emitDegraded('render', error.message);
      this._renderFallback();
      return { success: false, error: error.message, fallback: true };
    }
  }

  renderNavigation() {
    const result = renderNavigation(this._sidebar, this._expandedSections, this._activeItemId, this._degradedComponents);
    if (result.success || result.fallback) {
      this._setupRipple();
    }
    return result;
  }

  _renderFallback() { this._sidebar = renderFallback(this._container); }

  _setupAccordionHandlers() {
    const self = this;
    if (this._sectionClickHandler) {
      removeAccordionHandlers(this._sidebar, this._sectionClickHandler);
    }
    this._sectionClickHandler = setupAccordionHandlers(this._sidebar, this._expandedSections, (sectionId: string) => self.toggleSectionUI(sectionId));
  }

  toggleSectionUI(sectionId: string) { return toggleSectionUI(this._sidebar, sectionId, this._expandedSections); }
  expandSectionUI(sectionId: string) { return expandSectionUI(this._sidebar, sectionId, this._expandedSections); }
  collapseSectionUI(sectionId: string) { return collapseSectionUI(this._sidebar, sectionId, this._expandedSections); }

  syncExpandedSections(expandedSectionIds: DynObj) { return syncExpandedSections(this._sidebar, expandedSectionIds, this._expandedSections); }
  preloadExpandedSections(expandedSectionIds: DynObj) { return preloadExpandedSections(expandedSectionIds, this._expandedSections); }

  setActiveItem(itemId: string) { this._activeItemId = itemId; return setActiveItem(this._sidebar, itemId, this._expandedSections); }
  setCollapsed(collapsed: boolean) { return setCollapsed(this._sidebar, collapsed); }
  setMobileOpen(open: boolean) { this._mobileOpen = open; return setMobileOpen(this._sidebar, open); }
  announce(message: string) { return announce(this._sidebar, message); }

  filterItems(query: string) {
    const result = filterItems(this._sidebar, query, this._expandedSections);
    this._setupRipple();
    return result;
  }

  clearSearch() { return clearSearch(this._sidebar, this._expandedSections); }
  showSkeleton(itemCount = 8) {
    return showSkeleton(this._sidebar, itemCount);
  }

  hideSkeleton() {
    const result = hideSkeleton(this._sidebar);
    if (result) { this.renderNavigation(); }
    return result;
  }

  setLoading(loading: boolean) { return setLoading(this._sidebar, loading); }

  _setupRipple() {
    if (this._rippleCleanup) { this._rippleCleanup(); }
    this._rippleCleanup = setupRippleEffect(this._sidebar);
  }

  showOverlay() { return showOverlay(); }
  hideOverlay() { return hideOverlay(); }
  getSidebar() { return this._sidebar; }
  getContainer() { return this._container; }
  getExpandedSections() { return Array.from(this._expandedSections); }
  getMetrics() { return Object.assign({}, this._metrics); }

  reset() {
    this._activeItemId = null;
    this._mobileOpen = false;
    this._status = 'healthy';
    this._lastError = null;
    this._degradedComponents = [];
    this._expandedSections.clear();
  }

  destroy() {
    try {
      if (this._sectionClickHandler) {
        removeAccordionHandlers(this._sidebar, this._sectionClickHandler);
        this._sectionClickHandler = null;
      }
      if (this._rippleCleanup) {
        this._rippleCleanup();
        this._rippleCleanup = null;
      }
      if (this._navIconsHandler) {
        window.removeEventListener('navigation:icons:updated', this._navIconsHandler);
        this._navIconsHandler = null;
      }
      if (this._navItemsChangedHandler) {
        window.removeEventListener('navigation:items:changed', this._navItemsChangedHandler);
        this._navItemsChangedHandler = null;
      }
      if (this._container) this._container.textContent = '';
      this._sidebar = null;
      this._container = null;
      this._initialized = false;
      this.reset();
      _moduleMetrics.activeInstances--;
      if (_defaultInstance === this) _defaultInstance = null;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  healthCheck() {
    const self = this;
    const contextFn = () => ({
      container: self._container,
      sidebar: self._sidebar,
      initialized: self._initialized,
      activeItemId: self._activeItemId,
      mobileOpen: self._mobileOpen,
      expandedSections: self._expandedSections,
      degradedComponents: self._degradedComponents,
      lastError: self._lastError,
      sectionClickHandler: self._sectionClickHandler,
      rippleCleanup: !!self._rippleCleanup,
      status: self._status,
      metrics: self._metrics,
      portsInitialized: Ports.isInitialized()
    });
    return createHealthCheck(contextFn)();
  }

  info() {
    const self = this;
    const contextFn = () => ({
      activeItemId: self._activeItemId,
      mobileOpen: self._mobileOpen,
      expandedSections: self._expandedSections,
      degradedComponents: self._degradedComponents,
      status: self._status,
      metrics: self._metrics,
      portsInitialized: Ports.isInitialized(),
      features: { skeleton: true, ripple: !!self._rippleCleanup, loading: true }
    });
    return createInfo(contextFn, () => self.healthCheck())();
  }
}

export function createRenderer(options: DynObj) {
  const renderer = new SidebarRenderer(options);
  renderer.init();
  _defaultInstance = renderer;
  return renderer;
}

export function healthCheck() {
  const checks = {
    portsInitialized: Ports.isInitialized(),
    hasDefaultInstance: _defaultInstance !== null,
    defaultInstanceHealthy: _defaultInstance?.status === 'healthy',
    instancesCreated: _moduleMetrics.instancesCreated > 0,
    activeInstances: _moduleMetrics.activeInstances > 0
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  let status = 'HEALTHY';
  if (!checks.portsInitialized) status = 'DEGRADED';
  if (_defaultInstance && _defaultInstance.status !== 'healthy') status = 'DEGRADED';
  if (!_defaultInstance && _moduleMetrics.instancesCreated === 0) status = 'UNHEALTHY';

  return {
    status,
    score: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID,
    version: VERSION,
    moduleMetrics: { ..._moduleMetrics },
    defaultInstance: _defaultInstance ? _defaultInstance.healthCheck() : null,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    capabilities: CAPABILITIES,
    moduleMetrics: { ..._moduleMetrics },
    hasDefaultInstance: _defaultInstance !== null,
    defaultInstanceInfo: _defaultInstance ? _defaultInstance.info() : null,
    exports: [
      'SidebarRenderer',
      'createRenderer',
      'healthCheck',
      'info',
      'injectPorts',
      'getPorts'
    ],
    timestamp: Date.now()
  };
}

export function getMetrics() {
  return {
    module: { ..._moduleMetrics },
    defaultInstance: _defaultInstance ? _defaultInstance.getMetrics() : null
  };
}

export default SidebarRenderer;

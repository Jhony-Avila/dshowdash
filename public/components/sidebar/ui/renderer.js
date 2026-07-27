import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { VERSION as MODULE_ID, CAPABILITIES } from "./constants.js";
import { CSS_CLASSES as C } from "./constants.js";
import { createTemplate, createTemplateElement } from "./template.js";
import { showOverlay, hideOverlay } from "./overlay.js";
import { renderNavigation, renderFallback } from "./navigation-renderer.js";
import { setActiveItem, setCollapsed, setMobileOpen, announce, filterItems, clearSearch } from "./state-manager.js";
import { createHealthCheck, createInfo } from "./health.js";
import { showSkeleton, hideSkeleton, setupRippleEffect, setLoading } from "./visual-features.js";
const VERSION = "7.2.0-RELOAD-FIX";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _moduleMetrics = { instancesCreated: 0, activeInstances: 0 };
let _defaultInstance = null;
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function expandSectionUI(sidebar, sectionId, expandedSections) {
  try {
    const section = sidebar?.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return false;
    section.classList.add(C.SECTION_EXPANDED);
    const items = section.querySelector(`.${C.SECTION_ITEMS}`);
    if (items) items.style.height = "";
    const btn = section.querySelector("[data-section-toggle]");
    if (btn) btn.setAttribute("aria-expanded", "true");
    expandedSections?.add(sectionId);
    return true;
  } catch (error) {
    return false;
  }
}
function collapseSectionUI(sidebar, sectionId, expandedSections) {
  try {
    const section = sidebar?.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return false;
    section.classList.remove(C.SECTION_EXPANDED);
    const items = section.querySelector(`.${C.SECTION_ITEMS}`);
    if (items) items.style.height = "0";
    const btn = section.querySelector("[data-section-toggle]");
    if (btn) btn.setAttribute("aria-expanded", "false");
    expandedSections?.delete(sectionId);
    return true;
  } catch (error) {
    return false;
  }
}
function toggleSectionUI(sidebar, sectionId, expandedSections) {
  if (expandedSections?.has(sectionId)) return collapseSectionUI(sidebar, sectionId, expandedSections);
  return expandSectionUI(sidebar, sectionId, expandedSections);
}
function syncExpandedSections(sidebar, expandedIds, expandedSections) {
  try {
    expandedSections?.clear();
    expandedIds?.forEach((id) => {
      expandSectionUI(sidebar, id, expandedSections);
    });
    return true;
  } catch (error) {
    return false;
  }
}
function preloadExpandedSections(expandedIds, expandedSections) {
  try {
    expandedSections?.clear();
    if (Array.isArray(expandedIds)) {
      expandedIds.forEach((id) => {
        expandedSections?.add(id);
      });
    }
    return true;
  } catch (error) {
    return false;
  }
}
function setupAccordionHandlers(sidebar, expandedSections, onToggle) {
  if (!sidebar) return null;
  const handler = (e) => {
    const btn = e.target.closest("[data-section-toggle]");
    if (btn) {
      const sectionId = btn.getAttribute("data-section-toggle");
      if (onToggle) onToggle(sectionId);
    }
  };
  sidebar.addEventListener("click", handler);
  return handler;
}
function removeAccordionHandlers(sidebar, handler) {
  if (sidebar && handler) sidebar.removeEventListener("click", handler);
}
class SidebarRenderer {
  constructor(options = {}) {
    this._container = null;
    this._sidebar = null;
    this._options = options;
    this._activeItemId = null;
    this._mobileOpen = false;
    this._status = "healthy";
    this._lastError = null;
    this._degradedComponents = [];
    this._initialized = false;
    this._metrics = { renders: 0, errors: 0 };
    this._expandedSections = /* @__PURE__ */ new Set();
    this._sectionClickHandler = null;
    this._rippleCleanup = null;
    this._itemsChangedCallback = null;
    _moduleMetrics.instancesCreated++;
    _moduleMetrics.activeInstances++;
  }
  get status() {
    return this._status;
  }
  init() {
    try {
      _initPorts();
      this._initialized = true;
      this._status = "healthy";
      this._navIconsHandler = () => {
        this.renderNavigation();
      };
      window.addEventListener("navigation:icons:updated", this._navIconsHandler);
      this._navItemsChangedHandler = () => {
        if (this._itemsChangedCallback) {
          this._itemsChangedCallback();
        } else {
          this.renderNavigation();
        }
      };
      window.addEventListener("navigation:items:changed", this._navItemsChangedHandler);
      return { success: true };
    } catch (error) {
      this._status = "error";
      this._lastError = error.message;
      return { success: false, error: error.message };
    }
  }
  _emitDegraded(component, error) {
    try {
      if (!this._degradedComponents.includes(component)) {
        this._degradedComponents.push(component);
      }
      this._status = "degraded";
      this._lastError = error;
      const bus = _getPort("eventBus");
      if (bus?.emit) {
        bus.emit(SIDEBAR_EVENTS.DEGRADED, {
          source: MODULE_ID,
          component,
          error,
          degradedComponents: this._degradedComponents,
          timestamp: Date.now()
        });
      }
    } catch (e) {
    }
  }
  setItemsChangedCallback(fn) {
    this._itemsChangedCallback = fn;
  }
  setContainer(container) {
    this._container = container;
  }
  render() {
    try {
      if (!this._container) {
        this._emitDegraded("container", "No container provided");
        return { success: false, error: "No container" };
      }
      if (typeof createTemplateElement === "function") {
        const sidebarEl = createTemplateElement({ title: this._options.title || "DshowDash" });
        this._container.textContent = "";
        this._container.appendChild(sidebarEl);
        this._sidebar = sidebarEl;
      } else {
        const html = createTemplate({ title: this._options.title || "DshowDash" });
        this._container.innerHTML = html;
        this._sidebar = this._container.querySelector(`.${C.ROOT}`);
      }
      if (!this._sidebar) {
        this._emitDegraded("sidebar", "Sidebar element not created");
        return { success: false, error: "Sidebar element not created" };
      }
      this.renderNavigation();
      this._setupRipple();
      this._metrics.renders++;
      this._status = this._degradedComponents.length > 0 ? "degraded" : "healthy";
      return { success: true };
    } catch (error) {
      this._metrics.errors++;
      this._emitDegraded("render", error.message);
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
  _renderFallback() {
    this._sidebar = renderFallback(this._container);
  }
  _setupAccordionHandlers() {
    const self = this;
    if (this._sectionClickHandler) {
      removeAccordionHandlers(this._sidebar, this._sectionClickHandler);
    }
    this._sectionClickHandler = setupAccordionHandlers(this._sidebar, this._expandedSections, (sectionId) => self.toggleSectionUI(sectionId));
  }
  toggleSectionUI(sectionId) {
    return toggleSectionUI(this._sidebar, sectionId, this._expandedSections);
  }
  expandSectionUI(sectionId) {
    return expandSectionUI(this._sidebar, sectionId, this._expandedSections);
  }
  collapseSectionUI(sectionId) {
    return collapseSectionUI(this._sidebar, sectionId, this._expandedSections);
  }
  syncExpandedSections(expandedSectionIds) {
    return syncExpandedSections(this._sidebar, expandedSectionIds, this._expandedSections);
  }
  preloadExpandedSections(expandedSectionIds) {
    return preloadExpandedSections(expandedSectionIds, this._expandedSections);
  }
  setActiveItem(itemId) {
    this._activeItemId = itemId;
    return setActiveItem(this._sidebar, itemId, this._expandedSections);
  }
  setCollapsed(collapsed) {
    return setCollapsed(this._sidebar, collapsed);
  }
  setMobileOpen(open) {
    this._mobileOpen = open;
    return setMobileOpen(this._sidebar, open);
  }
  announce(message) {
    return announce(this._sidebar, message);
  }
  filterItems(query) {
    const result = filterItems(this._sidebar, query, this._expandedSections);
    this._setupRipple();
    return result;
  }
  clearSearch() {
    return clearSearch(this._sidebar, this._expandedSections);
  }
  showSkeleton(itemCount = 8) {
    return showSkeleton(this._sidebar, itemCount);
  }
  hideSkeleton() {
    const result = hideSkeleton(this._sidebar);
    if (result) {
      this.renderNavigation();
    }
    return result;
  }
  setLoading(loading) {
    return setLoading(this._sidebar, loading);
  }
  _setupRipple() {
    if (this._rippleCleanup) {
      this._rippleCleanup();
    }
    this._rippleCleanup = setupRippleEffect(this._sidebar);
  }
  showOverlay() {
    return showOverlay();
  }
  hideOverlay() {
    return hideOverlay();
  }
  getSidebar() {
    return this._sidebar;
  }
  getContainer() {
    return this._container;
  }
  getExpandedSections() {
    return Array.from(this._expandedSections);
  }
  getMetrics() {
    return Object.assign({}, this._metrics);
  }
  reset() {
    this._activeItemId = null;
    this._mobileOpen = false;
    this._status = "healthy";
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
        window.removeEventListener("navigation:icons:updated", this._navIconsHandler);
        this._navIconsHandler = null;
      }
      if (this._navItemsChangedHandler) {
        window.removeEventListener("navigation:items:changed", this._navItemsChangedHandler);
        this._navItemsChangedHandler = null;
      }
      if (this._container) this._container.textContent = "";
      this._sidebar = null;
      this._container = null;
      this._initialized = false;
      this.reset();
      _moduleMetrics.activeInstances--;
      if (_defaultInstance === this) _defaultInstance = null;
      return { success: true };
    } catch (error) {
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
function createRenderer(options) {
  const renderer = new SidebarRenderer(options);
  renderer.init();
  _defaultInstance = renderer;
  return renderer;
}
function healthCheck() {
  const checks = {
    portsInitialized: Ports.isInitialized(),
    hasDefaultInstance: _defaultInstance !== null,
    defaultInstanceHealthy: _defaultInstance?.status === "healthy",
    instancesCreated: _moduleMetrics.instancesCreated > 0,
    activeInstances: _moduleMetrics.activeInstances > 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!checks.portsInitialized) status = "DEGRADED";
  if (_defaultInstance && _defaultInstance.status !== "healthy") status = "DEGRADED";
  if (!_defaultInstance && _moduleMetrics.instancesCreated === 0) status = "UNHEALTHY";
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
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    capabilities: CAPABILITIES,
    moduleMetrics: { ..._moduleMetrics },
    hasDefaultInstance: _defaultInstance !== null,
    defaultInstanceInfo: _defaultInstance ? _defaultInstance.info() : null,
    exports: [
      "SidebarRenderer",
      "createRenderer",
      "healthCheck",
      "info",
      "injectPorts",
      "getPorts"
    ],
    timestamp: Date.now()
  };
}
function getMetrics() {
  return {
    module: { ..._moduleMetrics },
    defaultInstance: _defaultInstance ? _defaultInstance.getMetrics() : null
  };
}
var renderer_default = SidebarRenderer;
export {
  CAPABILITIES,
  MODULE_ID,
  SidebarRenderer,
  VERSION,
  createRenderer,
  renderer_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};

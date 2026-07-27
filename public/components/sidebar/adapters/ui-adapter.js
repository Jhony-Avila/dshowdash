const VERSION = "5.5.0-ENTERPRISE-FULL";
const MODULE_ID = "sidebar-ui-adapter";
function createUIAdapter(options = {}) {
  const selectors = [options.containerSelector, '[data-shell-region="sidebar"]', '[data-region="sidebar"]', "#shell-sidebar-region", "#sidebar-root", ".dsd-sidebar", ".app-sidebar", "#sidebar"].filter(Boolean);
  let _container = null;
  let _metrics = { containerLookups: 0, renders: 0, updates: 0, classOperations: 0, errors: 0, lastOperation: null };
  function getContainer() {
    _metrics.containerLookups++;
    if (_container && document.contains(_container)) return _container;
    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          _container = el;
          return el;
        }
      } catch (e) {
        _metrics.errors++;
      }
    }
    return null;
  }
  function render(html) {
    try {
      const container = getContainer();
      if (!container) {
        _metrics.errors++;
        return false;
      }
      container.innerHTML = html;
      _metrics.renders++;
      _metrics.lastOperation = { type: "render", timestamp: Date.now() };
      return true;
    } catch (error) {
      _metrics.errors++;
      return false;
    }
  }
  function update(selector, html) {
    try {
      const container = getContainer();
      if (!container) return false;
      const el = container.querySelector(selector);
      if (!el) return false;
      el.innerHTML = html;
      _metrics.updates++;
      _metrics.lastOperation = { type: "update", selector, timestamp: Date.now() };
      return true;
    } catch (error) {
      _metrics.errors++;
      return false;
    }
  }
  function addClass(className) {
    try {
      const container = getContainer();
      if (!container) return false;
      container.classList.add(className);
      _metrics.classOperations++;
      return true;
    } catch (error) {
      _metrics.errors++;
      return false;
    }
  }
  function removeClass(className) {
    try {
      const container = getContainer();
      if (!container) return false;
      container.classList.remove(className);
      _metrics.classOperations++;
      return true;
    } catch (error) {
      _metrics.errors++;
      return false;
    }
  }
  function toggleClass(className, force) {
    try {
      const container = getContainer();
      if (!container) return false;
      container.classList.toggle(className, force);
      _metrics.classOperations++;
      return true;
    } catch (error) {
      _metrics.errors++;
      return false;
    }
  }
  function setAttribute(name, value) {
    try {
      const container = getContainer();
      if (!container) return false;
      container.setAttribute(name, value);
      return true;
    } catch (error) {
      _metrics.errors++;
      return false;
    }
  }
  function getAttribute(name) {
    try {
      const container = getContainer();
      if (!container) return null;
      return container.getAttribute(name);
    } catch (error) {
      _metrics.errors++;
      return null;
    }
  }
  function querySelector(selector) {
    try {
      const container = getContainer();
      if (!container) return null;
      return container.querySelector(selector);
    } catch (error) {
      _metrics.errors++;
      return null;
    }
  }
  function querySelectorAll(selector) {
    try {
      const container = getContainer();
      if (!container) return [];
      return Array.from(container.querySelectorAll(selector));
    } catch (error) {
      _metrics.errors++;
      return [];
    }
  }
  function invalidateCache() {
    _container = null;
  }
  function getMetrics2() {
    return { ..._metrics };
  }
  function reset() {
    _container = null;
    _metrics = { containerLookups: 0, renders: 0, updates: 0, classOperations: 0, errors: 0, lastOperation: null };
  }
  function info2() {
    const container = getContainer();
    return { moduleId: MODULE_ID, version: VERSION, hasContainer: !!container, containerId: container?.id || null, metrics: getMetrics2() };
  }
  function healthCheck2() {
    const container = getContainer();
    const containerInDOM = container && document.contains(container);
    const hasSidebar = container?.querySelector(".dsd-sidebar") !== null || container?.classList.contains("dsd-sidebar");
    const checks = { containerFound: !!container, containerInDOM, hasSidebarElement: hasSidebar, noErrors: _metrics.errors === 0, cacheValid: _container !== null };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    let status = "HEALTHY";
    if (!container) status = "UNHEALTHY";
    else if (!containerInDOM || _metrics.errors > 0) status = "DEGRADED";
    return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, containerId: container?.id || null, containerSelector: container ? selectors.find((s) => {
      try {
        return document.querySelector(s) === container;
      } catch {
        return false;
      }
    }) : null, metrics: _metrics, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
  return { getContainer, render, update, addClass, removeClass, toggleClass, setAttribute, getAttribute, querySelector, querySelectorAll, invalidateCache, getMetrics: getMetrics2, reset, info: info2, healthCheck: healthCheck2 };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function getMetrics() {
  return {};
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var ui_adapter_default = { createUIAdapter, VERSION, MODULE_ID, info, getMetrics, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createUIAdapter,
  ui_adapter_default as default,
  getMetrics,
  healthCheck,
  info
};

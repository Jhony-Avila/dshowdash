// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-BULLETPROOF-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-ui-adapter
// PURPOSE: Sidebar V2 - UI Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createUIAdapter() — exported function
//   info() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.5.0-ENTERPRISE-FULL';
export const MODULE_ID = 'sidebar-ui-adapter';

export function createUIAdapter(options: { containerSelector?: string } = {}) {
  const selectors = [options.containerSelector, '[data-shell-region="sidebar"]', '[data-region="sidebar"]', '#shell-sidebar-region', '#sidebar-root', '.dsd-sidebar', '.app-sidebar', '#sidebar'].filter(Boolean);
  let _container: HTMLElement | null = null;
  let _metrics = { containerLookups: 0, renders: 0, updates: 0, classOperations: 0, errors: 0, lastOperation: null as DynObj };

  function getContainer() {
    _metrics.containerLookups++;
    if (_container && document.contains(_container)) return _container;
    // @ts-expect-error strict migration — TS2769
    for (const selector of selectors) { try { const el = document.querySelector(selector) as DynObj; if (el) { _container = el; return el; } } catch (e) { _metrics.errors++; } }
    return null;
  }

  function render(html: string) { try { const container = getContainer(); if (!container) { _metrics.errors++; return false; } container.innerHTML = html; _metrics.renders++; _metrics.lastOperation = { type: 'render', timestamp: Date.now() }; return true; } catch (error) { _metrics.errors++; return false; } }
  function update(selector: string, html: string) { try { const container = getContainer(); if (!container) return false; const el = container.querySelector(selector); if (!el) return false; el.innerHTML = html; _metrics.updates++; _metrics.lastOperation = { type: 'update', selector, timestamp: Date.now() }; return true; } catch (error) { _metrics.errors++; return false; } }
  function addClass(className: string) { try { const container = getContainer(); if (!container) return false; container.classList.add(className); _metrics.classOperations++; return true; } catch (error) { _metrics.errors++; return false; } }
  function removeClass(className: string) { try { const container = getContainer(); if (!container) return false; container.classList.remove(className); _metrics.classOperations++; return true; } catch (error) { _metrics.errors++; return false; } }
  function toggleClass(className: string, force: boolean) { try { const container = getContainer(); if (!container) return false; container.classList.toggle(className, force); _metrics.classOperations++; return true; } catch (error) { _metrics.errors++; return false; } }
  function setAttribute(name: string, value: string) { try { const container = getContainer(); if (!container) return false; container.setAttribute(name, value); return true; } catch (error) { _metrics.errors++; return false; } }
  function getAttribute(name: string) { try { const container = getContainer(); if (!container) return null; return container.getAttribute(name); } catch (error) { _metrics.errors++; return null; } }
  function querySelector(selector: string) { try { const container = getContainer(); if (!container) return null; return container.querySelector(selector); } catch (error) { _metrics.errors++; return null; } }
  function querySelectorAll(selector: string) { try { const container = getContainer(); if (!container) return []; return Array.from(container.querySelectorAll(selector)); } catch (error) { _metrics.errors++; return []; } }
  function invalidateCache() { _container = null; }
  function getMetrics() { return { ..._metrics }; }
  function reset() { _container = null; _metrics = { containerLookups: 0, renders: 0, updates: 0, classOperations: 0, errors: 0, lastOperation: null }; }

  function info() { const container = getContainer(); return { moduleId: MODULE_ID, version: VERSION, hasContainer: !!container, containerId: container?.id || null, metrics: getMetrics() }; }

  function healthCheck() {
    const container = getContainer();
    const containerInDOM = container && document.contains(container);
    const hasSidebar = container?.querySelector('.dsd-sidebar') !== null || container?.classList.contains('dsd-sidebar');
    const checks = { containerFound: !!container, containerInDOM, hasSidebarElement: hasSidebar, noErrors: _metrics.errors === 0, cacheValid: _container !== null };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    let status = 'HEALTHY';
    if (!container) status = 'UNHEALTHY';
    else if (!containerInDOM || _metrics.errors > 0) status = 'DEGRADED';
    // @ts-expect-error strict migration — TS2769
    return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, containerId: container?.id || null, containerSelector: container ? selectors.find(s => { try { return document.querySelector(s) === container; } catch { return false; } }) : null, metrics: _metrics, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }

  return { getContainer, render, update, addClass, removeClass, toggleClass, setAttribute, getAttribute, querySelector, querySelectorAll, invalidateCache, getMetrics, reset, info, healthCheck };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function getMetrics() { return {}; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID }; }

export default { createUIAdapter, VERSION, MODULE_ID, info, getMetrics, healthCheck };


// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-event-setup
// PURPOSE: Sidebar Features - Event Setup
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   CSS_CLASSES as C from ../ui/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   setDependencies() — exported function
//   setupToggleClick() — exported function
//   setupItemClicks() — exported function
//   setupSearch() — exported function
//   setupSectionToggle() — exported function
//   setupAllEvents() — exported function
//   destroy() — exported function
//   getCleanups() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.EVENT_SETUP_INITIALIZED
//   eventName
// LISTENS (eventos):
//   'click'
//   'input'
//   'keydown'
// WINDOW ACCESS:
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.1.0-ES6';
export const MODULE_ID = 'sidebar-event-setup';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { 
  Ports.init(); 
}

function _getPort(name: string) { 
  return Ports.get(name); 
}

export function injectPorts(p: DynObj) { 
  return Ports.inject(p); 
}

export function getPorts() { 
  return Ports.snapshot(); 
}

let _cleanups: (() => void)[] = [];
let _logger: DynObj | null = null;
let _tracker: DynObj | null = null;
let _metrics = { 
  toggleClicks: 0, 
  itemClicks: 0, 
  searches: 0, 
  sectionToggles: 0, 
  registryHits: 0,
  domFallbacks: 0,
  panelIdFromDom: 0,
  navigationEmits: 0,
  errors: 0 
};

function _log(level: string, message: string, data: DynObj) {
  if (_logger && _logger[level]) {
    _logger[level](`[${MODULE_ID}] ${message}`, data || {});
  }
}

function _emitEvent(eventName: string, data: DynObj) {
  try {
    const eb = _getPort('eventBus');
    if (eb && eb.emit) {
      eb.emit(eventName, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
      _metrics.navigationEmits++;
      return true;
    }
  } catch (e) {
    _metrics.errors++;
  }
  return false;
}

export function init(eventBus: DynObj) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.EVENT_SETUP_INITIALIZED);
}

export function setDependencies(logger: DynObj, tracker: DynObj) { 
  _logger = logger; 
  _tracker = tracker; 
}

export function setupToggleClick(sidebar: DynObj, onToggle: DynObj) {
  if (!sidebar) return () => {};
  
  const toggle = sidebar.querySelector(`.${C.TOGGLE}`);
  if (!toggle) return () => {};
  
  const handler = () => { 
    _metrics.toggleClicks++; 
    if (onToggle) onToggle(); 
  };
  
  toggle.addEventListener('click', handler);
  
  const cleanup = () => { 
    toggle.removeEventListener('click', handler); 
  };
  
  _cleanups.push(cleanup);
  return cleanup;
}

export function setupItemClicks(sidebar: DynObj, dependencies: DynObj) {
  if (!sidebar) return () => {};
  
  const registry = dependencies.registry;
  const routerAdapter = dependencies.routerAdapter;
  const onSetActiveItem = dependencies.onSetActiveItem;
  
  const handler = (e: DynObj) => {
    try {
      const link = (e.target as DynObj).closest(`.${C.LINK}`);
      if (!link) return;
      
      const item = link.closest(`.${C.ITEM}`);
      const itemId = item ? item.dataset.itemId : null;
      if (!itemId) {
        _log('debug', 'Click on link without itemId', { link: link.href });
        return;
      }
      
      const panelIdFromDom = item ? item.dataset.panelId : null;
      
      let itemData = null;
      let route = null;
      let panelId = null;
      
      if (registry && typeof registry.getItemById === 'function') {
        itemData = registry.getItemById(itemId);
        if (itemData) {
          _metrics.registryHits++;
          route = itemData.route;
          panelId = itemData.panelId || null;
          
          if (itemData.disabled) {
            _log('debug', 'Item disabled, ignoring click', { itemId });
            e.preventDefault();
            return;
          }
        }
      }
      
      if (!panelId && panelIdFromDom) {
        panelId = panelIdFromDom;
        _metrics.panelIdFromDom++;
        _log('debug', 'Using DOM data-panel-id', { itemId, panelId });
      }
      
      if (!route) {
        const href = link.getAttribute('href');
        if (href) {
          route = href;
          _metrics.domFallbacks++;
          _log('debug', 'Using DOM fallback for route', { itemId, route });
        }
      }
      
      if (!route) {
        const panel = link.getAttribute('data-panel');
        if (panel) {
          route = `#/${panel}`;
          _metrics.domFallbacks++;
          _log('debug', 'Using data-panel fallback for route', { itemId, panel, route });
        }
      }
      
      if (route) {
        e.preventDefault();
        _metrics.itemClicks++;
        
        const itemForEvent = itemData ? Object.assign({}, itemData, { panelId: panelId || itemData.panelId }) : {
          id: itemId,
          route,
          panelId,
          label: link.textContent ? link.textContent.trim() : itemId
        };
        
        _emitEvent(SIDEBAR_EVENTS.ITEM_CLICK, { 
          itemId, 
          item: itemForEvent,
          panelId
        });
        
        _emitEvent(SIDEBAR_EVENTS.NAVIGATE, { 
          itemId, 
          item: itemForEvent,
          route,
          panelId
        });
        
        if (routerAdapter && typeof routerAdapter.navigate === 'function') {
          routerAdapter.navigate(route);
          _log('debug', 'Navigated via routerAdapter', { itemId, route, panelId });
        } else {
          _log('warn', 'No routerAdapter available, using hash fallback', { itemId, route });
          if (typeof window !== 'undefined' && window.location) {
            window.location.hash = route.charAt(0) === '#' ? route : `#${route}`;
          }
        }
        
        if (onSetActiveItem) {
          onSetActiveItem(itemId);
        }
        
        if (_tracker && _tracker.trackNavigation) {
          _tracker.trackNavigation(itemId, route);
        }
      } else {
        _log('warn', 'No route found for item', { itemId });
      }
      
    } catch (error: any) { 
      _metrics.errors++; 
      _log('error', 'Click handler error', { error: error.message, stack: error.stack });
    }
  };
  
  sidebar.addEventListener('click', handler);
  
  const cleanup = () => { 
    sidebar.removeEventListener('click', handler); 
  };
  
  _cleanups.push(cleanup);
  return cleanup;
}

export function setupSearch(sidebar: DynObj, dependencies: DynObj) {
  if (!sidebar) return () => {};
  
  const renderer = dependencies.renderer;
  const searchInput = sidebar.querySelector(`.${C.SEARCH_INPUT}`);
  const clearBtn = sidebar.querySelector(`.${C.SEARCH_CLEAR}`);
  
  if (!searchInput) return () => {};
  
  let debounce: DynObj | null = null;
  
  const inputHandler = (e: DynObj) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      try {
        const query = (e.target as DynObj).value;
        const result = renderer && renderer.filterItems ? renderer.filterItems(query) : { visible: 0, hidden: 0 };
        _metrics.searches++;
        if (_tracker && _tracker.trackSearch) _tracker.trackSearch(query, result.visible);
        if (clearBtn) { 
          clearBtn.style.opacity = query ? '1' : '0'; 
          clearBtn.style.pointerEvents = query ? 'auto' : 'none'; 
        }
      } catch (error: any) { 
        _metrics.errors++; 
        _log('error', 'Search error', { error: error.message });
      }
    }, 200);
  };
  
  const clearHandler = (e: DynObj) => {
    e.preventDefault();
    try {
      searchInput.value = '';
      if (renderer && renderer.clearSearch) renderer.clearSearch();
      if (clearBtn) { 
        clearBtn.style.opacity = '0'; 
        clearBtn.style.pointerEvents = 'none'; 
      }
      searchInput.focus();
      if (_tracker && _tracker.trackSearch) _tracker.trackSearch('', 0);
    } catch (error: any) { 
      _metrics.errors++; 
      _log('error', 'Clear search error', { error: error.message });
    }
  };
  
  const keyHandler = (e: KeyboardEvent) => { 
    if (e.key === 'Escape' && searchInput.value) clearHandler(e); 
  };
  
  searchInput.addEventListener('input', inputHandler);
  searchInput.addEventListener('keydown', keyHandler);
  
  if (clearBtn) { 
    clearBtn.addEventListener('click', clearHandler); 
    clearBtn.style.opacity = '0'; 
    clearBtn.style.pointerEvents = 'none'; 
  }
  
  const cleanup = () => { 
    clearTimeout(debounce); 
    searchInput.removeEventListener('input', inputHandler); 
    searchInput.removeEventListener('keydown', keyHandler); 
    if (clearBtn) clearBtn.removeEventListener('click', clearHandler); 
  };
  
  _cleanups.push(cleanup);
  return cleanup;
}

export function setupSectionToggle(sidebar: DynObj, onToggleSection: DynObj) {
  if (!sidebar) return () => {};
  
  const handler = (e: DynObj) => {
    const button = (e.target as DynObj).closest(`.${C.GROUP_BUTTON}, .${C.SECTION_HEADER}`);
    if (!button) return;
    
    const section = button.closest(`.${C.SECTION}`);
    const sectionId = section ? section.dataset.sectionId : null;
    
    if (sectionId && section.dataset.collapsible !== 'false') { 
      e.preventDefault(); 
      _metrics.sectionToggles++; 
      if (onToggleSection) onToggleSection(sectionId); 
    }
  };
  
  sidebar.addEventListener('click', handler);
  
  const cleanup = () => { 
    sidebar.removeEventListener('click', handler); 
  };
  
  _cleanups.push(cleanup);
  return cleanup;
}

export function setupAllEvents(sidebar: DynObj, dependencies: DynObj) {
  if (_cleanups.length > 0) destroy();
  const registry = dependencies.registry;
  const routerAdapter = dependencies.routerAdapter;
  const renderer = dependencies.renderer;
  const onToggle = dependencies.onToggle;
  const onSetActiveItem = dependencies.onSetActiveItem;
  const onToggleSection = dependencies.onToggleSection;
  
  setupToggleClick(sidebar, onToggle);
  setupItemClicks(sidebar, { registry, routerAdapter, onSetActiveItem });
  setupSearch(sidebar, { renderer });
  setupSectionToggle(sidebar, onToggleSection);
  
  return () => { destroy(); };
}

export function destroy() { 
  _cleanups.forEach(fn => { 
    try { fn(); } catch (e) { _metrics.errors++; } 
  }); 
  _cleanups = []; 
}

export function getCleanups() { 
  return _cleanups.slice(); 
}

export function getMetrics() { 
  return Object.assign({}, _metrics); 
}

export function info() { 
  return { 
    moduleId: MODULE_ID, 
    version: VERSION, 
    portsInitialized: Ports.isInitialized(), 
    listenersActive: _cleanups.length, 
    hasLogger: !!_logger, 
    hasTracker: !!_tracker, 
    metrics: getMetrics() 
  }; 
}

export function healthCheck() { 
  return { 
    status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED', 
    version: VERSION, 
    moduleId: MODULE_ID, 
    portsInitialized: Ports.isInitialized(), 
    checks: { 
      noErrors: _metrics.errors === 0, 
      listenersActive: _cleanups.length > 0 
    }, 
    metrics: getMetrics() 
  }; 
}

export default { 
  VERSION, 
  MODULE_ID, 
  init, 
  setDependencies, 
  setupToggleClick, 
  setupItemClicks, 
  setupSearch, 
  setupSectionToggle, 
  setupAllEvents, 
  destroy, 
  injectPorts, 
  getPorts, 
  getCleanups, 
  getMetrics, 
  info, 
  healthCheck 
};

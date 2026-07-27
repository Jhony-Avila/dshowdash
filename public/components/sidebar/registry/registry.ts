
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.10.0-UARPS-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-registry
// PURPOSE: Sidebar V2 - Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getSections() — exported function
//   getSectionById() — exported function
//   getSectionIcon() — exported function
//   updateSection() — exported function
//   getItems() — exported function
//   getItemById() — exported function
//   getItemsBySection() — exported function
//   updateItem() — exported function
//   setItemVisible() — exported function
//   setItemDisabled() — exported function
//   setBadge() — exported function
//   getBadge() — exported function
//   getBadges() — exported function
//   removeBadge() — exported function
//   applyPermissionFilter() — exported function
//   getUserLevel() — exported function
//   invalidateCache() — exported function
//   setSource() — exported function
//   subscribe() — exported function
//   unsubscribe() — exported function
//   clear() — exported function
//   reset() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getMetrics() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.SidebarRegistry
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.10.0-UARPS-ONLY';
export const MODULE_ID = 'sidebar-registry';

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  source: 'api',
  apiEndpoint: '/api/ui/navigation.php?action=manifest',
  fallbackToManifest: true,
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000
};

const DEFAULT_SECTION_ICONS = {
  main: 'dashboard',
  principal: 'dashboard',
  operacional: 'settings',
  admin: 'shield',
  administracao: 'shield',
  config: 'cog',
  default: 'grid'
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const _sections = new Map();
const _items = new Map();
const _itemsByKey = new Map();
const _badges = new Map();
const _subscribers = new Set();
let _cache = { data: null as DynObj, timestamp: 0 };

// @deprecated v5.10.0 — kept for backward compat, no longer used for filtering
let _userLevel = 0;

const _metrics = {
  source: null as DynObj,
  sectionsLoaded: 0,
  itemsLoaded: 0,
  badgesSet: 0,
  filtersApplied: 0,
  apiCalls: 0,
  apiFails: 0,
  cacheHits: 0,
  keyLookups: 0,
  lastLoad: null as DynObj,
  lastUpdate: null as DynObj,
  errors: 0
};

// ═══════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════

function _notify(event: string, data: DynObj) {
  const state = {
    sections: getSections(),
    items: getItems(),
    badges: getBadges(),
    event,
    data,
    timestamp: Date.now()
  };
  _subscribers.forEach(fn => {
    try { (fn as Function)(state); } catch (e) { _metrics.errors++; }
  });
  const eb = _getPort('eventBus');
  if (eb?.emit) {
    eb.emit(event, { source: MODULE_ID, ...state });
  }
}

// Normalize API UI item to internal format
// Preserves all original fields + adds normalized aliases for backward compat
function _normalizeItem(raw: DynObj) {
  return {
    ...raw,
    key: raw.item_key || null,
    route: raw.route_path || null,
    panelId: raw.panel_id || null,
    order: raw.order_index ?? 100,
    permissions: raw.required_permissions ? raw.required_permissions.split(',').map((p: DynObj) => p.trim()) : [],
    sectionId: raw.parent_key || null,
    visible: raw.is_visible !== 0 && raw.is_active !== 0,
    disabled: raw.is_disabled === 1
  };
}

// ═══════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════

export async function loadFromAPI(endpoint = CONFIG.apiEndpoint) {
  if (CONFIG.cacheEnabled && _cache.data && (Date.now() - _cache.timestamp) < CONFIG.cacheTTL) {
    _metrics.cacheHits++;
    _processManifestData(_cache.data);
    return { success: true, source: 'cache', sectionsCount: _sections.size, itemsCount: _items.size };
  }

  _metrics.apiCalls++;

  try {
    const response = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const json = await response.json();

    // Check for json.ok (enterprise standard) OR json.success (legacy)
    if (!json.ok && !json.success) throw new Error(json.error || 'API returned error');

    const manifest = json.data;

    // @deprecated v5.10.0 — stored for backward compat only
    _userLevel = manifest.userLevel ?? 0;

    if (CONFIG.cacheEnabled) {
      _cache = { data: manifest, timestamp: Date.now() };
    }

    _processManifestData(manifest);
    _metrics.source = 'api';

    _notify(SIDEBAR_EVENTS.REGISTRY_LOADED, {
      source: 'api',
      sectionsCount: _sections.size,
      itemsCount: _items.size
    });

    return { success: true, source: 'api', sectionsCount: _sections.size, itemsCount: _items.size };

  } catch (error: any) {
    _metrics.apiFails++;
    _metrics.errors++;

    if (CONFIG.fallbackToManifest) {
      return loadFromManifest();
    }

    _notify(SIDEBAR_EVENTS.REGISTRY_ERROR, { error: error.message });
    return { success: false, error: error.message };
  }
}

// v5.10.0: Adapted for API UI format
// Sections derived from: explicit manifest.sections, item_type group/header/section, or parent_key
function _processManifestData(manifest: DynObj) {
  _sections.clear();
  _items.clear();
  _itemsByKey.clear();

  // API UI format: manifest.items can be object {id: item} or array
  let rawItems: DynObj = manifest.items || [];
  if (!Array.isArray(rawItems)) {
    rawItems = Object.values(rawItems);
  }

  // Path A: manifest has explicit sections (admin API format / manifest fallback)
  if (manifest.sections && Array.isArray(manifest.sections) && manifest.sections.length > 0) {
    manifest.sections.forEach((section: DynObj) => {
      const icon = section.icon || (DEFAULT_SECTION_ICONS as DynObj)[section.id] || (DEFAULT_SECTION_ICONS as DynObj)[section.key] || DEFAULT_SECTION_ICONS.default;
      _sections.set(section.id, {
        ...section,
        icon,
        visible: true,
        collapsible: section.collapsible !== false
      });
    });
  } else {
    // Path B: API UI format — derive sections from items
    const sectionKeys = new Set();

    // Pass 1: items with item_type group, header, or section become sections
    rawItems.forEach((item: DynObj) => {
      if (item.item_type === 'group' || item.item_type === 'header' || item.item_type === 'section') {
        const sectionId = item.item_key || item.id;
        const icon = item.icon || (DEFAULT_SECTION_ICONS as DynObj)[sectionId] || DEFAULT_SECTION_ICONS.default;
        _sections.set(sectionId, {
          id: sectionId,
          key: item.item_key || null,
          label: item.label || item.title || sectionId,
          icon,
          order: item.order_index ?? 100,
          visible: true,
          collapsible: item.collapsible !== false
        });
        sectionKeys.add(sectionId);
      }
    });

    // Pass 2: parent_keys that aren't already sections (orphan fallback)
    rawItems.forEach((item: DynObj) => {
      if (item.parent_key && !sectionKeys.has(item.parent_key) && !_sections.has(item.parent_key)) {
        const icon = (DEFAULT_SECTION_ICONS as DynObj)[item.parent_key] || DEFAULT_SECTION_ICONS.default;
        _sections.set(item.parent_key, {
          id: item.parent_key,
          key: item.parent_key,
          label: item.parent_key,
          icon,
          order: 100,
          visible: true,
          collapsible: true
        });
        sectionKeys.add(item.parent_key);
      }
    });
  }
  _metrics.sectionsLoaded = _sections.size;

  // Process navigation items — skip types that are sections, not navigable items
  rawItems.forEach((raw: DynObj) => {
    if (raw.item_type === 'group' || raw.item_type === 'header' || raw.item_type === 'section') return;

    const item = _normalizeItem(raw);

    // Dual-index: by numeric id AND by item_key
    _items.set(item.id, item);
    if (item.item_key) {
      _itemsByKey.set(item.item_key, item);
    }
  });
  _metrics.itemsLoaded = _items.size;
  _metrics.lastLoad = Date.now();
}

export async function loadFromManifest() {
  try {
    const { getManifest } = await import('./items.manifest.js');
    const manifest = getManifest();

    _processManifestData(manifest);
    _metrics.source = 'manifest';

    _notify(SIDEBAR_EVENTS.REGISTRY_LOADED, {
      source: 'manifest',
      sectionsCount: _sections.size,
      itemsCount: _items.size
    });

    return { success: true, source: 'manifest', sectionsCount: _sections.size, itemsCount: _items.size };

  } catch (error: any) {
    _metrics.errors++;
    _notify(SIDEBAR_EVENTS.REGISTRY_ERROR, { error: error.message });
    return { success: false, error: error.message };
  }
}

export async function load() {
  _initPorts();
  if (CONFIG.source === 'api') {
    return loadFromAPI();
  }
  return loadFromManifest();
}

// ═══════════════════════════════════════════════════════════════
// SECTIONS API
// ═══════════════════════════════════════════════════════════════

export function getSections() {
  return Array.from(_sections.values())
    .filter(s => s.visible !== false)
    .sort((a, b) => (a.order || a.priority || 100) - (b.order || b.priority || 100));
}

export function getSectionById(id: string) {
  return _sections.get(id) || null;
}

export function getSectionIcon(id: string) {
  const section = _sections.get(id);
  return section?.icon || (DEFAULT_SECTION_ICONS as DynObj)[id] || DEFAULT_SECTION_ICONS.default;
}

export function updateSection(id: string, updates: DynObj) {
  const section = _sections.get(id);
  if (!section) return { success: false, error: 'Section not found' };
  Object.assign(section, updates);
  _metrics.lastUpdate = Date.now();
  _notify(SIDEBAR_EVENTS.REGISTRY_UPDATED, { type: 'section', id, updates });
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// ITEMS API
// ═══════════════════════════════════════════════════════════════

// @ts-expect-error strict migration — TS2322
export function getItems(sectionId : string = null) {
  let items = Array.from(_items.values()).filter(i => i.visible !== false);
  if (sectionId) {
    items = items.filter(i => i.sectionId === sectionId || i.parent_key === sectionId);
  }
  return items.sort((a, b) => (a.order || a.priority || 100) - (b.order || b.priority || 100));
}

// Dual-index lookup — resolves both numeric id and item_key string
export function getItemById(id: string) {
  const byId = _items.get(id);
  if (byId) return byId;

  if (typeof id === 'string') {
    _metrics.keyLookups++;
    return _itemsByKey.get(id) || null;
  }

  return null;
}

export function getItemsBySection(sectionId: string) {
  return getItems(sectionId);
}

export function updateItem(id: string, updates: DynObj) {
  const item = getItemById(id);
  if (!item) return { success: false, error: 'Item not found' };
  Object.assign(item, updates);
  _metrics.lastUpdate = Date.now();
  _notify(SIDEBAR_EVENTS.REGISTRY_UPDATED, { type: 'item', id, updates });
  return { success: true };
}

export function setItemVisible(id: string, visible: boolean) {
  return updateItem(id, { visible });
}

export function setItemDisabled(id: string, disabled: boolean) {
  return updateItem(id, { disabled });
}

// ═══════════════════════════════════════════════════════════════
// BADGES API
// ═══════════════════════════════════════════════════════════════

export function setBadge(itemId: string, badge: DynObj) {
  _badges.set(itemId, {
    itemId,
    value: badge.value ?? null,
    type: badge.type || 'info',
    visible: badge.visible ?? true,
    pulse: badge.pulse ?? false
  });
  _metrics.badgesSet++;
  _notify(SIDEBAR_EVENTS.REGISTRY_UPDATED, { type: 'badge', itemId, badge });
  return { success: true };
}

export function getBadge(itemId: string) {
  return _badges.get(itemId) || null;
}

export function getBadges() {
  return Array.from(_badges.values()).filter(b => b.visible !== false);
}

export function removeBadge(itemId: string) {
  _badges.delete(itemId);
  _notify(SIDEBAR_EVENTS.REGISTRY_UPDATED, { type: 'badge-removed', itemId });
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// PERMISSION FILTER (UARPS-only)
// ═══════════════════════════════════════════════════════════════

// v5.10.0: UARPS-only — minLevel logic removed
// Visibility controlled exclusively by UARPS permissions array
// Items without explicit permissions are always visible
// @param userLevel — @deprecated, kept for backward compat signature
// @param userPermissions — array of permission strings from UARPS
export function applyPermissionFilter(userLevel: DynObj = null, userPermissions: DynObj[] = []) {
  _metrics.filtersApplied++;

  _items.forEach((item, id) => {
    let hasPermission = true;
    const perms = item.permissions || [];
    if (perms.length > 0) {
      hasPermission = perms.some((p: DynObj) => userPermissions.includes(p));
    }
    item.visible = hasPermission;
  });

  // Section visible if it has at least 1 visible item
  _sections.forEach((section, id) => {
    const visibleItems = getItemsBySection(id).filter(i => i.visible);
    section.visible = visibleItems.length > 0;
  });

  _notify(SIDEBAR_EVENTS.REGISTRY_UPDATED, { type: 'permission-filter', strategy: 'uarps-only' });

  return {
    success: true,
    visibleSections: getSections().length,
    visibleItems: getItems().length
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

// @deprecated v5.10.0 — kept for backward compat
export function getUserLevel() {
  return _userLevel;
}

export function invalidateCache() {
  _cache = { data: null as DynObj, timestamp: 0 };
  return { success: true };
}

export function setSource(source: DynObj) {
  if (source === 'api' || source === 'manifest') {
    CONFIG.source = source;
    return { success: true, source };
  }
  return { success: false, error: 'Invalid source' };
}

export function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  _subscribers.add(callback);
  return () => _subscribers.delete(callback);
}

export function unsubscribe(callback: DynObj) {
  _subscribers.delete(callback);
}

export function clear() {
  _sections.clear();
  _items.clear();
  _itemsByKey.clear();
  _badges.clear();
  _cache = { data: null as DynObj, timestamp: 0 };
  _userLevel = 0;
}

export function reset() {
  clear();
  Object.keys(_metrics).forEach(k => {
    if (typeof (_metrics as DynObj)[k] === 'number') (_metrics as DynObj)[k] = 0;
    else if ((_metrics as DynObj)[k] !== null) (_metrics as DynObj)[k] = null;
  });
}

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════

export function healthCheck() {
  const hasItems = _items.size > 0;
  const hasSections = _sections.size > 0;
  const cacheValid = CONFIG.cacheEnabled && _cache.data && (Date.now() - _cache.timestamp) < CONFIG.cacheTTL;
  const noErrors = _metrics.errors === 0;
  const apiWorking = _metrics.apiFails === 0 || _metrics.apiCalls > _metrics.apiFails;
  const portsInitialized = Ports.isInitialized();
  const hasDualIndex = _itemsByKey.size > 0;

  const checks = { hasItems, hasSections, hasDualIndex, cacheValid, noErrors, apiWorking, portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  let status = 'HEALTHY';
  if (!hasItems || !hasSections) status = 'UNHEALTHY';
  else if (_metrics.errors > 0 || !apiWorking) status = 'DEGRADED';

  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    source: _metrics.source,
    sectionsCount: _sections.size,
    itemsCount: _items.size,
    itemsByKeyCount: _itemsByKey.size,
    badgesCount: _badges.size,
    subscribersCount: _subscribers.size,
    metrics: { ..._metrics },
    config: { ...CONFIG },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    source: _metrics.source,
    sections: getSections(),
    items: getItems(),
    badges: getBadges(),
    metrics: { ..._metrics },
    config: { ...CONFIG },
    portsInitialized: Ports.isInitialized(),
    healthCheck: healthCheck()
  };
}

export function getMetrics() {
  return { ..._metrics };
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API OBJECT + WINDOW EXPORT
// ═══════════════════════════════════════════════════════════════

const SidebarRegistry = {
  VERSION,
  MODULE_ID,
  load,
  loadFromManifest,
  loadFromAPI,
  getSections,
  getSectionById,
  getSectionIcon,
  updateSection,
  getItems,
  getItemById,
  getItemsBySection,
  updateItem,
  setItemVisible,
  setItemDisabled,
  setBadge,
  getBadge,
  getBadges,
  removeBadge,
  applyPermissionFilter,
  getUserLevel,
  invalidateCache,
  setSource,
  subscribe,
  unsubscribe,
  clear,
  reset,
  healthCheck,
  info,
  getMetrics,
  injectPorts,
  getPorts
};

if (typeof window !== 'undefined') {
  (window as any).SidebarRegistry = SidebarRegistry;
}

export default SidebarRegistry;

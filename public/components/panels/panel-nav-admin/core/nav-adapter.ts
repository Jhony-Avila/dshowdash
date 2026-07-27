// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (11.3.0-CSRF-AUTORENEW)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin:nav-adapter
// PURPOSE: Panel Nav Admin - Unified Nav Adapter (sidebar+navrail+header+footer)
// ───────────────────────────────────────────────────────────────
// ⚠ CONSUMIDO TAMBÉM por panel-criacao-botoes (2026-06-06) — visão
//   especializada da sidebar reusa este adapter para escrita única
//   em ui_nav_items. Refatorar com os DOIS painéis em mente.
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   fetchItems() — exported function
//   fetchAvailableRoutes() — exported function (v10.2.0)
//   createItem() — exported function
//   updateItem() — exported function
//   deleteItem() — exported function
//   reorderItems() — exported function
//   restoreItem() — exported function (v11.3.0)
//   fetchAuditHistory() — exported function (v11.3.0)
//   clearCache() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// @changelog
//   11.3.0-CSRF-AUTORENEW: Auto-refresh CSRF token on 403 response, retry mutation once.
//     Added restoreItem() for undo-delete, fetchAuditHistory() for audit trail.
//     All mutations use _fetchWithCSRFRetry() wrapper.
//   10.4.0-CSRF-WINDOW-FALLBACK: Added (window as any).SecurityCSRF as fallback source for
//     CSRF token. Port injection may not occur for this module, but SecurityCSRF is
//     always available globally after bootstrap. Matches panel-session-admin pattern.
//   10.3.0-CSRF-FIX: All mutation requests include X-CSRF-Token header.
//   10.2.0-ROUTE-SELECT: Added fetchAvailableRoutes() for inline route dropdown.
//   10.0.0-UNIFIED-SSOT: MAJOR — API v4.0.0 reads from 4 tables via UNION.
//   9.4.0-API-OK-FIX: API returns {ok:true} not {success:true}
// ═══════════════════════════════════════════════════════════════

'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

var MODULE_ID = 'panel-nav-admin:nav-adapter';
var VERSION = '11.3.0-CSRF-AUTORENEW';

var Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

var _apiBase = '/api/admin/navigation';
var _cachedItems: Record<string, unknown>[] | null = null;
var _cachedSections: Record<string, unknown> | null = null;
var _cacheTimestamp = 0;
var _cacheTTL = 30000;

var _cachedRoutes: Record<string, unknown>[] | null = null;
var _routesCacheTimestamp = 0;
var _routesCacheTTL = 60000;

function _getLogger() {
    var lg = _getPort('logger');
    if (lg) return lg;
    if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
        var wab = window.Core.windowAdapter.get('Logger');
        if (wab) return wab;
    }
    return null;
}

function log(level: string, msg: string, data?: unknown) {
    var logger = _getLogger();
    if (logger && logger[level]) logger[level]('[' + MODULE_ID + ']', msg, data);
}

function _normalizeResponse(result: Record<string, unknown>) {
    if (result && typeof result.ok === 'boolean' && typeof result.success === 'undefined') {
        result.success = result.ok;
    }
    return result;
}

// v10.4.0: Get CSRF token — 4 sources in priority order
function _getCSRFToken() {
    // Source 1: SecurityCSRF port (enterprise pattern — injected via Ports)
    var csrf = _getPort('securityCSRF');
    if (csrf && csrf.getToken) {
        var token = csrf.getToken();
        if (token) return token;
    }
    // Source 2: (window as any).SecurityCSRF global (always available after bootstrap)
    if (typeof window !== 'undefined' && (window as any).SecurityCSRF && (window as any).SecurityCSRF.getToken) {
        var globalToken = (window as any).SecurityCSRF.getToken();
        if (globalToken) return globalToken;
    }
    // Source 3: Meta tag
    if (typeof document !== 'undefined') {
        var meta = document.querySelector('meta[name="csrf-token"]');

        // @ts-expect-error TS migration - TS2339
        if (meta && meta.content) return meta.content;
    }
    // Source 4: Cookie fallback
    if (typeof document !== 'undefined' && document.cookie) {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i].trim();
            if (c.indexOf('csrf_token=') === 0) {
                return c.substring(11);
            }
        }
    }
    return '';
}

function _readHeaders() {
    return { 'Content-Type': 'application/json' };
}

function _writeHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-CSRF-Token': _getCSRFToken()
    };
}

// v11.3.0: CSRF auto-renewal — refresh token on 403 and retry once
var _csrfRefreshing: Promise<string> | null = null;

async function _refreshCSRFToken(): Promise<string> {
    if (_csrfRefreshing) return _csrfRefreshing;
    _csrfRefreshing = (async () => {
        try {
            var resp = await fetch('/api/auth/check', { method: 'GET', credentials: 'include' });
            var json = await resp.json();
            var newToken = json?.data?.session?.csrf_token || '';
            if (newToken) {
                // Update meta tag source
                if (typeof document !== 'undefined') {
                    var meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
                    if (meta) meta.content = newToken;
                }
                // Update global SecurityCSRF if available
                if (typeof window !== 'undefined' && (window as any).SecurityCSRF && (window as any).SecurityCSRF.setToken) {
                    (window as any).SecurityCSRF.setToken(newToken);
                }
                log('info', 'CSRF token refreshed successfully');
            }
            return newToken;
        } catch (err) {
            log('error', 'Failed to refresh CSRF token', { error: (err as Error).message });
            return '';
        } finally {
            _csrfRefreshing = null;
        }
    })();
    return _csrfRefreshing;
}

async function _fetchWithCSRFRetry(url: string, options: RequestInit): Promise<Response> {
    var response = await fetch(url, options);
    // If 403 and likely CSRF issue, refresh token and retry once
    if (response.status === 403) {
        var body: Record<string, unknown> | null = null;
        try { body = await response.clone().json(); } catch (_e) { /* ignore */ }
        var errorCode = (body?.error as string) || (body?.code as string) || '';
        if (errorCode === 'ERR_INVALID_CSRF' || errorCode.indexOf('CSRF') >= 0 || response.status === 403) {
            log('warn', 'CSRF token rejected (403), refreshing and retrying...');
            var newToken = await _refreshCSRFToken();
            if (newToken) {
                // Rebuild headers with new token
                var newHeaders = Object.assign({}, options.headers, { 'X-CSRF-Token': newToken });
                var retryOptions = Object.assign({}, options, { headers: newHeaders });
                var retryResponse = await fetch(url, retryOptions);
                return retryResponse;
            }
        }
    }
    return response;
}

function isCacheValid() { return _cachedItems && (Date.now() - _cacheTimestamp) < _cacheTTL; }

function clearCache() { _cachedItems = null; _cachedSections = null; _cacheTimestamp = 0; log('debug', 'Cache cleared'); }

function _mapApiItem(item: Record<string, unknown>, index: number) {
    return {
        id: item.item_key,
        sourceId: item.source_id,
        sourceTable: item.source_table,
        label: item.label,
        displayTitle: item.display_title || null,
        href: item.route_path || null,
        icon: item.icon_name,
        description: item.description || null,
        section: item.display_context,
        parentKey: item.parent_key || null,
        parentLabel: item.parent_label || null,
        itemType: item.item_type || 'navigation',
        panelId: item.panel_id || null,
        order: item.order_index != null ? Number(item.order_index) : index,
        isActive: item.is_active == 1 || item.is_active === true,
        isVisible: item.is_visible == 1 || item.is_visible === true,
        minLevel: Number(item.min_level) || 0,
        uarpsTrigger: item.uarps_trigger_id || null,
        isDivider: item.item_type === 'separator',
        dbId: item.source_id,
        subtitle: null as string | null,
        sectionLabel: item.parent_label || null,
        sectionId: null as string | null,
        createdAt: item.created_at,
        updatedAt: item.updated_at
    };
}

async function fetchItems(forceRefresh: boolean, opts: { signal?: AbortSignal } = {}) {
    if (!opts) opts = {};
    if (!forceRefresh && isCacheValid()) { return { success: true, data: _cachedItems }; }
    try {
        var response = await fetch(_apiBase + '/items', { method: 'GET', credentials: 'include', headers: _readHeaders(), signal: opts.signal });
        var result = _normalizeResponse(await response.json());
        if (result.success && result.data) {
            _cachedItems = (result.data as Record<string, unknown>[]).map(function(item: Record<string, unknown>, index: number) { return _mapApiItem(item, index); });
            _cacheTimestamp = Date.now();
            log('info', 'Items fetched and mapped (unified)', { count: _cachedItems.length });
        }
        return result;
    } catch (err) { log('error', 'Failed to fetch items', { error: (err as Error).message }); return { success: false, error: (err as Error).message }; }
}

async function fetchAvailableRoutes(forceRefresh: boolean, opts: { signal?: AbortSignal } = {}) {
    if (!opts) opts = {};
    if (!forceRefresh && _cachedRoutes && (Date.now() - _routesCacheTimestamp) < _routesCacheTTL) {
        return { success: true, data: _cachedRoutes };
    }
    try {
        var response = await fetch(_apiBase + '/?action=available-routes', { method: 'GET', credentials: 'include', headers: _readHeaders(), signal: opts.signal });
        var result = _normalizeResponse(await response.json());
        if (result.success && result.data) {
            _cachedRoutes = result.data as Record<string, unknown>[];
            _routesCacheTimestamp = Date.now();
            log('info', 'Available routes fetched', { count: _cachedRoutes.length });
        }
        return result;
    } catch (err) { log('error', 'Failed to fetch available routes', { error: (err as Error).message }); return { success: false, error: (err as Error).message }; }
}

async function createItem(item: Record<string, unknown>, opts: { signal?: AbortSignal } = {}) {
    if (!opts) opts = {};
    try {
        var payload = {
            display_context: item.section || 'sidebar',
            item_key: item.id,
            label: item.label,
            route_path: item.href || null,
            icon_name: item.icon || 'circle',
            item_type: item.itemType || 'navigation',
            panel_id: item.panelId || null,
            parent_key: item.parentKey || null,
            order_index: item.order || 99,
            is_active: item.isActive !== false ? 1 : 0,
            is_visible: item.isVisible !== false ? 1 : 0,
            min_level: item.minLevel || 0,
            uarps_trigger_id: item.uarpsTrigger || null,
            description: item.description || null
        };
        var response = await _fetchWithCSRFRetry(_apiBase + '/items', { method: 'POST', credentials: 'include', headers: _writeHeaders(), body: JSON.stringify(payload), signal: opts.signal });
        var result = _normalizeResponse(await response.json());
        if (result.success) clearCache();
        return result;
    } catch (err) { log('error', 'Failed to create item', { error: (err as Error).message }); return { success: false, error: (err as Error).message }; }
}

async function updateItem(itemId: unknown, updates: Record<string, unknown>, opts: { signal?: AbortSignal } = {}) {
    if (!opts) opts = {};
    try {
        const payload: Record<string, unknown> = {
            source_table: updates.sourceTable,
            source_id: updates.sourceId
        };

        if (updates.label !== undefined) payload.label = updates.label;
        if (updates.displayTitle !== undefined) payload.display_title = updates.displayTitle;
        if (updates.href !== undefined) payload.route_path = updates.href;
        if (updates.icon !== undefined) payload.icon_name = updates.icon;
        if (updates.parentKey !== undefined) payload.parent_key = updates.parentKey;
        if (updates.order !== undefined) payload.order_index = updates.order;
        if (updates.panelId !== undefined) payload.panel_id = updates.panelId;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive ? 1 : 0;
        if (updates.isVisible !== undefined) payload.is_visible = updates.isVisible ? 1 : 0;
        if (updates.minLevel !== undefined) payload.min_level = updates.minLevel;
        if (updates.uarpsTrigger !== undefined) payload.uarps_trigger_id = updates.uarpsTrigger;
        if (updates.description !== undefined) payload.description = updates.description;
        var response = await _fetchWithCSRFRetry(_apiBase + '/items', { method: 'PATCH', credentials: 'include', headers: _writeHeaders(), body: JSON.stringify(payload), signal: opts.signal });
        var result = _normalizeResponse(await response.json());
        if (result.success) {
            clearCache();
        } else {
            log('error', 'updateItem PATCH failed', { status: response.status, statusText: response.statusText, body: result });
        }
        return result;
    } catch (err) { log('error', 'Failed to update item', { error: (err as Error).message }); return { success: false, error: (err as Error).message }; }
}

async function deleteItem(itemId: unknown, sourceTable: unknown, sourceId: unknown, opts: { signal?: AbortSignal } = {}) {
    if (!opts) opts = {};
    try {
        var payload = { source_table: sourceTable, source_id: sourceId };
        var response = await _fetchWithCSRFRetry(_apiBase + '/items', { method: 'DELETE', credentials: 'include', headers: _writeHeaders(), body: JSON.stringify(payload), signal: opts.signal });
        var result = _normalizeResponse(await response.json());
        if (result.success) clearCache();
        return result;
    } catch (err) { log('error', 'Failed to delete item', { error: (err as Error).message }); return { success: false, error: (err as Error).message }; }
}

// v11.3.0: Restore a soft-deleted item (undo delete)
async function restoreItem(sourceTable: unknown, sourceId: unknown, opts: { signal?: AbortSignal } = {}) {
    if (!opts) opts = {};
    try {
        var payload: Record<string, unknown> = { source_table: sourceTable, source_id: sourceId, is_active: 1 };
        // For navrail/header tables, also reset is_deleted
        if (sourceTable === 'navrail_items' || sourceTable === 'header_components') {
            payload.is_deleted = 0;
        }
        // For sidebar/footer, also restore is_visible
        if (sourceTable === 'ui_nav_items' || sourceTable === 'footer_items') {
            payload.is_visible = 1;
        }
        var response = await _fetchWithCSRFRetry(_apiBase + '/items', { method: 'PATCH', credentials: 'include', headers: _writeHeaders(), body: JSON.stringify(payload), signal: opts.signal });
        var result = _normalizeResponse(await response.json());
        if (result.success) clearCache();
        return result;
    } catch (err) { log('error', 'Failed to restore item', { error: (err as Error).message }); return { success: false, error: (err as Error).message }; }
}

async function reorderItems(items: Record<string, unknown>[], opts: { signal?: AbortSignal } = {}) {
    if (!opts) opts = {};
    try {
        var mapped = items.map(function(i: Record<string, unknown>) { return { source_table: i.sourceTable, source_id: i.sourceId, order_index: i.order }; });
        var response = await _fetchWithCSRFRetry(_apiBase + '/reorder', { method: 'POST', credentials: 'include', headers: _writeHeaders(), body: JSON.stringify({ items: mapped }), signal: opts.signal });
        var result = _normalizeResponse(await response.json());
        if (result.success) clearCache();
        return result;
    } catch (err) { log('error', 'Failed to reorder items', { error: (err as Error).message }); return { success: false, error: (err as Error).message }; }
}

async function fetchSections(opts: { signal?: AbortSignal; context?: string } = {}) {
    if (!opts) opts = {};
    // v4.2.0: Default context=sidebar to avoid mixing groups from navrail/header/footer
    var ctx = opts.context || 'sidebar';
    var url = _apiBase + '/sections' + (ctx ? '?context=' + encodeURIComponent(ctx) : '');
    try {
        var response = await fetch(url, { method: 'GET', credentials: 'include', headers: _readHeaders(), signal: opts.signal });
        var result = _normalizeResponse(await response.json());
        if (result.success && result.data) { _cachedSections = result.data as Record<string, unknown>; }
        return result.success ? (result.data || {}) : {};
    } catch (err) { log('error', 'Failed to fetch sections', { error: (err as Error).message }); return {}; }
}

// v11.3.0: Fetch audit history for navigation changes
async function fetchAuditHistory(limit: number = 50, opts: { signal?: AbortSignal } = {}) {
    if (!opts) opts = {};
    try {
        var response = await fetch(_apiBase + '/audit?limit=' + limit, { method: 'GET', credentials: 'include', headers: _readHeaders(), signal: opts.signal });
        var result = _normalizeResponse(await response.json());
        return result;
    } catch (err) { log('error', 'Failed to fetch audit history', { error: (err as Error).message }); return { success: false, error: (err as Error).message }; }
}

async function fetchIcons(): Promise<unknown[]> { return []; }

async function getItems(forceRefresh: boolean = false) {
    await fetchItems(forceRefresh);
    return _cachedItems || [];
}

async function getSections() { return fetchSections(); }
async function getIcons(): Promise<unknown[]> { return []; }

export { fetchItems, fetchAvailableRoutes, fetchSections, fetchIcons, getItems, getSections, getIcons, createItem, updateItem, deleteItem, restoreItem, reorderItems, fetchAuditHistory, clearCache, VERSION, MODULE_ID };

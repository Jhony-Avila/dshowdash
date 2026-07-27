// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-header-admin.state.store
// PURPOSE: Panel Header Admin - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   state — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-header-admin.state.store';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

function injectPorts(p: unknown) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug || false; };

const _log = (level: string, ...args: unknown[]) => {
    const logger = _getPort('logger');
    if (!logger) return;
    if (!_debug() && level === 'debug') return;
    const fn = logger[level] || logger.info;
    if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args);
};

const initialState: { groups: Record<string, unknown>[]; components: Record<string, unknown>[]; config: Record<string, unknown>; layouts: Record<string, unknown>[]; filter: { search: string; group: string; type: string; status: string }; editingComponent: Record<string, unknown> | null; editingGroup: Record<string, unknown> | null; pendingDelete: Record<string, unknown> | null; loading: boolean; error: string | null } = { groups: [], components: [], config: {}, layouts: [], filter: { search: '', group: '', type: '', status: '' }, editingComponent: null, editingGroup: null, pendingDelete: null, loading: false, error: null };

let _state = Object.assign({}, initialState);
let _subscribers: ((s: typeof initialState) => void)[] = [];

function _notify() { for (const sub of _subscribers) { try { sub(_state); } catch (e: any) { _log('error', 'Subscriber error:', e.message); } } }

const state = {
    init() { _initPorts(); _state = Object.assign({}, initialState); },
    getState() { return Object.assign({}, _state); },
    subscribe(fn: (s: typeof initialState) => void) { _subscribers.push(fn); return () => { const idx = _subscribers.indexOf(fn); if (idx > -1) _subscribers.splice(idx, 1); }; },

    markLoading() { _state.loading = true; _state.error = null; _notify(); },
    markReady() { _state.loading = false; _notify(); },

    setGroups(groups: Record<string, unknown>[]) { _state.groups = groups; _notify(); },
    setComponents(components: Record<string, unknown>[]) { _state.components = components; _notify(); },
    setConfig(config: Record<string, unknown>) { _state.config = config; _notify(); },
    setLayouts(layouts: Record<string, unknown>[]) { _state.layouts = layouts; _notify(); },

    setFilter(key: keyof typeof initialState.filter, value: string) { _state.filter[key] = value; _notify(); },
    clearFilters() { _state.filter = Object.assign({}, initialState.filter); _notify(); },

    setEditingComponent(component: Record<string, unknown> | null) { _state.editingComponent = component; _notify(); },
    clearEditingComponent() { _state.editingComponent = null; _notify(); },
    setEditingGroup(group: Record<string, unknown> | null) { _state.editingGroup = group; _notify(); },
    clearEditingGroup() { _state.editingGroup = null; _notify(); },

    setPendingDelete(item: Record<string, unknown> | null) { _state.pendingDelete = item; _notify(); },
    clearPendingDelete() { _state.pendingDelete = null; _notify(); },

    setError(error: string | null) { _state.error = error; _state.loading = false; _notify(); },
    clearError() { _state.error = null; _notify(); },

    getFilteredComponents() {
        let result = _state.components.slice();
        const f = _state.filter;
        if (f.search) { const s = f.search.toLowerCase(); result = result.filter((c) => (c.component_key as string | undefined)?.toLowerCase().includes(s) || (c.label as string | undefined)?.toLowerCase().includes(s)); }
        if (f.group) result = result.filter((c) => c.group_key === f.group);
        if (f.type) result = result.filter((c) => c.component_type === f.type);
        if (f.status === 'active') result = result.filter((c) => c.is_active === 1);
        else if (f.status === 'inactive') result = result.filter((c) => c.is_active === 0);
        return result;
    },

    healthCheck() { const logger = _getPort('logger'); const checks = { stateReady: true, loggerReady: !!logger, hasNoError: !_state.error, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, checks, componentsCount: _state.components.length, groupsCount: _state.groups.length, version: VERSION, moduleId: MODULE_ID }; },

    info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: state.healthCheck(), portsInitialized: Ports.isInitialized() }; }
};

export { state, VERSION, MODULE_ID, injectPorts, getPorts };
export default state;

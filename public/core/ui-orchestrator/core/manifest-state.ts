// UI Orchestrator - ManifestState Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 2.0.0-PORTSFACTORY
// @changelog v2.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.0.0-ENTERPRISE - Estado em memória do manifest com suporte a atualizações em runtime
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.ui-orchestrator.core.manifest-state';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _data: {
    intents: Record<string, unknown>;
    panels: Record<string, unknown>;
    routes: Record<string, unknown>;
    rules: Record<string, unknown>[];
    triggers: Record<string, unknown>;
    hash: string | null;
    generatedAt: string | null;
    source: string;
    loadedAt: string | null;
} = {
    intents: {},
    panels: {},
    routes: {},
    rules: [],
    triggers: {},
    hash: null,
    generatedAt: null,
    source: 'static',
    loadedAt: null
};

let _initialized = false;

const _log = (level: string, msg: string, data?: unknown) => {
    const logger = _getPort('logger') as Record<string, ((...a: unknown[]) => void) | undefined> | null;
    const fn = logger?.[level];
    if (typeof fn === 'function') fn(`[${MODULE_ID}] ${msg}`, data || {});
};

export function init(manifestModule: Record<string, unknown> | null | undefined) {
    if (_initialized) return { success: true, alreadyInitialized: true };

    _initPorts();

    try {
        if (manifestModule) {
            _data.intents = Object.assign({}, manifestModule.INTENT_REGISTRY || {});
            _data.panels = Object.assign({}, manifestModule.PANELS || {});
            _data.routes = Object.assign({}, manifestModule.ROUTES || {});
            _data.rules = Array.isArray(manifestModule.RULES) ? (manifestModule.RULES as Record<string, unknown>[]).slice() : [];
            _data.triggers = Object.assign({}, manifestModule.TRIGGERS || {});
            _data.hash = (manifestModule.MANIFEST_HASH as string) || null;
            _data.generatedAt = (manifestModule.GENERATED_AT as string) || null;
            _data.source = 'static';
        }
        _data.loadedAt = new Date().toISOString();
        _initialized = true;

        _log('info', 'ManifestState initialized', {
            intents: Object.keys(_data.intents).length,
            panels: Object.keys(_data.panels).length,
            routes: Object.keys(_data.routes).length,
            rules: _data.rules.length,
            triggers: Object.keys(_data.triggers).length,
            hash: _data.hash
        });

        return { success: true };
    } catch (e) {
        _log('error', 'Init failed', { error: (e as Error).message });
        return { success: false, error: (e as Error).message };
    }
}

export function getIntents() { return Object.assign({}, _data.intents); }
export function getPanels() { return Object.assign({}, _data.panels); }
export function getRoutes() { return Object.assign({}, _data.routes); }
export function getRules() { return _data.rules.slice(); }
export function getTriggers() { return Object.assign({}, _data.triggers); }
export function getHash() { return _data.hash; }

export function getIntent(intentId: string) { return _data.intents[intentId] || null; }
export function getPanel(panelId: string) { return _data.panels[panelId] || null; }
export function getRoute(routeId: string) { return _data.routes[routeId] || null; }
export function getTriggerIntent(triggerId: string) { return _data.triggers[triggerId] || null; }

export function getRuleByIntent(intentId: string) {
    for (let i = 0; i < _data.rules.length; i++) {
        if (_data.rules[i].intent === intentId) return _data.rules[i];
    }
    return null;
}

export function getRouteByPath(path: string) {
    const keys = Object.keys(_data.routes);
    for (let i = 0; i < keys.length; i++) {
        const route = _data.routes[keys[i]] as Record<string, unknown>;
        if (route.path === path) return route;
    }
    return null;
}

export function getPanelsByRegion(region: string) {
    const result: unknown[] = [];
    const keys = Object.keys(_data.panels);
    for (let i = 0; i < keys.length; i++) {
        const panel = _data.panels[keys[i]] as Record<string, unknown>;
        if (panel.regions && (panel.regions as string[]).indexOf(region) >= 0) {
            result.push(panel);
        }
    }
    return result;
}

export function updateIntents(intents: Record<string, unknown>) {
    Object.assign(_data.intents, intents);
    _data.source = 'runtime';
    _log('debug', 'Intents updated', { count: Object.keys(intents).length });
}

export function updatePanels(panels: Record<string, unknown>) {
    Object.assign(_data.panels, panels);
    _data.source = 'runtime';
    _log('debug', 'Panels updated', { count: Object.keys(panels).length });
}

export function updateRoutes(routes: Record<string, unknown>) {
    Object.assign(_data.routes, routes);
    _data.source = 'runtime';
    _log('debug', 'Routes updated', { count: Object.keys(routes).length });
}

export function updateRules(rules: Record<string, unknown>[]) {
    if (Array.isArray(rules)) {
        rules.forEach((newRule: Record<string, unknown>) => {
            let found = false;
            for (let i = 0; i < _data.rules.length; i++) {
                if (_data.rules[i].id === newRule.id || _data.rules[i].intent === newRule.intent) {
                    _data.rules[i] = newRule;
                    found = true;
                    break;
                }
            }
            if (!found) _data.rules.push(newRule);
        });
    }
    _data.source = 'runtime';
    _log('debug', 'Rules updated', { count: rules.length });
}

export function updateTriggers(triggers: Record<string, unknown>) {
    Object.assign(_data.triggers, triggers);
    _data.source = 'runtime';
    _log('debug', 'Triggers updated', { count: Object.keys(triggers).length });
}

export function applyDiff(diff: Record<string, unknown>) {
    if (!diff) return;

    const changes = { routes: 0, panels: 0, rules: 0, triggers: 0 };

    if (diff.routes) {
        const diffRoutes = diff.routes as Record<string, Record<string, unknown>>;
        Object.keys(diffRoutes).forEach((key: string) => {
            const item = diffRoutes[key];
            if (item.action === 'delete' || !item.active) {
                delete _data.routes[key];
            } else {
                _data.routes[key] = item;
            }
            changes.routes++;
        });
    }

    if (diff.panels) {
        const diffPanels = diff.panels as Record<string, Record<string, unknown>>;
        Object.keys(diffPanels).forEach((key: string) => {
            const item = diffPanels[key];
            if (item.action === 'delete' || !item.active) {
                delete _data.panels[key];
            } else {
                _data.panels[key] = item;
            }
            changes.panels++;
        });
    }

    if (diff.rules && Array.isArray(diff.rules)) {
        (diff.rules as Record<string, unknown>[]).forEach((rule: Record<string, unknown>) => {
            if (rule.diffAction === 'delete' || !rule.active) {
                _data.rules = _data.rules.filter(r => r.id !== rule.id);
            } else {
                let found = false;
                for (let i = 0; i < _data.rules.length; i++) {
                    if (_data.rules[i].id === rule.id) {
                        _data.rules[i] = rule;
                        found = true;
                        break;
                    }
                }
                if (!found) _data.rules.push(rule);
            }
            changes.rules++;
        });
    }

    if (diff.triggers) {
        const diffTriggers = diff.triggers as Record<string, Record<string, unknown>>;
        Object.keys(diffTriggers).forEach((key: string) => {
            const item = diffTriggers[key];
            if (item.action === 'delete' || !item.active) {
                delete _data.triggers[key];
            } else {
                _data.triggers[key] = item.intentId || item;
            }
            changes.triggers++;
        });
    }

    _data.source = 'diff';
    _log('info', 'Diff applied', changes);

    return changes;
}

export function replaceAll(data: Record<string, unknown>) {
    if (!data) return;

    if (data.intents) _data.intents = Object.assign({}, data.intents as Record<string, unknown>);
    if (data.panels) _data.panels = Object.assign({}, data.panels as Record<string, unknown>);
    if (data.routes) _data.routes = Object.assign({}, data.routes as Record<string, unknown>);
    if (data.rules) _data.rules = Array.isArray(data.rules) ? (data.rules as Record<string, unknown>[]).slice() : [];
    if (data.triggers) _data.triggers = Object.assign({}, data.triggers as Record<string, unknown>);

    _data.hash = (data.hash as string) || null;
    _data.source = 'api';
    _data.loadedAt = new Date().toISOString();

    _log('info', 'Full replace completed', {
        intents: Object.keys(_data.intents).length,
        panels: Object.keys(_data.panels).length,
        routes: Object.keys(_data.routes).length,
        rules: _data.rules.length,
        triggers: Object.keys(_data.triggers).length
    });
}

export function info() {
    return {
        version: VERSION,
        moduleId: MODULE_ID,
        initialized: _initialized,
        hash: _data.hash,
        generatedAt: _data.generatedAt,
        source: _data.source,
        loadedAt: _data.loadedAt,
        counts: {
            intents: Object.keys(_data.intents).length,
            panels: Object.keys(_data.panels).length,
            routes: Object.keys(_data.routes).length,
            rules: _data.rules.length,
            triggers: Object.keys(_data.triggers).length
        },
        portsInitialized: Ports.isInitialized()
    };
}

export function healthCheck() {
    return {
        status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED',
        moduleId: MODULE_ID,
        version: VERSION,
        hash: _data.hash,
        source: _data.source,
        checks: {
            intentsReady: Object.keys(_data.intents).length > 0,
            panelsReady: Object.keys(_data.panels).length > 0,
            routesReady: Object.keys(_data.routes).length > 0,
            rulesReady: _data.rules.length > 0,
            triggersReady: Object.keys(_data.triggers).length > 0
        },
        portsInitialized: Ports.isInitialized()
    };
}

export default Object.freeze({
    VERSION,
    MODULE_ID,
    init,
    getIntents,
    getPanels,
    getRoutes,
    getRules,
    getTriggers,
    getHash,
    getIntent,
    getPanel,
    getRoute,
    getTriggerIntent,
    getRuleByIntent,
    getRouteByPath,
    getPanelsByRegion,
    updateIntents,
    updatePanels,
    updateRoutes,
    updateRules,
    updateTriggers,
    applyDiff,
    replaceAll,
    info,
    healthCheck,
    injectPorts,
    getPorts
});

// UI Orchestrator - Intent Resolver
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 5.0.0-PORTSFACTORY
// @changelog v5.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v4.0.0-ENTERPRISE - Data-Driven com ManifestState
// v3.1.0-P18G3 - INTENTS → INTENT_REGISTRY (P18 Gargalo#3)
// v3.0.0: Refatorado em 4 módulos especializados
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { REGIONS, ACTION_TYPES, PRIORITIES } from './contracts.js';
import ManifestState from './manifest-state.js';
import * as GeneratedManifest from '../registry/manifest-generated.js';

export const VERSION = '5.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.ui-orchestrator.core.resolver';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const state = {
    initialized: false,
    userLevel: 0,
    userPermissions: [] as string[],
    dbRules: new Map(),
    overrides: new Map()
};

const metrics = {
    intentsReceived: 0,
    intentsResolved: 0,
    intentsFailed: 0,
    dbRulesUsed: 0,
    manifestRulesUsed: 0,
    fallbacksUsed: 0,
    lastResolveTime: 0,
    avgResolveTime: 0
};

const DYNAMIC_PANELS: Record<string, Record<string, unknown>> = {};

const _log = (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, unknown>) => {
    const logger = _getPort('logger');
    if (logger?.[level]) logger[level](`[${MODULE_ID}] ${message}`, data || {});
};

const _initManifestState = () => {
    if (!ManifestState.info().initialized) {
        ManifestState.init(GeneratedManifest);
        if (typeof window !== 'undefined') {
            window.ManifestState = ManifestState;
        }
        _log('info', 'ManifestState initialized from generated manifest', ManifestState.info());
    }
};

const _updateAvgResolveTime = (time: number) => {
    const total = metrics.intentsResolved;
    if (total <= 1) {
        metrics.avgResolveTime = time;
    } else {
        metrics.avgResolveTime = ((metrics.avgResolveTime * (total - 1)) + time) / total;
    }
};

const _checkPermissions = (rule: Record<string, unknown>, intent: unknown) => {
    if (!rule) return { allowed: true };
    
    if (rule.minLevel && state.userLevel < (rule.minLevel as number)) {
        return { allowed: false, reason: `Insufficient level: ${state.userLevel} < ${rule.minLevel}` };
    }

    if (rule.requiredPermissions && (rule.requiredPermissions as string[]).length > 0) {
        const hasAll = (rule.requiredPermissions as string[]).every((perm: string) => state.userPermissions.indexOf(perm) >= 0);
        if (!hasAll) {
            return { allowed: false, reason: 'Missing permissions' };
        }
    }
    
    return { allowed: true };
};

const _createFallbackResolution = (intent: unknown) => ({
    success: true,
    fallback: true,
    action: ACTION_TYPES.NAVIGATE,
    target: 'dashboard',
    region: REGIONS.MAIN,
    intent,
    timestamp: Date.now()
});

const _createDeniedResolution = (intent: unknown, reason: unknown) => ({
    success: false,
    denied: true,
    reason,
    action: ACTION_TYPES.NOOP,
    intent,
    timestamp: Date.now()
});

const _resolveTarget = (rule: Record<string, unknown>, intent: unknown) => {
    let panel = null;
    const targetId = rule.target || rule.panel;
    
    if (targetId) {
        panel = ManifestState.getPanel(targetId as string) || DYNAMIC_PANELS[targetId as string] || null;
    }
    
    return {
        success: true,
        action: rule.action || ACTION_TYPES.NAVIGATE,
        target: targetId,
        panel,
        region: rule.region || REGIONS.MAIN,
        priority: rule.priority || PRIORITIES.NORMAL,
        intent,
        rule,
        timestamp: Date.now()
    };
};

export function getDynamicPanel(panelId: string) {
    return DYNAMIC_PANELS[panelId] || null;
}

export function registerDynamicPanel(panelId: string, config: Record<string, unknown>) {
    DYNAMIC_PANELS[panelId] = Object.assign({ id: panelId, dynamic: true }, config);
    _log('debug', 'Dynamic panel registered', { panelId });
}

export function init(options: Record<string, unknown>) {
    if (!options) options = {};
    if (state.initialized) { 
        _log('warn', 'Resolver already initialized'); 
        return { success: true, alreadyInitialized: true }; 
    }

    try {
        _initPorts();
        _initManifestState();
        
        state.userLevel = options.userLevel !== undefined ? (options.userLevel as number) : 0;
        state.userPermissions = (options.userPermissions as string[]) || [];
        if (options.overrides) loadOverrides(options.overrides as Record<string, unknown>[]);
        if (options.rules) loadRules(options.rules as Record<string, unknown>[]);
        state.initialized = true;
        
        const manifestInfo = ManifestState.info();
        _log('info', 'Resolver initialized', { 
            userLevel: state.userLevel, 
            dbRules: state.dbRules.size, 
            manifestRules: ManifestState.getRules().length,
            manifestHash: manifestInfo.hash,
            manifestSource: manifestInfo.source
        });
        return { success: true };
    } catch (error: any) {
        _log('error', 'Init failed', { error: error.message });
        return { success: false, error: error.message };
    }
}

export function resolve(intent: Record<string, unknown>) {
    const startTime = performance.now();
    metrics.intentsReceived++;

    try {
        if (!intent || !intent.id) throw new Error('Invalid intent: missing id');
        _log('debug', 'Resolving intent', { intentId: intent.id, source: intent.source });

        let rule = state.dbRules.get(intent.id);
        let ruleSource = 'database';
        
        if (rule) { 
            metrics.dbRulesUsed++; 
            _log('debug', 'Rule found in database', { intentId: intent.id }); 
        } else { 
            rule = ManifestState.getRuleByIntent(intent.id as string);
            ruleSource = 'manifest'; 
            if (rule) { 
                metrics.manifestRulesUsed++; 
                _log('debug', 'Rule found in manifest', { intentId: intent.id }); 
            } 
        }

        if (state.overrides.has(intent.id)) { 
            const override = state.overrides.get(intent.id); 
            rule = rule ? Object.assign({}, rule, override) : override; 
            _log('debug', 'Override applied', { intentId: intent.id }); 
        }

        if (!rule) { 
            _log('warn', 'No rule found for intent', { intentId: intent.id }); 
            metrics.fallbacksUsed++; 
            return _createFallbackResolution(intent); 
        }

        const permissionCheck = _checkPermissions(rule, intent);
        if (!permissionCheck.allowed) { 
            _log('warn', 'Permission denied', { intentId: intent.id, reason: permissionCheck.reason }); 
            return _createDeniedResolution(intent, permissionCheck.reason); 
        }

        const resolution: Record<string, unknown> = _resolveTarget(rule, intent);
        resolution.ruleSource = ruleSource;

        const resolveTime = performance.now() - startTime;
        metrics.intentsResolved++;
        metrics.lastResolveTime = resolveTime;
        _updateAvgResolveTime(resolveTime);

        _log('info', 'Intent resolved', { 
            intentId: intent.id, 
            action: resolution.action, 
            target: resolution.target, 
            panel: resolution.panel ? (resolution.panel as Record<string, unknown>).id : null,
            source: ruleSource, 
            time: `${resolveTime.toFixed(2)}ms` 
        });
        return resolution;

    } catch (error: any) {
        metrics.intentsFailed++;
        _log('error', 'Resolution failed', { intentId: intent ? intent.id : null, error: error.message });
        return { success: false, error: error.message, intent, timestamp: Date.now() };
    }
}

export function resolveFromTrigger(triggerId: string, payload: Record<string, unknown>) {
    if (!payload) payload = {};
    const intentId = ManifestState.getTriggerIntent(triggerId);
    if (!intentId) { 
        _log('warn', 'Unknown trigger', { triggerId }); 
        return { success: false, error: `Unknown trigger: ${triggerId}`, triggerId }; 
    }
    const intent = { 
        id: intentId, 
        source: triggerId.split(':')[0], 
        payload, 
        timestamp: Date.now(), 
        priority: PRIORITIES.NORMAL 
    };
    return resolve(intent);
}

export function resolveFromURL(path: string) {
    let route = ManifestState.getRouteByPath(path);
    
    if (!route) {
        const routeId = path.replace('#/', '').replace(/^\//, '').split('?')[0];
        const dynamicPanel = getDynamicPanel(routeId);
        if (dynamicPanel) {
            route = { 
                id: routeId, 
                path, 
                panel: dynamicPanel.id, 
                region: REGIONS.MAIN, 
                addressable: true, 
                dynamic: true 
            };
            _log('debug', 'Created dynamic route', { routeId, panel: dynamicPanel.id });
        }
    }
    
    if (!route) { 
        _log('warn', 'No route for path', { path }); 
        return { success: false, error: `No route for path: ${path}`, path }; 
    }
    
    if (route.minLevel && state.userLevel < (route.minLevel as number)) {
        return _createDeniedResolution({ id: `url:${path}` }, 'Insufficient level');
    }

    const panel = ManifestState.getPanel(route.panel as string) || DYNAMIC_PANELS[route.panel as string];
    return { 
        success: true, 
        action: ACTION_TYPES.NAVIGATE, 
        route, 
        panel, 
        region: route.region || REGIONS.MAIN, 
        path, 
        timestamp: Date.now() 
    };
}

export function loadRules(rules: Record<string, unknown>[]) {
    if (!Array.isArray(rules)) return;
    state.dbRules.clear();
    rules.forEach(r => {
        const intentId = r.intent_id || r.intentId || r.intent;
        if (intentId) {
            state.dbRules.set(intentId, { 
                id: r.id || r.rule_key, 
                intent: intentId, 
                action: r.action_type || r.action, 
                target: r.target, 
                region: r.region || REGIONS.MAIN, 
                priority: r.priority || PRIORITIES.NORMAL, 
                source: 'database' 
            });
        }
    });
    _log('info', 'DB Rules loaded', { count: state.dbRules.size });
}

export function addRule(intentId: string, rule: Record<string, unknown>) {
    state.dbRules.set(intentId, Object.assign({}, rule, { intent: intentId, source: 'runtime' })); 
}

export function removeRule(intentId: string) {
    state.dbRules.delete(intentId); 
}

export function getDbRules() {
    const obj: Record<string, unknown> = {};
    state.dbRules.forEach((v: unknown, k: string) => { obj[k] = v; });
    return obj;
}

export function loadOverrides(overrides: Record<string, unknown>[]) {
    if (!Array.isArray(overrides)) return;
    state.overrides.clear();
    overrides.forEach(o => { 
        const intentId = o.intent_id || o.intentId; 
        if (intentId) state.overrides.set(intentId, o); 
    });
    _log('info', 'Overrides loaded', { count: state.overrides.size });
}

export function setOverride(intentId: string, override: Record<string, unknown>) {
    state.overrides.set(intentId, override); 
}

export function clearOverrides() { 
    state.overrides.clear(); 
}

export function setUserContext(level: number, permissions: string[]) {
    state.userLevel = level; 
    state.userPermissions = permissions || []; 
    _log('debug', 'User context updated', { level, permissions: (permissions || []).length }); 
}

export function healthCheck() { 
    const manifestInfo = ManifestState.info();
    return { 
        status: state.initialized ? 'HEALTHY' : 'NOT_INITIALIZED', 
        version: VERSION,
        moduleId: MODULE_ID,
        manifestHash: manifestInfo.hash,
        manifestSource: manifestInfo.source,
        metrics: Object.assign({}, metrics), 
        dbRulesCount: state.dbRules.size, 
        manifestRulesCount: ManifestState.getRules().length, 
        dynamicPanelsCount: Object.keys(DYNAMIC_PANELS).length, 
        overridesCount: state.overrides.size, 
        userLevel: state.userLevel,
        portsInitialized: Ports.isInitialized()
    }; 
}

export function getMetrics() { 
    return Object.assign({}, metrics); 
}

export function info() {
    const manifestInfo = ManifestState.info();
    return { 
        version: VERSION, 
        moduleId: MODULE_ID, 
        initialized: state.initialized, 
        manifestVersion: manifestInfo.version || 'unknown',
        manifestHash: manifestInfo.hash,
        manifestSource: manifestInfo.source,
        intents: Object.keys(ManifestState.getIntents()).length, 
        manifestRules: ManifestState.getRules().length, 
        dbRules: state.dbRules.size, 
        dynamicPanels: Object.keys(DYNAMIC_PANELS).length, 
        overrides: state.overrides.size, 
        metrics,
        portsInitialized: Ports.isInitialized()
    };
}

export { ManifestState };

export default Object.freeze({ 
    VERSION, 
    MODULE_ID, 
    init, 
    resolve, 
    resolveFromTrigger, 
    resolveFromURL, 
    loadRules, 
    addRule, 
    removeRule, 
    getDbRules, 
    loadOverrides, 
    setOverride, 
    clearOverrides, 
    setUserContext, 
    healthCheck, 
    getMetrics, 
    info,
    getDynamicPanel,
    registerDynamicPanel,
    ManifestState,
    injectPorts,
    getPorts
});

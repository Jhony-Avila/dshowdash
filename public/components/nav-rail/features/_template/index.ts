/* ═══════════════════════════════════════════════════════════════
 * DEPENDENCY CONTRACT — nav-rail/features/_template/index.js
 * @version 1.0.0
 * @batch Batch Z (Contract #204 of 217)
 *
 * IMPORTS (EXTERNAL):
 *   /core/runtime/ports-profiles.js → { createCorePorts }
 *
 * EXPORTS (PUBLIC API):
 *   FEATURE_ID, VERSION, SCOPE, CATEGORY
 *   init({ container, eventBus, registry, config })
 *   destroy()
 *   healthCheck(), info()
 *   injectPorts(), getPorts()
 *   default: { FEATURE_ID, VERSION, SCOPE, CATEGORY, init, destroy, healthCheck, info, injectPorts, getPorts }
 *
 * BROWSER APIs:
 *   Date.now()
 *
 * PATTERNS:
 *   Official Nav-Rail feature template (copy to create new features)
 *   PortsFactory (createCorePorts), EventBus handler registration
 *   Lifecycle: init → _bindHandlers → destroy → _unbindHandlers
 *   Health check with initialized/container/eventBus/handlers/ports checks
 * ═══════════════════════════════════════════════════════════════ */
// Nav-Rail Feature Template
// @version 1.0.0
// @description Template oficial para features do Nav-Rail
// 
// USO: Copie esta pasta para criar uma nova feature
//      cp -r _template minha-feature
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

// ═══════════════════════════════════════════════════════════════
// IDENTIDADE DA FEATURE
// ═══════════════════════════════════════════════════════════════
export const FEATURE_ID = 'template';
export const VERSION = '1.0.0';
export const SCOPE = 'nav-rail';
export const CATEGORY = 'navigation'; // navigation | ui | accessibility | telemetry

export const MODULE_ID = `navrail/features/${FEATURE_ID}`;

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _log = (level: string, ...args: unknown[]) => {
    const logger = _getPort('logger') as Record<string, unknown>;
    if (!logger) return;
    const fn = (logger[level] || logger.info) as ((...a: unknown[]) => void) | undefined;
    if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args);
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
interface EventHandler {
    event: string;
    handler: (...args: unknown[]) => void;
}

interface EventBus {
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    emit(event: string, payload: Record<string, unknown>): void;
}

interface FeatureState {
    initialized: boolean;
    container: HTMLElement | null;
    eventBus: EventBus | null;
    registry: Record<string, unknown> | null;
    config: Record<string, unknown> | null;
    handlers: EventHandler[];
}

let _state: FeatureState = {
    initialized: false,
    container: null,
    eventBus: null,
    registry: null,
    config: null,
    handlers: []
};

// ═══════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════

/**
 * Inicializa a feature
 * @param {Object} deps - Dependências injetadas
 * @param {HTMLElement} deps.container - Container do Nav-Rail
 * @param {Object} deps.eventBus - EventBus para comunicação
 * @param {Object} deps.registry - Registry do Nav-Rail
 * @param {Object} deps.config - Configurações
 */
export function init({ container, eventBus, registry, config }: { container: HTMLElement; eventBus: EventBus; registry: Record<string, unknown>; config: Record<string, unknown> | null }) {
    if (_state.initialized) {
        _log('warn', 'Feature already initialized');
        return;
    }

    _state.container = container;
    _state.eventBus = eventBus;
    _state.registry = registry;
    _state.config = config || {};

    _bindHandlers();

    _state.initialized = true;
    _log('info', 'Feature initialized');

    _emitEvent('feature:ready', { featureId: FEATURE_ID });
}

/**
 * Destroi a feature e limpa recursos
 */
export function destroy() {
    _unbindHandlers();

    _state = {
        initialized: false,
        container: null,
        eventBus: null,
        registry: null,
        config: null,
        handlers: [] as EventHandler[]
    };

    _log('info', 'Feature destroyed');
}

// ═══════════════════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════════════════

function _bindHandlers() {
    // Exemplo: escutar eventos
    // const handler = (payload) => { ... };
    // _state.eventBus?.on('some:event', handler);
    // _state.handlers.push({ event: 'some:event', handler });
}

function _unbindHandlers() {
    _state.handlers.forEach(({ event, handler }) => {
        _state.eventBus?.off(event, handler);
    });
    _state.handlers = [];
}

// ═══════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════

function _emitEvent(eventName: string, data: Record<string, unknown> = {}) {
    const payload = {
        type: eventName,
        timestamp: Date.now(),
        source: 'navrail',
        featureId: FEATURE_ID,
        ...data
    };

    _state.eventBus?.emit(eventName, payload);
}

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK (OBRIGATÓRIO)
// ═══════════════════════════════════════════════════════════════

export function healthCheck() {
    const checks = {
        initialized: _state.initialized,
        hasContainer: !!_state.container,
        hasEventBus: !!_state.eventBus,
        handlersActive: _state.handlers.length,
        portsInitialized: Ports.isInitialized()
    };

    const passed = Object.values(checks).filter(v => 
        typeof v === 'boolean' ? v : v > 0
    ).length;
    const total = Object.keys(checks).length;

    return {
        status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'ERROR',
        version: VERSION,
        moduleId: MODULE_ID,
        featureId: FEATURE_ID,
        checks,
        timestamp: Date.now()
    };
}

// ═══════════════════════════════════════════════════════════════
// INFO
// ═══════════════════════════════════════════════════════════════

export function info() {
    return {
        featureId: FEATURE_ID,
        version: VERSION,
        scope: SCOPE,
        category: CATEGORY,
        moduleId: MODULE_ID,
        initialized: _state.initialized,
        handlersCount: _state.handlers.length,
        portsInitialized: Ports.isInitialized(),
        timestamp: Date.now()
    };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════

export default {
    FEATURE_ID,
    VERSION,
    SCOPE,
    CATEGORY,
    init,
    destroy,
    healthCheck,
    info,
    injectPorts,
    getPorts
};

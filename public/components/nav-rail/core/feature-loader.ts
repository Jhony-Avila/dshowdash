
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail/core/feature-loader
// PURPOSE: NavRail Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   FEATURE_EVENTS — exported value
//   registerFeature() — exported function
//   registerFeatures() — exported function
//   unregisterFeature() — exported function
//   init() — exported function
//   getFeature() — exported function
//   getLoadedFeatures() — exported function
//   getFailedFeatures() — exported function
//   getRegisteredFeatures() — exported function
//   isFeatureLoaded() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   NavRailFeatureLoader — exported value
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   eventName — event emission
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'navrail/core/feature-loader';
export const VERSION = '5.1.0';

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
// FEATURE LOADER EVENTS
// ═══════════════════════════════════════════════════════════════
export const FEATURE_EVENTS = {
    FEATURE_LOADED: 'navrail:feature:loaded',
    FEATURE_FAILED: 'navrail:feature:failed',
    FEATURE_READY: 'navrail:feature:ready',
    FEATURE_DESTROYED: 'navrail:feature:destroyed',
    ALL_FEATURES_LOADED: 'navrail:features:all-loaded'
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
const _state = {
    initialized: false,
    features: new Map(),        // featureId -> { module, instance, status }
    failed: new Map(),          // featureId -> { error, attempts }
    registry: [] as Array<{ id: string; path: string; eager: boolean; enabled: boolean; priority: number }>,
    dependencies: null as { container: unknown; eventBus: unknown; registry: unknown; config: unknown } | null,
    metrics: {
        loaded: 0,
        failed: 0,
        totalLoadTime: 0
    }
};

// ═══════════════════════════════════════════════════════════════
// FEATURE REGISTRY (Static Registration)
// ═══════════════════════════════════════════════════════════════

/**
 * Registra uma feature para carregamento
 * @param {Object} featureConfig
 * @param {string} featureConfig.id - ID único da feature
 * @param {string} featureConfig.path - Caminho do módulo (relativo a nav-rail/)
 * @param {boolean} [featureConfig.eager=false] - Carregar imediatamente
 * @param {boolean} [featureConfig.enabled=true] - Feature habilitada
 * @param {number} [featureConfig.priority=0] - Ordem de carregamento
 */
export function registerFeature(featureConfig: Record<string, unknown>) {
    if (!featureConfig || !featureConfig.id) {
        _log('warn', 'Invalid feature config', featureConfig);
        return false;
    }

    const existing = _state.registry.find(f => f.id === featureConfig.id);
    if (existing) {
        _log('warn', 'Feature already registered', { id: featureConfig.id });
        return false;
    }

    _state.registry.push({
        id: featureConfig.id as string,
        path: (featureConfig.path as string) || `./features/${featureConfig.id}/index.js`,
        eager: (featureConfig.eager as boolean) || false,
        enabled: featureConfig.enabled !== false,
        priority: (featureConfig.priority as number) || 0
    });

    _log('debug', 'Feature registered', { id: featureConfig.id });
    return true;
}

/**
 * Registra múltiplas features
 */
export function registerFeatures(features: Record<string, unknown>[]) {
    if (!Array.isArray(features)) return 0;
    return features.filter(f => registerFeature(f)).length;
}

/**
 * Remove feature do registro
 */
export function unregisterFeature(featureId: string) {
    const index = _state.registry.findIndex(f => f.id === featureId);
    if (index === -1) return false;
    _state.registry.splice(index, 1);
    return true;
}

// ═══════════════════════════════════════════════════════════════
// DYNAMIC LOADING
// ═══════════════════════════════════════════════════════════════

/**
 * Carrega um módulo de feature dinamicamente
 */
async function _loadFeatureModule(featureConfig: Record<string, unknown>) {
    const startTime = performance.now();
    const { id, path } = featureConfig;

    try {
        // Construir caminho absoluto
        const pathStr = path as string;
        const absolutePath = pathStr.startsWith('./')
            ? `/components/nav-rail/${pathStr.slice(2)}`
            : pathStr;

        _log('debug', 'Loading feature module', { id, path: absolutePath });

        const module = await import(absolutePath);

        const duration = performance.now() - startTime;
        _state.metrics.totalLoadTime += duration;

        _log('debug', 'Feature module loaded', { id, duration: `${duration.toFixed(0)}ms` });

        return module;

    } catch (error: any) {
        _log('error', 'Failed to load feature module', { id, path, error: error.message });
        throw error;
    }
}

/**
 * Inicializa uma feature carregada
 */
async function _initFeature(featureId: string, module: Record<string, unknown>) {
    const deps = _state.dependencies;

    if (!deps) {
        throw new Error('Feature loader not initialized with dependencies');
    }

    // Verificar se módulo tem init
    const initFn = module.init || (module.default && (module.default as Record<string, unknown>).init);
    if (typeof initFn !== 'function') {
        _log('warn', 'Feature has no init function', { id: featureId });
        return module;
    }

    // Inicializar com dependências
    await initFn({
        container: deps.container,
        eventBus: deps.eventBus,
        registry: deps.registry,
        config: deps.config
    });

    return module;
}

/**
 * Carrega e inicializa uma feature específica
 */
export async function loadFeature(featureId: string) {
    // Verificar se já está carregada
    if (_state.features.has(featureId)) {
        const existing = _state.features.get(featureId);
        if (existing.status === 'ready') {
            _log('debug', 'Feature already loaded', { id: featureId });
            return existing.module;
        }
    }

    // Buscar config no registry
    const featureConfig = _state.registry.find(f => f.id === featureId);
    if (!featureConfig) {
        _log('warn', 'Feature not registered', { id: featureId });
        return null;
    }

    if (!featureConfig.enabled) {
        _log('debug', 'Feature disabled', { id: featureId });
        return null;
    }

    try {
        // Marcar como loading
        _state.features.set(featureId, { module: null, instance: null, status: 'loading' });

        // Carregar módulo
        const module = await _loadFeatureModule(featureConfig);

        // Inicializar
        await _initFeature(featureId, module);

        // Marcar como ready
        _state.features.set(featureId, { module, instance: module.default || module, status: 'ready' });
        _state.metrics.loaded++;

        // Remover de failed se existir
        _state.failed.delete(featureId);

        // Emitir evento
        _emitEvent(FEATURE_EVENTS.FEATURE_LOADED, { featureId });

        _log('info', 'Feature loaded and initialized', { id: featureId });

        return module;

    } catch (error: any) {
        // Registrar falha
        const failInfo = _state.failed.get(featureId) || { attempts: 0 };
        _state.failed.set(featureId, {
            error: error.message,
            attempts: failInfo.attempts + 1,
            lastAttempt: Date.now()
        });

        _state.features.set(featureId, { module: null, instance: null, status: 'failed' });
        _state.metrics.failed++;

        // Emitir evento de erro
        _emitEvent(FEATURE_EVENTS.FEATURE_FAILED, { featureId, error: error.message });

        _log('error', 'Feature load failed', { id: featureId, error: error.message });

        return null;
    }
}

/**
 * Carrega todas as features eager registradas
 */
export async function loadEagerFeatures() {
    const eagerFeatures = _state.registry
        .filter(f => f.eager && f.enabled)
        .sort((a, b) => b.priority - a.priority);

    if (eagerFeatures.length === 0) {
        _log('debug', 'No eager features to load');
        return { loaded: [], failed: [] };
    }

    _log('info', 'Loading eager features', { count: eagerFeatures.length });

    const results: { loaded: string[]; failed: string[] } = { loaded: [], failed: [] };

    for (const featureConfig of eagerFeatures) {
        const module = await loadFeature(featureConfig.id);
        if (module) {
            results.loaded.push(featureConfig.id);
        } else {
            results.failed.push(featureConfig.id);
        }
    }

    // Emitir evento de conclusão
    _emitEvent(FEATURE_EVENTS.ALL_FEATURES_LOADED, results);

    _log('info', 'Eager features loaded', results);

    return results;
}

/**
 * Carrega uma feature sob demanda (lazy)
 */
export async function loadFeatureOnDemand(featureId: string) {
    return loadFeature(featureId);
}

// ═══════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════

/**
 * Inicializa o Feature Loader com dependências
 */
export function init(dependencies: Record<string, unknown>) {
    if (_state.initialized) {
        _log('warn', 'Feature loader already initialized');
        return;
    }

    _state.dependencies = {
        container: dependencies.container || null,
        eventBus: dependencies.eventBus || _getPort('eventBus'),
        registry: dependencies.registry || null,
        config: dependencies.config || {}
    };

    _state.initialized = true;
    _log('info', 'Feature loader initialized');
}

/**
 * Destroi todas as features e limpa recursos
 */
export async function destroy() {
    // Destruir cada feature carregada
    for (const [featureId, featureData] of _state.features) {
        if (featureData.status !== 'ready') continue;

        try {
            const destroyFn = featureData.instance?.destroy ||
                              featureData.module?.destroy ||
                              (featureData.module?.default && featureData.module.default.destroy);

            if (typeof destroyFn === 'function') {
                await destroyFn();
                _log('debug', 'Feature destroyed', { id: featureId });
            }

            _emitEvent(FEATURE_EVENTS.FEATURE_DESTROYED, { featureId });

        } catch (error: any) {
            _log('warn', 'Error destroying feature', { id: featureId, error: error.message });
        }
    }

    // Limpar estado
    _state.features.clear();
    _state.failed.clear();
    _state.dependencies = null;
    _state.initialized = false;
    _state.metrics = { loaded: 0, failed: 0, totalLoadTime: 0 };

    _log('info', 'Feature loader destroyed');
}

// ═══════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════

function _emitEvent(eventName: string, data: Record<string, unknown> = {}) {
    const eb = _state.dependencies?.eventBus || _getPort('eventBus');
    if (!eb || !eb.emit) return;

    eb.emit(eventName, {
        type: eventName,
        timestamp: Date.now(),
        source: MODULE_ID,
        ...data
    });
}

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

export function getFeature(featureId: string) {
    return _state.features.get(featureId) || null;
}

export function getLoadedFeatures() {
    return Array.from(_state.features.entries())
        .filter(([_, data]) => data.status === 'ready')
        .map(([id, data]) => ({ id, ...data }));
}

export function getFailedFeatures() {
    return Array.from(_state.failed.entries())
        .map(([id, data]) => ({ id, ...data }));
}

export function getRegisteredFeatures() {
    return [..._state.registry];
}

export function isFeatureLoaded(featureId: string) {
    const feature = _state.features.get(featureId);
    return feature?.status === 'ready';
}

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK & INFO
// ═══════════════════════════════════════════════════════════════

export function healthCheck() {
    const loadedCount = Array.from(_state.features.values()).filter(f => f.status === 'ready').length;
    const failedCount = _state.failed.size;

    const checks = {
        initialized: _state.initialized,
        hasDependencies: !!_state.dependencies,
        hasEventBus: !!(_state.dependencies?.eventBus || _getPort('eventBus')),
        noFailedFeatures: failedCount === 0,
        registryNotEmpty: _state.registry.length > 0 || true, // OK se vazio também
        portsInitialized: Ports.isInitialized()
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    let status = 'HEALTHY';
    if (!_state.initialized) status = 'NOT_INITIALIZED';
    else if (failedCount > 0) status = 'DEGRADED';
    else if (passed < total) status = 'DEGRADED';

    return {
        status,
        score: `${passed}/${total}`,
        checks,
        metrics: { ..._state.metrics },
        registeredCount: _state.registry.length,
        loadedCount,
        failedCount,
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        initialized: _state.initialized,
        registeredFeatures: _state.registry.map(f => f.id),
        loadedFeatures: getLoadedFeatures().map(f => f.id),
        failedFeatures: getFailedFeatures().map(f => f.id),
        metrics: { ..._state.metrics },
        portsInitialized: Ports.isInitialized(),
        timestamp: Date.now()
    };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const NavRailFeatureLoader = {
    // Lifecycle
    init,
    destroy,
    
    // Registration
    registerFeature,
    registerFeatures,
    unregisterFeature,
    
    // Loading
    loadFeature,
    loadEagerFeatures,
    loadFeatureOnDemand,
    
    // Queries
    getFeature,
    getLoadedFeatures,
    getFailedFeatures,
    getRegisteredFeatures,
    isFeatureLoaded,
    
    // Health
    healthCheck,
    info,
    
    // Events
    FEATURE_EVENTS,
    
    // Ports
    injectPorts,
    getPorts,
    
    // Meta
    VERSION,
    MODULE_ID
};

export default NavRailFeatureLoader;

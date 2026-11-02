

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: fonts-manager
// PURPOSE: Fonts Manager v1.1.0-STRICT-MODE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   Store from ./state/store.js
//   * as Helpers from ./utils/helpers.js
//   * as Contracts from ./core/contracts.js
//   * as Loader from ./core/loader.js
//   * as Engine from ./core/engine.js
//   * as Lifecycle from ./core/lifecycle.js
//   * as Tracker from ./telemetry/tracker.js
//
// PROVIDES:
//   FontsManager — exported value
//   VERSION — module constant
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).FontsManager
//   (window as any).FontsManagerVersion
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

const VERSION = '1.1.0-STRICT-MODE';
const MODULE_ID = 'fonts-manager';

// Imports internos
import Store from './state/store.js';
import * as Helpers from './utils/helpers.js';
import * as Contracts from './core/contracts.js';
import * as Loader from './core/loader.js';
import * as Engine from './core/engine.js';
import * as Lifecycle from './core/lifecycle.js';
import * as Tracker from './telemetry/tracker.js';

// ============================================
// API PÚBLICA
// ============================================

// Inicializar
async function init(config = {}) {
    return Lifecycle.init(config);
}

// Verificar se está inicializado
function isInitialized() {
    return Lifecycle.isInitialized();
}

// Reset
function reset() {
    return Lifecycle.reset();
}

// Reload
async function reload(config: Record<string, unknown>) {
    return Lifecycle.reload(config);
}

// ============================================
// FONTES
// ============================================

// Registrar fontes
function registerSources(sources: unknown) {
    if (!Array.isArray(sources)) {
        sources = [sources];
    }
    Store.setSources([...(Store.get('sources') as unknown[]), ...(sources as unknown[])]);
    return { ok: true, count: (sources as unknown[]).length };
}

// Carregar fontes
async function loadFonts(sources: unknown) {
    return Loader.loadAllSources(sources || Store.get('sources'));
}

// Verificar se fonte está carregada
function isFontLoaded(family: unknown) {
    return Loader.isFontLoaded(family);
}

// ============================================
// ROLES E TIPOGRAFIA
// ============================================

// Obter roles
function getRoles() {
    return Store.get('roles');
}

// Definir roles
function setRoles(roles: Record<string, unknown>) {
    const validation = Contracts.validateFontRoles(roles);
    if (validation.valid) {
        // @ts-expect-error strict migration — TS2345
        Store.setRoles(validation.normalized);
        return { ok: true };
    }
    return { ok: false, errors: validation.errors };
}

// Obter tipografia
function getTypography() {
    return Store.get('typography');
}

// Gerar tipografia
function generateTypography(customVariants: unknown) {
    return Engine.generateTypography(customVariants);
}

// Obter tipografia compatível com MUI
function getMUITypography() {
    return Engine.generateMUITypography();
}

// Obter família para role
function getFamilyForRole(role: string) {
    return Engine.getFamilyForRole(role);
}

// ============================================
// STATUS E INFO
// ============================================

// Status simplificado
function status() {
    const state = Store.getState();
    return {
        initialized: state.initialized,
        status: state.status,
        sourcesCount: state.sources.length,
        loadedCount: state.loadedSources.length,
        failedCount: state.failedSources.length,
        error: state.error
    };
}

// Info completo
function info() {
    const state = Store.getState();
    const lifecycle = Lifecycle.getLifecycleInfo();
    
    return {
        name: MODULE_ID,
        version: VERSION,
        status: state.status,
        initialized: state.initialized,
        sources: {
            total: state.sources.length,
            loaded: state.loadedSources.length,
            failed: state.failedSources.length,
            list: state.sources.map((s: Record<string, unknown>) => ({ id: s.id, family: s.family, type: s.type }))
        },
        roles: state.roles,
        typography: {
            htmlFontSize: state.typography.htmlFontSize,
            baseFontSize: state.typography.baseFontSize,
            variantsCount: Object.keys(state.typography.variants || {}).length
        },
        metrics: state.metrics,
        lifecycle,
        components: {
            store: Store.VERSION,
            helpers: Helpers.VERSION,
            contracts: Contracts.VERSION,
            loader: Loader.VERSION,
            engine: Engine.VERSION,
            lifecycle: Lifecycle.VERSION,
            tracker: Tracker.VERSION
        }
    };
}

// Health check
function healthCheck() {
    const state = Store.getState();
    const lifecycle = Lifecycle.getLifecycleInfo();
    
    const issues = [];
    
    if (!lifecycle.initialized) {
        issues.push('Not initialized');
    }
    
    if (state.status === 'error') {
        issues.push(`Error: ${state.error}`);
    }
    
    if (state.failedSources.length > 0) {
        issues.push(`${state.failedSources.length} font(s) failed to load`);
    }
    
    return {
        healthy: issues.length === 0 && lifecycle.initialized,
        version: VERSION,
        moduleId: MODULE_ID,
        initialized: lifecycle.initialized,
        status: state.status,
        issues: issues.length > 0 ? issues.join('; ') : null,
        components: {
            store: !!Store,
            loader: !!Loader,
            engine: !!Engine,
            lifecycle: !!Lifecycle
        }
    };
}

// Versão
function getVersion() {
    return VERSION;
}

// Subscribe para mudanças
function subscribe(listener: (...args: unknown[]) => void) {
    return Store.subscribe(listener);
}

// ============================================
// DEBUG
// ============================================

const debug = {
    getStore: () => Store.getState(),
    getLoaderState: () => Loader.getLoaderState(),
    getResolvedFamilies: () => Engine.getResolvedFamilies(),
    getEngineConfig: () => Engine.getConfig(),
    getEventLog: () => Tracker.getEvents(),
    getTrackerStats: () => Tracker.getStats(),
    
    // Contratos e validação
    validateSource: Contracts.validateFontSource,
    validateRoles: Contracts.validateFontRoles,
    createDefaultTypography: Contracts.createDefaultTypography,
    
    // Helpers
    pxToRem: Helpers.pxToRem,
    normalizeFontFamily: Helpers.normalizeFontFamily,
    buildGoogleFontsUrl: Helpers.buildGoogleFontsUrl,
    
    // Versões
    versions: {
        main: VERSION,
        store: Store.VERSION,
        helpers: Helpers.VERSION,
        contracts: Contracts.VERSION,
        loader: Loader.VERSION,
        engine: Engine.VERSION,
        lifecycle: Lifecycle.VERSION,
        tracker: Tracker.VERSION
    }
};

// ============================================
// EXPORT E EXPOSIÇÃO GLOBAL
// ============================================

const FontsManager = {
    // Lifecycle
    init,
    isInitialized,
    reset,
    reload,
    
    // Fontes
    registerSources,
    loadFonts,
    isFontLoaded,
    
    // Roles e Tipografia
    getRoles,
    setRoles,
    getTypography,
    generateTypography,
    getMUITypography,
    getFamilyForRole,
    
    // Status
    status,
    info,
    healthCheck,
    getVersion,
    subscribe,
    
    // Debug
    debug
};

// Expor globalmente (strict mode: só quando !isStrict())
if (typeof window !== 'undefined') {
    if (!isStrict()) {
        (window as any).FontsManager = FontsManager;
        (window as any).FontsManagerVersion = VERSION;
    } else {
        recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, property: '(window as any).FontsManager', version: VERSION });
    }
    // DevTools sempre permitido
    window.__dev = window.__dev || {};
    window.__dev.fontsManager = FontsManager;
}

export { FontsManager, VERSION };
export default FontsManager;

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.3.1-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core/compatibility
// PURPOSE: Layer de compatibilidade para containers legados (DEPRECATED)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   getRegion from ./dom-regions/index.js
// EXPORTS:
//   VERSION, MODULE_ID, DEPRECATED, REMOVAL_DATE — Identificadores
//   injectPorts, getPorts — Gestão de ports
//   createLegacyContainers — Cria containers legados
//   removeLegacyContainers — Remove containers legados
//   hasLegacyContainer — Verifica existência de container
//   getLegacyMappings — Retorna mapeamentos
//   createMainLayoutWrapper — Cria wrapper para main
//   getUsageMetrics — Retorna métricas de uso
//   getCompatibilityInfo — Retorna info completa
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// DEPRECATION: PLANO DE MORTE - Remover após 2025-06-30
// ═══════════════════════════════════════════════════════════════
/**
 * @module CompatibilityLayer
 * @description Suporte a containers legados - DEPRECATED
 * @version 3.3.1-ENTERPRISE-AAA
 * @since 2024-01
 * @deprecated Remover após 2025-06-30
 * @changelog
 *   v3.3.1-ENTERPRISE - ES5 conversion
 *   v3.3.0-P18EC - Removed main region legacy containers
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { getRegion } from './dom-regions/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '3.3.1-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-compatibility';
export const DEPRECATED = true;
export const REMOVAL_DATE = '2025-06-30';

const Ports = createCorePorts({ moduleId: MODULE_ID });

export function injectPorts(p: DynObj) {
    return Ports.inject(p);
}

export function getPorts() {
    return Ports.snapshot();
}

const _usageMetrics = {
    createCalls: 0,
    removeCalls: 0,
    checkCalls: 0,
    containersCreated: 0,
    containersRemoved: 0,
    lastUsedAt: null as DynObj
};

function _trackUsage(action: DynObj) {
    Ports.init();
    _usageMetrics.lastUsedAt = Date.now();
    try {
        const telemetry = Ports.get('telemetry');
        const logger = Ports.get('logger');
        if (telemetry && telemetry.event) {
            telemetry.event(`${MODULE_ID}:deprecated:${action}`, {
                deprecated: true,
                removalDate: REMOVAL_DATE,
                usageCount: _usageMetrics.createCalls + _usageMetrics.removeCalls
            });
        }
        if (logger && logger.info) {
            logger.info(`[DEPRECATED] ${MODULE_ID}:${action} - Scheduled for removal on ${REMOVAL_DATE}`);
        }
    } catch (e) {
        // Silently ignore
    }
}

const LEGACY_MAPPINGS = Object.freeze({
    preloader: [{ id: 'preloader-root', tag: 'div' }],
    header: [{ id: 'header-container', tag: 'div' }],
    sidebar: [{ id: 'sidebar-root', tag: 'div' }],
    footer: [{ id: 'footer-root', tag: 'div' }],
    login: [{ id: 'login-container', tag: 'div' }],
    toast: [{ id: 'toast-container', tag: 'div' }]
});

export function createLegacyContainers() {
    _usageMetrics.createCalls++;
    _trackUsage('createLegacyContainers');
    
    const created = [];
    const failed = [];
    const skipped = [];
    const regionNames = Object.keys(LEGACY_MAPPINGS);
    
    for (let i = 0; i < regionNames.length; i++) {
        const regionName = regionNames[i];
        const containers = (LEGACY_MAPPINGS as DynObj)[regionName];
        const region = getRegion(regionName);
        
        if (!region) {
            failed.push({ region: regionName, reason: 'region_not_found' });
            continue;
        }
        
        for (let j = 0; j < containers.length; j++) {
            const config = containers[j];
            
            if (document.getElementById(config.id)) {
                skipped.push({ id: config.id, region: regionName, reason: 'already_exists' });
                continue;
            }
            
            try {
                const el = document.createElement(config.tag);
                el.id = config.id;
                if (config.className) el.className = config.className;
                el.setAttribute('data-legacy-container', 'true');
                el.setAttribute('data-shell-region', regionName);
                el.setAttribute('data-deprecated', 'true');
                region.appendChild(el);
                created.push({ id: config.id, region: regionName });
                _usageMetrics.containersCreated++;
            } catch (error: any) {
                failed.push({ id: config.id, region: regionName, error: error.message });
            }
        }
    }
    
    return { created, failed, skipped, deprecated: true, removalDate: REMOVAL_DATE };
}

export function removeLegacyContainers() {
    _usageMetrics.removeCalls++;
    _trackUsage('removeLegacyContainers');
    
    const removed = [];
    const errors = [];
    const elements = document.querySelectorAll('[data-legacy-container="true"]');
    
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        try {
            const id = el.id;
            if (el.parentNode) {
                el.parentNode.removeChild(el);
                removed.push(id);
                _usageMetrics.containersRemoved++;
            }
        } catch (error: any) {
            errors.push({ id: el.id, error: error.message });
        }
    }
    
    return { removed, errors, deprecated: true };
}

export function hasLegacyContainer(id: DynObj) {
    _usageMetrics.checkCalls++;
    const el = document.getElementById(id);
    return el && el.getAttribute('data-legacy-container') === 'true';
}

export function getLegacyMappings() {
    return Object.assign({}, LEGACY_MAPPINGS);
}

export function createMainLayoutWrapper() {
    _trackUsage('createMainLayoutWrapper');
    const mainRegion = getRegion('main');
    if (!mainRegion) return null;
    
    let wrapper = mainRegion.querySelector('.main-layout');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'main-layout';
        wrapper.setAttribute('data-legacy-container', 'true');
        wrapper.setAttribute('data-deprecated', 'true');
        mainRegion.appendChild(wrapper);
    }
    return wrapper;
}

export function getUsageMetrics() {
    const ps = Ports.snapshot();
    return Object.assign({}, _usageMetrics, {
        portsStatus: { initialized: ps._initialized }
    });
}

export function getCompatibilityInfo() {
    const ps = Ports.snapshot();
    const legacyContainers = document.querySelectorAll('[data-legacy-container="true"]');
    const containersByRegion = {};
    
    for (let i = 0; i < legacyContainers.length; i++) {
        const el = legacyContainers[i];
        const region = el.getAttribute('data-shell-region') || 'unknown';
        if (!(containersByRegion as DynObj)[region]) (containersByRegion as DynObj)[region] = [];
        (containersByRegion as DynObj)[region].push(el.id);
    }
    
    return {
        deprecated: true,
        removalDate: REMOVAL_DATE,
        totalLegacyContainers: legacyContainers.length,
        containersByRegion,
        mappingsCount: Object.keys(LEGACY_MAPPINGS).length,
        supportedRegions: Object.keys(LEGACY_MAPPINGS),
        usageMetrics: getUsageMetrics(),
        recommendation: 'Migrate to enterprise regions before removal date',
        version: VERSION,
        portsInitialized: ps._initialized
    };
}

export function healthCheck() {
    const ps = Ports.snapshot();
    const info = getCompatibilityInfo();
    
    const checks = {
        noActiveContainers: info.totalLegacyContainers === 0,
        lowUsage: _usageMetrics.createCalls < 100,
        migrationReady: info.totalLegacyContainers === 0 && _usageMetrics.createCalls === 0,
        portsInitialized: ps._initialized
    };
    
    const checkKeys = Object.keys(checks);
    let passed = 0;
    for (let i = 0; i < checkKeys.length; i++) {
        if ((checks as DynObj)[checkKeys[i]]) passed++;
    }
    const total = checkKeys.length;
    
    return {
        status: passed === total ? 'HEALTHY' : (passed >= 1 ? 'DEGRADED' : 'UNHEALTHY'),
        score: `${passed}/${total}`,
        checks,
        deprecated: true,
        removalDate: REMOVAL_DATE,
        activeContainers: info.totalLegacyContainers,
        usageMetrics: getUsageMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    return getCompatibilityInfo();
}

export default {
    createLegacyContainers,
    removeLegacyContainers,
    hasLegacyContainer,
    getLegacyMappings,
    createMainLayoutWrapper,
    getUsageMetrics,
    getCompatibilityInfo,
    healthCheck,
    info,
    injectPorts,
    getPorts,
    DEPRECATED,
    REMOVAL_DATE,
    VERSION,
    MODULE_ID
};

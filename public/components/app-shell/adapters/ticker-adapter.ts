// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-REGION-RESOLVER)
// ═══════════════════════════════════════════════════════════════
// MODULE: adapters/ticker-adapter
// PURPOSE: Adapter para integração do componente Ticker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   findRegion, REGION_IDS from /platform/shell/layout-regions.ts
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   injectPorts, getPorts — Gestão de ports
//   connect — Conecta ticker à região
//   disconnect — Desconecta ticker
//   getInstance — Retorna instância atual
//   isConnected — Verifica estado de conexão
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// WINDOW ACCESS:
//   (window as any).Ticker — Instância global
//   window.__dev.ticker — DevTools namespace
// @changelog v1.3.0-ES6 - var → const/let migration
// @changelog v1.2.0-REGION-RESOLVER - Migrado para Region Resolver Service
// ═══════════════════════════════════════════════════════════════
/**
 * @module TickerAdapter
 * @description Adapter para componente Ticker com PortsFactory
 * @version 1.2.0-REGION-RESOLVER
 * @since 2025-02-02
 * @changelog
 *   v1.2.0-REGION-RESOLVER (2025-02) - Migrado para Region Resolver Service
 *   v1.1.0-P17WI (2025-01) - Migração para PortsFactory/PortsProfiles
 *   v1.0.0 (2024-12) - Versão inicial
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.3.0-ES6';
export const MODULE_ID = 'app-shell-ticker-adapter';

const hasWindow = typeof window !== 'undefined';
const Ports = createCorePorts({ moduleId: MODULE_ID });

function _getPort(name: string) {
    return Ports.get(name);
}

export function injectPorts(p: DynObj) {
    return Ports.inject(p);
}

export function getPorts() {
    return Ports.snapshot();
}

let _tickerInstance: DynObj = null;
let _mounted = false;
let _metrics = { mounts: 0, unmounts: 0, errors: 0 };

function _trackEvent(event: string, data?: DynObj) {
    data = data || {};
    try {
        const t = _getPort('telemetry');
        if (t && t.event) t.event(MODULE_ID + ':' + event, data);
    } catch (e) {
        // Silently ignore telemetry errors
    }
}

// v1.2.0: Fallback chain enterprise para encontrar região ticker
function _findTickerRegion() {
    return document.querySelector('[data-region="ticker"]') ||
           document.getElementById('shell-ticker-region') ||
           document.getElementById('ticker');
}

/**
 * Conecta o Ticker a uma região
 * @param {string} regionId - ID da região alvo (ignorado, usa fallback chain)
 * @returns {Promise<boolean>} Sucesso da conexão
 */
export async function connect(regionId: string) {
    if (_mounted && _tickerInstance) return true;
    
    // v1.2.0: Usa fallback chain enterprise
    const region = _findTickerRegion();
    if (!region) {
        _trackEvent('no-region', { regionId: regionId || 'ticker' });
        return false;
    }
    
    try {
        const TickerModule = await import('/components/ticker/index.js');
        const TickerComponentEnterprise = TickerModule.TickerComponentEnterprise;
        
        if (!TickerComponentEnterprise) {
            throw new Error('TickerComponentEnterprise not found');
        }
        
        _tickerInstance = new TickerComponentEnterprise({ container: region });
        await _tickerInstance.mount();
        _mounted = true;
        _metrics.mounts++;
        
        if (hasWindow) {
            (window as any).Ticker = _tickerInstance;
            window.__dev = window.__dev || {};
            window.__dev.ticker = _tickerInstance;
        }
        
        _trackEvent('connected', { regionId: region.id });
        return true;
    } catch (error: any) {
        _metrics.errors++;
        _trackEvent('connect-error', { error: error.message });
        return false;
    }
}

/**
 * Desconecta o Ticker
 * @returns {Promise<boolean>} Sucesso da desconexão
 */
export async function disconnect() {
    if (_tickerInstance && _mounted) {
        try {
            await _tickerInstance.unmount();
            _tickerInstance = null;
            _mounted = false;
            _metrics.unmounts++;
            _trackEvent('disconnected');
            return true;
        } catch (error: any) {
            _metrics.errors++;
            return false;
        }
    }
    return false;
}

export function getInstance() {
    return _tickerInstance;
}

export function isConnected() {
    return _mounted;
}

export function getMetrics() {
    return Object.assign({}, _metrics);
}

export function healthCheck() {
    const ps = Ports.snapshot();
    const checks = {
        mounted: _mounted,
        hasInstance: !!_tickerInstance,
        portsInitialized: ps._initialized
    };
    let passed = 0;
    const keys = Object.keys(checks);
    for (let i = 0; i < keys.length; i++) {
        if ((checks as DynObj)[keys[i]]) passed++;
    }
    
    return {
        status: _mounted ? 'HEALTHY' : 'DEGRADED',
        score: passed + '/' + keys.length,
        checks: checks,
        metrics: getMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        portsInitialized: ps._initialized,
        timestamp: Date.now()
    };
}

export function info() {
    const ps = Ports.snapshot();
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        mounted: _mounted,
        hasInstance: !!_tickerInstance,
        metrics: getMetrics(),
        portsInitialized: ps._initialized,
        timestamp: Date.now()
    };
}

export default {
    connect: connect,
    disconnect: disconnect,
    getInstance: getInstance,
    isConnected: isConnected,
    getMetrics: getMetrics,
    healthCheck: healthCheck,
    info: info,
    VERSION: VERSION,
    MODULE_ID: MODULE_ID,
    injectPorts: injectPorts,
    getPorts: getPorts
};

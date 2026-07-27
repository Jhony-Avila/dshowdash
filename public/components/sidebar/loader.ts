// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.8.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar.loader
// PURPOSE: Sidebar V5 - Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   load() — exported function
//   getInstance() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   unload() — exported function
//   reset() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Sidebar
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.8.0-P1-HEALTHCHECK';
export const MODULE_ID = 'sidebar.loader';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const log = {
    info(msg: string, ctx: DynObj) {
        const logger = _getPort('logger');
        if (logger && logger.info) logger.info(msg, { component: MODULE_ID, ...ctx });
    },
    warn(msg: string, ctx: DynObj) {
        const logger = _getPort('logger');
        if (logger && logger.warn) logger.warn(msg, { component: MODULE_ID, ...ctx });
    },
    error(msg: string, ctx: DynObj) {
        const logger = _getPort('logger');
        if (logger && logger.error) logger.error(msg, { component: MODULE_ID, ...ctx });
    }
};

const CSS_FILES = ['/components/sidebar/styles/sidebar.bundle.css?v=20260720'];

let _metrics = {
    cssLoaded: false,
    loadAttempts: 0,
    loadSuccess: 0,
    loadErrors: 0,
    lastLoad: null as DynObj,
    loadTime: null as number | null
};

let _instance: DynObj | null = null;
let _cssLinks: DynObj[] = [];

function _createLinkElement(href: string) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-component', 'sidebar');
    return link;
}

function _isCSSLoaded(href: string) {
    return document.querySelector(`link[href="${href}"]`) !== null;
}

function loadCSS() {
    CSS_FILES.forEach(href => {
        if (_isCSSLoaded(href)) {
            _metrics.cssLoaded = true;
            return;
        }
        const link = _createLinkElement(href);
        document.head.appendChild(link);
        _cssLinks.push(link);
        _metrics.cssLoaded = true;
    });
}

export function load(options = {}) {
    const startTime = performance.now();
    _metrics.loadAttempts++;

    return Promise.resolve()
        .then(() => {
            loadCSS();
            return import('./index.js');
        })
        .then(module => {
            const createSidebar = module.createSidebar;
            const sidebar = createSidebar();
            return sidebar.init(options).then(() => sidebar);
        })
        .then(sidebar => {
            _instance = sidebar;
            _metrics.loadSuccess++;
            _metrics.lastLoad = Date.now();
            _metrics.loadTime = Math.round(performance.now() - startTime);
            log.info('Loaded successfully', { loadTime: _metrics.loadTime });
            return { success: true, instance: sidebar, version: VERSION, loadTime: _metrics.loadTime };
        })
        .catch(error => {
            _metrics.loadErrors++;
            log.error('Failed to load', { error: error.message });
            return { success: false, error: error.message };
        });
}

export function getInstance() {
    return _instance;
}

export function getMetrics() {
    return { ..._metrics };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        hasInstance: !!_instance,
        metrics: getMetrics(),
        portsInitialized: Ports.isInitialized()
    };
}

// P1.2: Standardized HealthCheck envelope
export function healthCheck() {
    const sidebar = _instance || (window.Sidebar?.getSidebar?.() ?? null);
    const sidebarHealth = sidebar?.healthCheck?.() ?? null;

    const cssLoaded = _metrics.cssLoaded;
    const hasInstance = !!_instance;
    const noErrors = _metrics.loadErrors === 0;
    const sidebarHealthy = sidebarHealth?.status === 'HEALTHY';
    const fastLoad = _metrics.loadTime ? _metrics.loadTime < 1000 : true;
    const hasLogger = !!_getPort('logger');
    const portsInitialized = Ports.isInitialized();

    const checks = {
        cssLoaded,
        hasInstance,
        noErrors,
        sidebarHealthy,
        fastLoad,
        hasLogger,
        portsInitialized
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    // Determine status
    let status = 'HEALTHY';
    if (!hasInstance) {
        status = 'NOT_LOADED';
    } else if (_metrics.loadErrors > 0) {
        status = 'DEGRADED';
    } else if (sidebarHealth && sidebarHealth.status !== 'HEALTHY') {
        status = 'DEGRADED';
    } else if (passed < total && passed >= Math.floor(total * 0.6)) {
        status = 'DEGRADED';
    } else if (passed < Math.floor(total * 0.6)) {
        status = 'UNHEALTHY';
    }

    // Build issues array
    const issues = [];
    if (!cssLoaded) issues.push({ code: 'CSS_NOT_LOADED', severity: 'error', message: 'CSS files not loaded' });
    if (!hasInstance) issues.push({ code: 'NO_INSTANCE', severity: 'error', message: 'Sidebar instance not created' });
    if (_metrics.loadErrors > 0) issues.push({ code: 'LOAD_ERRORS', severity: 'error', message: `${_metrics.loadErrors} load error(s)` });
    if (!sidebarHealthy && sidebarHealth) issues.push({ code: 'SIDEBAR_UNHEALTHY', severity: 'warn', message: `Sidebar status: ${sidebarHealth.status}` });
    if (!fastLoad) issues.push({ code: 'SLOW_LOAD', severity: 'warn', message: `Load time: ${_metrics.loadTime}ms` });

    return {
        status,
        score: { passed, total, percentage: Math.round((passed / total) * 100) },
        checks,
        issues,
        moduleId: MODULE_ID,
        version: VERSION,
        ports: { initialized: portsInitialized, missing: hasLogger ? [] : ['logger'] },
        metrics: _metrics,
        sidebarHealth,
        timestamp: Date.now()
    };
}

export function unload() {
    try {
        if (_instance?.destroy) _instance.destroy();
        if (window.Sidebar?.destroySidebar) window.Sidebar.destroySidebar();

        _cssLinks.forEach(link => { link.remove(); });
        _cssLinks = [];

        document.querySelectorAll('link[data-component="sidebar"]').forEach(el => {
            el.remove();
        });

        _instance = null;
        _metrics.cssLoaded = false;

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export function reset() {
    _metrics = {
        cssLoaded: false,
        loadAttempts: 0,
        loadSuccess: 0,
        loadErrors: 0,
        lastLoad: null,
        loadTime: null
    };
    _instance = null;
    _cssLinks = [];
}

export default {
    VERSION,
    MODULE_ID,
    load,
    getInstance,
    getMetrics,
    info,
    healthCheck,
    unload,
    reset,
    injectPorts,
    getPorts
};

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: utils/dom
// PURPOSE: Utilitários DOM do App Shell
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   ensureRoot — Garante existência de elemento root
//   setShellRoot, getShellRoot — Referência do shell root
//   createElement — Cria elemento com atributos
//   removeElement — Remove elemento do DOM
//   getMetrics, healthCheck, info — Diagnósticos
// BROWSER APIs: document.getElementById, document.createElement, document.body
// ═══════════════════════════════════════════════════════════════
/**
 * @module AppShellDOM
 * @description Utilitários DOM
 * @version 3.0.0-ENTERPRISE-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '3.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-dom';

let _shellRootRef: DynObj = null;
let _metrics = { creates: 0, removes: 0 };

export function ensureRoot(id: DynObj) {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('div');
        el.id = id;
        document.body.appendChild(el);
        _metrics.creates++;
    }
    return el;
}

export function setShellRoot(el: HTMLElement) {
    _shellRootRef = el;
}

export function getShellRoot() {
    if (_shellRootRef && document.contains(_shellRootRef)) return _shellRootRef;
    return document.getElementById('app-shell');
}

export function createElement(tag: string, attributes: DynObj) {
    attributes = attributes || {};
    const el = document.createElement(tag);
    const keys = Object.keys(attributes);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = attributes[key];
        if (key === 'className') el.className = value;
        else if (key === 'textContent') el.textContent = value;
        else if (key === 'innerHTML') el.innerHTML = value;
        else el.setAttribute(key, value);
    }
    _metrics.creates++;
    return el;
}

export function removeElement(el: HTMLElement) {
    if (el && el.parentNode) {
        el.parentNode.removeChild(el);
        _metrics.removes++;
        return true;
    }
    return false;
}

export function getMetrics() {
    return { creates: _metrics.creates, removes: _metrics.removes };
}

export function healthCheck() {
    const shellRoot = getShellRoot();
    const checks = {
        shellRootExists: !!shellRoot,
        bodyExists: !!document.body
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
        status: passed === total ? 'HEALTHY' : 'DEGRADED',
        score: `${passed}/${total}`,
        checks,
        metrics: getMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        shellRootExists: !!getShellRoot(),
        shellRootInMemory: !!_shellRootRef,
        metrics: getMetrics(),
        timestamp: Date.now()
    };
}

export default {
    VERSION, MODULE_ID,
    ensureRoot, setShellRoot, getShellRoot,
    createElement, removeElement,
    getMetrics, healthCheck, info
};

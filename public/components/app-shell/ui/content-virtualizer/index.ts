// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: content-virtualizer
// PURPOSE: Virtualização de conteúdo para listas grandes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Virtualizer from ./virtualizer.js
// EXPORTS:
//   VERSION, MODULE_ID, SCROLL_DIRECTION — Constantes
//   create — Cria instância
//   get — Obtém instância por ID
//   destroy — Destroi instância
//   destroyAll — Destroi todas as instâncias
//   listInstances — Lista instâncias
//   getMetrics, healthCheck, info — Diagnósticos
// ═══════════════════════════════════════════════════════════════
/**
 * @module ContentVirtualizer
 * @description Virtualização de conteúdo
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-content-virtualizer';

export const SCROLL_DIRECTION = Object.freeze({
    VERTICAL: 'vertical',
    HORIZONTAL: 'horizontal'
});

import { Virtualizer } from './virtualizer.js';

const _instances = new Map();
let _instanceId = 0;

const _metrics = {
    instancesCreated: 0,
    itemsRendered: 0,
    recycledItems: 0
};

function create(container: HTMLElement, options: DynObj) {
    options = options || {};
    const id = `virt-${++_instanceId}`;
    const virtualizer = new (Virtualizer as DynObj)(container, options, _metrics);
    virtualizer.id = id;
    _instances.set(id, virtualizer);
    return virtualizer;
}

function get(id: DynObj) {
    return _instances.get(id) || null;
}

function destroy(id: DynObj) {
    const instance = _instances.get(id);
    if (instance) {
        instance.destroy();
        _instances.delete(id);
        return true;
    }
    return false;
}

function destroyAll() {
    let count = 0;
    _instances.forEach(instance => {
        instance.destroy();
        count++;
    });
    _instances.clear();
    return count;
}

function listInstances() {
    const list: DynObj[] = [];
    _instances.forEach((instance, id) => {
        list.push({
            id,
            itemCount: instance.items.length,
            visibleRange: instance.getVisibleRange()
        });
    });
    return list;
}

function getMetrics() {
    return {
        instancesCreated: _metrics.instancesCreated,
        activeInstances: _instances.size,
        itemsRendered: _metrics.itemsRendered,
        recycledItems: _metrics.recycledItems
    };
}

function healthCheck() {
    const checks = {
        noExcessiveInstances: _instances.size < 10,
        poolEfficiency: _metrics.itemsRendered === 0 || (_metrics.recycledItems / _metrics.itemsRendered) > 0.1
    };

    let passed = 0;
    const keys = Object.keys(checks);
    for (let i = 0; i < keys.length; i++) {
        if ((checks as DynObj)[keys[i]]) passed++;
    }

    return {
        status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
        score: `${passed}/${keys.length}`,
        checks,
        metrics: getMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        activeInstances: _instances.size,
        instances: listInstances(),
        metrics: getMetrics(),
        timestamp: Date.now()
    };
}

export { create, get, destroy, destroyAll, listInstances };
export { getMetrics, healthCheck, info };


export default {
    VERSION, MODULE_ID, SCROLL_DIRECTION,
    create, get, destroy, destroyAll, listInstances,
    getMetrics, healthCheck, info
};

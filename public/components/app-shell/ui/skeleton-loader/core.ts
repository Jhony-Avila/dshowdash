// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: skeleton-loader/core
// PURPOSE: Core do skeleton loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   activeSkeletons, metrics from ./state.js
//   injectStyles from ./styles.js
//   createSkeletonElement from ./elements.js
//   buildShapes, createFromTemplate from ./builders.js
// EXPORTS:
//   create — Cria skeleton
//   destroy — Remove skeleton
//   destroyIn — Remove skeletons de container
//   destroyAll — Remove todos os skeletons
//   hasActive — Verifica se há skeletons ativos
// BROWSER APIs: document.querySelector, document.createElement
// ═══════════════════════════════════════════════════════════════
/**
 * @module SkeletonLoaderCore
 * @description Core do skeleton loader
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.skeleton-loader.core';

import { activeSkeletons, metrics } from './state.js';
import { injectStyles } from './styles.js';
import { createSkeletonElement } from './elements.js';
import { buildShapes, createFromTemplate } from './builders.js';


export function create(target: DynObj, template: DynObj, options: DynObj) {
    injectStyles();
    
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return null;
    
    options = options || {};
    
    let skeleton;
    if (typeof template === 'string') {
        skeleton = createFromTemplate(template);
    } else if (template && template.shapes) {
        skeleton = document.createElement('div');
        skeleton.className = 'skeleton-container';
        buildShapes(skeleton, template.shapes);
    } else {
        skeleton = createSkeletonElement(template || { width: '100%', height: '100px' });
    }
    
    if (!skeleton) return null;
    
    const id = `skeleton-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    skeleton.id = id;
    skeleton.setAttribute('role', 'status');
    skeleton.setAttribute('aria-busy', 'true');
    skeleton.setAttribute('aria-label', options.ariaLabel || 'Loading...');
    
    if (options.replace) {
        container.innerHTML = '';
    }
    
    container.appendChild(skeleton);
    
    activeSkeletons.set(id, {
        element: skeleton,
        container,
        template: typeof template === 'string' ? template : 'custom',
        createdAt: Date.now()
    });
    
    metrics.created++;
    metrics.activeCount = activeSkeletons.size;
    
    return id;
}

export function destroy(id: DynObj) {
    const info = activeSkeletons.get(id);
    if (!info) return false;
    
    if (info.element && info.element.parentNode) {
        info.element.parentNode.removeChild(info.element);
    }
    
    activeSkeletons.delete(id);
    metrics.destroyed++;
    metrics.activeCount = activeSkeletons.size;
    
    return true;
}

export function destroyIn(target: DynObj) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return 0;
    
    let destroyed = 0;
    activeSkeletons.forEach((info, id) => {
        if (info.container === container) {
            destroy(id);
            destroyed++;
        }
    });
    
    return destroyed;
}

export function destroyAll() {
    const ids: DynObj[] = [];
    activeSkeletons.forEach((info, id) => {
        ids.push(id);
    });
    
    for (let i = 0; i < ids.length; i++) {
        destroy(ids[i]);
    }
    
    return ids.length;
}

export function hasActive(target: DynObj) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return false;
    
    let found = false;
    activeSkeletons.forEach(info => {
        if (info.container === container) found = true;
    });
    
    return found;
}

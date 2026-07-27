// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-core-component-mounter-dynamic-loader
// PURPOSE: NavRail Component Mounter - Dynamic Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ITEMS, getComponentPath from ../../registry/items.js
//   loadedModules from ./constants.js
//
// PROVIDES:
//   setLogger() — exported function
//   createDynamicLoader() — exported function
//   getLoaderForComponent() — exported function
//   getAvailableComponentIds() — exported function
//   loadModule() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ITEMS, getComponentPath } from '../../registry/items.js';
import { loadedModules } from './constants.js';

export const VERSION = '5.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'nav-rail.core.component-mounter.dynamic-loader';

let _log: (level: string, msg: string, data?: unknown) => void = () => {};

export function setLogger(logFn: (level: string, msg: string, data?: unknown) => void) {
    _log = logFn;
}

export function createDynamicLoader(componentPath: string) {
    return () => import(`../../components/${componentPath}/index.js`);
}

export function getLoaderForComponent(id: string) {
    const componentPath = getComponentPath(id);
    if (!componentPath) {
        _log('warn', `No componentPath in registry for: ${id}`);
        return null;
    }
    return createDynamicLoader(componentPath);
}

export function getAvailableComponentIds() {
    return ITEMS.map(item => item.id);
}

export function loadModule(id: string) {
    if (loadedModules.has(id)) return Promise.resolve(loadedModules.get(id));

    const loader = getLoaderForComponent(id);
    if (!loader) return Promise.reject(new Error(`No loader for: ${id} (missing componentPath in registry)`));

    return loader().then(module => {
        loadedModules.set(id, module);
        return module;
    });
}

export default {
    createDynamicLoader,
    getLoaderForComponent,
    getAvailableComponentIds,
    loadModule,
    setLogger
};

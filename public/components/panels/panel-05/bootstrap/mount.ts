// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: mount
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   initLifecycle from ../core/lifecycle.js
//
// PROVIDES:
//   unmount() — exported function
//   isMounted() — exported function
//   getInstance() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export const MODULE_ID = 'panels.panel-05.bootstrap.mount';

/**
 * Panel 05 - Bootstrap Mount
 * @module panel-05/bootstrap/mount
 * @version 1.1.0-AAA
 */

import { initLifecycle } from '../core/lifecycle.js';

let mounted = false;
let instance: Record<string, unknown> | null = null;

export async function mount(container: HTMLElement, options: Record<string, unknown> = {}) {
    if (mounted) {
        console.warn('[panel-05] Already mounted');
        return instance;
    }
    
    try {
        instance = await initLifecycle(container, options);
        mounted = true;
        return instance;
    } catch (error) {
        console.error('[panel-05] Mount failed:', error);
        throw error;
    }
}

export function unmount() {
    if (instance?.destroy) (instance as { destroy: () => void }).destroy();
    instance = null;
    mounted = false;
}

export function isMounted() {
    return mounted;
}

export function getInstance() {
    return instance;
}

export default { mount, unmount, isMounted, getInstance };

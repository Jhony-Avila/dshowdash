// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.0.0-NCS-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state-sync
// PURPOSE: sidebar/core/state-sync.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CSS_CLASSES as C from ../ui/constants.js
//
// PROVIDES:
//   syncInitialCollapsedState() — exported function
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

import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.core.state-sync';

export function syncInitialCollapsedState(deps: DynObj) {
    const { engine, renderer, logger, getPort } = deps;

    const lm = getPort('layoutManager');
    let shouldBeCollapsed = false;
    let source = 'default';

    if (lm && typeof lm.isSidebarCollapsed === 'function') {
        shouldBeCollapsed = lm.isSidebarCollapsed();
        source = 'LayoutManager';
        logger.info('Collapsed state from LayoutManager', { collapsed: shouldBeCollapsed });
    } else {
        shouldBeCollapsed = document.body.classList.contains('sidebar-collapsed');
        source = 'body-class';
        logger.warn('LayoutManager not available, using body class as fallback', { collapsed: shouldBeCollapsed });
    }

    if (shouldBeCollapsed) {
        engine.collapse();
    } else {
        engine.expand();
    }

    renderer.setCollapsed(shouldBeCollapsed);

    const sidebar = renderer.getSidebar();
    if (sidebar) {
        sidebar.classList.toggle(C.MOD_COLLAPSED, shouldBeCollapsed);
        const toggle = sidebar.querySelector(`.${C.TOGGLE}`);
        if (toggle) {
            toggle.setAttribute('aria-expanded', String(!shouldBeCollapsed));
            toggle.setAttribute('aria-label', shouldBeCollapsed ? 'Expandir menu' : 'Recolher menu');
        }
    }

    const bodyHasClass = document.body.classList.contains('sidebar-collapsed');
    if (bodyHasClass !== shouldBeCollapsed && lm && typeof lm.setSidebarCollapsed === 'function') {
        logger.warn('Body class mismatch, requesting LayoutManager sync', {
            bodyHasClass,
            shouldBeCollapsed
        });
        lm.setSidebarCollapsed(shouldBeCollapsed);
    }

    logger.info('Initial state synced (LayoutManager-Driven)', {
        shouldBeCollapsed,
        source,
        bodyClassMatch: document.body.classList.contains('sidebar-collapsed') === shouldBeCollapsed
    });

    return { shouldBeCollapsed, source };
}

export default { syncInitialCollapsedState };

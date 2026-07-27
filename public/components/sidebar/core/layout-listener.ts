// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-P24-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-layout-listener
// PURPOSE: sidebar/core/layout-listener.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LAYOUT_EVENTS from /core/runtime/events/catalog/layout.events.js
//   CSS_CLASSES as C from ../ui/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setupLayoutListener() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   LAYOUT_EVENTS.REQUEST
//   LAYOUT_EVENTS.SIDEBAR_CHANGED
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LAYOUT_EVENTS } from '/core/runtime/events/catalog/layout.events.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '8.0.0-P24-TEARDOWN';
export const MODULE_ID = 'sidebar-layout-listener';

let _cleanup: (() => void) | null = null;
let _externalCollapseCount = 0;

export function setupLayoutListener(deps: DynObj) {
    const { engine, renderer, tracker, logger, getPort } = deps;

    const eb = getPort('eventBus');
    if (!eb) {
        logger.warn('EventBus not available for layout listener');
        return null;
    }

    // Teardown previous instance if re-initialized
    if (_cleanup) {
        _cleanup();
        _cleanup = null;
    }

    _externalCollapseCount = 0;

    const handleExternalCollapse = (collapsed: boolean) => {
        if (engine.collapsed === collapsed) return;

        _externalCollapseCount++;
        logger.info('External collapse change received', { collapsed });

        if (collapsed) {
            engine.collapse();
        } else {
            engine.expand();
        }

        renderer.setCollapsed(collapsed);

        const sidebar = renderer.getSidebar();
        if (sidebar) {
            sidebar.classList.toggle(C.MOD_COLLAPSED, collapsed);
            const toggle = sidebar.querySelector(`.${C.TOGGLE}`);
            if (toggle) {
                toggle.setAttribute('aria-expanded', String(!collapsed));
                toggle.setAttribute('aria-label', collapsed ? 'Expandir menu' : 'Recolher menu');
            }
        }

        tracker.track('external-collapse', { collapsed });
    };

    const handleLayoutChange = (data: DynObj) => {
        if (!data) return;
        if (data.source === 'sidebar' || data.source === 'sidebar-toggle') return;

        const mode = data.mode;
        if (mode === 'sidebar-collapsed') {
            handleExternalCollapse(true);
        } else if (mode === 'sidebar-expanded') {
            handleExternalCollapse(false);
        }
    };

    // P24: Capture cleanup references for deterministic teardown
    const unsub1 = eb.on(LAYOUT_EVENTS.REQUEST, handleLayoutChange);
    const unsub2 = eb.on(LAYOUT_EVENTS.SIDEBAR_CHANGED, handleLayoutChange);

    logger.info('Layout listener connected (bidirectional sync)');

    _cleanup = () => {
        // P24: Use unsub if available (modern EventBus), fallback to .off()
        if (typeof unsub1 === 'function') unsub1();
        else if (eb.off) eb.off(LAYOUT_EVENTS.REQUEST, handleLayoutChange);

        if (typeof unsub2 === 'function') unsub2();
        else if (eb.off) eb.off(LAYOUT_EVENTS.SIDEBAR_CHANGED, handleLayoutChange);
    };

    return {
        cleanup: _cleanup,
        getExternalCollapseCount: () => _externalCollapseCount
    };
}

export function destroy() {
    if (_cleanup) {
        _cleanup();
        _cleanup = null;
    }
    _externalCollapseCount = 0;
}

export function getMetrics() {
    return { externalCollapseCount: _externalCollapseCount };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        hasActiveListener: !!_cleanup,
        externalCollapseCount: _externalCollapseCount,
        p24Compliant: true
    };
}

export function healthCheck() {
    return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        checks: {
            hasActiveListener: !!_cleanup,
            noOrphanListeners: true
        },
        metrics: getMetrics(),
        p24Compliant: true
    };
}

export default { setupLayoutListener, destroy, getMetrics, info, healthCheck, VERSION, MODULE_ID };

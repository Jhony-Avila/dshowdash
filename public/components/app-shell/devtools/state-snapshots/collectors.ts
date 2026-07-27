// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: state-snapshots/collectors
// PURPOSE: Coletores de estado para snapshots
// ───────────────────────────────────────────────────────────────
// IMPORTS: none (usa (window as any).AppShell)
// EXPORTS:
//   collectAppShellState — Coleta estado do AppShell
//   collectPerformanceState — Coleta estado de performance
//   collectAdapterState — Coleta estado de adapters
//   collectDOMState — Coleta estado do DOM
// BROWSER APIs: window, document, performance
// ═══════════════════════════════════════════════════════════════
/**
 * @module StateSnapshotsCollectors
 * @description Coletores de estado
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.state-snapshots.collectors';

function _getShell() {
    return (typeof window !== 'undefined' && (window as any).AppShell) ? (window as any).AppShell : null;
}

export function collectAppShellState() {
    const shell = _getShell();
    if (!shell) return { error: 'AppShell not available' };

    const state: Record<string, unknown> = {};

    try {
        state.version = shell.version;
        state.initialized = shell.isInitialized?.() || false;
        state.ready = shell.isReady?.() || false;
        state.mounted = shell.isMounted?.() || false;
        state.phase = shell.getPhase?.() || null;

        if (shell.visibility?.getState) state.visibility = shell.visibility.getState();
        if (shell.resize?.getSizes) state.regionSizes = shell.resize.getSizes();
        if (shell.loading?.getLoadingState) state.loadingState = shell.loading.getLoadingState();

        if (shell.layoutPrefs?.get) state.layoutPrefs = shell.layoutPrefs.get();
        if (shell.layoutPresets?.getCurrent) state.layoutPreset = shell.layoutPresets.getCurrent();

        if (shell.theme?.getTheme) state.theme = shell.theme.getTheme();
        if (shell.theme?.getRegionThemes) state.regionThemes = shell.theme.getRegionThemes();

        if (shell.a11y?.getActivePresets) state.a11yPresets = shell.a11y.getActivePresets();
        if (shell.a11y?.getAllSettings) state.a11ySettings = shell.a11y.getAllSettings();

        if (shell.slots?.info) {
            const slotsInfo = shell.slots.info();
            state.slots = slotsInfo.slotsByRegion || {};
        }

        if (shell.maintenance?.getState) state.maintenance = shell.maintenance.getState();
        if (shell.debugPresets?.getCurrent) state.debugPreset = shell.debugPresets.getCurrent();
        if (shell.shortcuts?.getAll) state.shortcuts = shell.shortcuts.getAll()?.length || 0;
        if (shell.notify?.getAll) state.notifications = shell.notify.getAll()?.length || 0;
    } catch (e: any) {
        state._collectionError = e.message;
    }

    return state;
}

export function collectPerformanceState(config: DynObj) {
    if (!config.includePerformance) return null;

    const perf: Record<string, unknown> = {};

    try {
        const shell = _getShell();
        if (shell?.perf?.getMetrics) {
            perf.metrics = shell.perf.getMetrics();
        }
        if (typeof window !== 'undefined' && window.performance) {
            perf.memory = (window.performance as any).memory ? {
                usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
                totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize
            } : null;
            perf.timing = {
                navigationStart: window.performance.timing?.navigationStart,
                loadEventEnd: window.performance.timing?.loadEventEnd
            };
        }
    } catch (e: any) {
        perf._error = e.message;
    }

    return perf;
}

export function collectAdapterState(config: DynObj) {
    if (!config.includeAdapters) return null;
    const shell = _getShell();
    if (!shell) return null;

    const adapters: Record<string, unknown> = {};

    try {
        if (shell.responsive?.info) {
            const respInfo = shell.responsive.info();
            adapters.responsive = { breakpoint: respInfo.currentBreakpoint, enabled: respInfo.enabled };
        }
        if (shell.offline?.getState) adapters.offline = shell.offline.getState();
        if (shell.serviceWorker?.getState) adapters.serviceWorker = shell.serviceWorker.getState();
    } catch (e: any) {
        adapters._error = e.message;
    }

    return adapters;
}

export function collectDOMState(config: DynObj) {
    if (!config.includeDOM) return null;

    const dom: Record<string, unknown> = {};

    try {
        const regions = ['header', 'nav-rail', 'sidebar', 'main', 'footer'];
        for (let i = 0; i < regions.length; i++) {
            const region = regions[i];
            const el = document.querySelector(`[data-region="${region}"]`);
            if (el) {
                dom[region] = {
                    exists: true,
                    visible: (el as any).offsetParent !== null,
                    classList: Array.from(el.classList),
                    childCount: el.children.length
                };
            } else {
                dom[region] = { exists: false };
            }
        }
    } catch (e: any) {
        dom._error = e.message;
    }

    return dom;
}

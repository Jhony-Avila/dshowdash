// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: state-snapshots/core
// PURPOSE: Operações core de snapshots (capture, restore, compare)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   generateId, getSize from ./constants.js
//   collectAppShellState, collectPerformanceState, collectAdapterState, collectDOMState from ./collectors.js
// EXPORTS:
//   capture — Captura snapshot
//   restore — Restaura snapshot
//   compare — Compara dois snapshots
//   getSnapshot, getAllSnapshots, getLatestSnapshot — Consultas
//   getByLabel, countSnapshots — Buscas
//   removeSnapshot, clearSnapshots — Gerenciamento
//   exportSnapshot, exportAllSnapshots, importSnapshot — Import/Export
// BROWSER APIs: (window as any).AppShell
// ═══════════════════════════════════════════════════════════════
/**
 * @module StateSnapshotsCore
 * @description Operações core de snapshots
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { generateId, getSize } from './constants.js';
import { collectAppShellState, collectPerformanceState, collectAdapterState, collectDOMState } from './collectors.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.state-snapshots.core';

export function capture(label: string, metadata: DynObj, state: DynObj) {
    const snapshot: any = {
        id: generateId(),
        label: label || `Snapshot ${state.snapshots.length + 1}`,
        timestamp: Date.now(),
        metadata: metadata || {},
        appShell: collectAppShellState(),
        performance: collectPerformanceState(state.config),
        adapters: collectAdapterState(state.config),
        dom: collectDOMState(state.config)
    };

    snapshot.size = getSize(snapshot);
    state.snapshots.push(snapshot);
    state.metrics.snapshotsTaken++;

    while (state.snapshots.length > state.config.maxSnapshots) {
        state.snapshots.shift();
    }

    state.notify({
        type: 'captured',
        snapshot: { id: snapshot.id, label: snapshot.label, timestamp: snapshot.timestamp },
        total: state.snapshots.length
    });

    return snapshot;
}

export function restore(snapshotId: string, options: DynObj, state: DynObj) {
    const snapshot = state.snapshots.find((s: DynObj) => s.id === snapshotId);
    if (!snapshot) return { success: false, error: 'Snapshot não encontrado' };

    options = options || { layout: true, theme: true, a11y: true, visibility: true };
    const restored: DynObj[] = [];

    try {
        const appState = snapshot.appShell;
        const shell = (typeof window !== 'undefined' && (window as any).AppShell) ? (window as any).AppShell : null;

        if (!shell) return { success: false, error: 'AppShell not available', restored };

        if (options.layout && appState.layoutPrefs && shell.layoutPrefs?.setPreferences) {
            shell.layoutPrefs.setPreferences(appState.layoutPrefs);
            restored.push('layoutPrefs');
        }
        if (options.layout && appState.layoutPreset && shell.layoutPresets?.apply) {
            shell.layoutPresets.apply(appState.layoutPreset);
            restored.push('layoutPreset');
        }

        if (options.theme && appState.theme && shell.theme?.setTheme) {
            shell.theme.setTheme(appState.theme);
            restored.push('theme');
        }

        if (options.a11y && appState.a11yPresets && shell.a11y?.enableMultiple) {
            shell.a11y.reset?.();
            shell.a11y.enableMultiple(appState.a11yPresets);
            restored.push('a11yPresets');
        }

        if (options.visibility && appState.visibility && shell.visibility) {
            const regions = Object.keys(appState.visibility);
            for (let i = 0; i < regions.length; i++) {
                shell.visibility.setVisibility?.(regions[i], appState.visibility[regions[i]]);
            }
            restored.push('visibility');
        }

        state.metrics.snapshotsRestored++;
        state.notify({ type: 'restored', snapshotId, restored });

        return { success: true, restored, snapshotId };
    } catch (error: any) {
        state.metrics.errors++;
        return { success: false, error: error.message, restored };
    }
}

export function compare(snapshotId1: DynObj, snapshotId2: DynObj, state: DynObj) {
    const snap1 = state.snapshots.find((s: DynObj) => s.id === snapshotId1);
    const snap2 = state.snapshots.find((s: DynObj) => s.id === snapshotId2);

    if (!snap1 || !snap2) return { error: 'Um ou ambos snapshots não encontrados' };

    state.metrics.comparisons++;

    const diff = {
        snapshot1: { id: snap1.id, label: snap1.label, timestamp: snap1.timestamp },
        snapshot2: { id: snap2.id, label: snap2.label, timestamp: snap2.timestamp },
        timeDiff: snap2.timestamp - snap1.timestamp,
        changes: [] as DynObj
    };

    const fieldsToCompare = ['theme', 'layoutPreset', 'debugPreset', 'visibility', 'regionSizes'];

    for (let i = 0; i < fieldsToCompare.length; i++) {
        const field = fieldsToCompare[i];
        const val1 = JSON.stringify(snap1.appShell?.[field]);
        const val2 = JSON.stringify(snap2.appShell?.[field]);
        if (val1 !== val2) {
            diff.changes.push({ field, before: snap1.appShell?.[field], after: snap2.appShell?.[field] });
        }
    }

    if (snap1.performance?.memory && snap2.performance?.memory) {
        const memDiff = (snap2.performance.memory.usedJSHeapSize || 0) - (snap1.performance.memory.usedJSHeapSize || 0);
        if (memDiff !== 0) {
            diff.changes.push({
                field: 'memory.usedJSHeapSize',
                before: snap1.performance.memory.usedJSHeapSize,
                after: snap2.performance.memory.usedJSHeapSize,
                delta: memDiff
            });
        }
    }

    return diff;
}

export function getSnapshot(snapshotId: string, state: DynObj) {
    return state.snapshots.find((s: DynObj) => s.id === snapshotId) || null;
}

export function getAllSnapshots(state: DynObj) {
    return state.snapshots.map((s: DynObj) => ({
        id: s.id,
        label: s.label,
        timestamp: s.timestamp,
        size: s.size
    }));
}

export function getLatestSnapshot(state: DynObj) {
    return state.snapshots.length > 0 ? state.snapshots[state.snapshots.length - 1] : null;
}

export function getByLabel(label: string, state: DynObj) {
    return state.snapshots.filter((s: DynObj) => s.label.includes(label));
}

export function countSnapshots(state: DynObj) {
    return state.snapshots.length;
}

export function removeSnapshot(snapshotId: string, state: DynObj) {
    const idx = state.snapshots.findIndex((s: DynObj) => s.id === snapshotId);
    if (idx >= 0) { state.snapshots.splice(idx, 1); return true; }
    return false;
}

export function clearSnapshots(state: DynObj) {
    state.snapshots.length = 0;
    state.notify({ type: 'cleared' });
}

export function exportSnapshot(snapshotId: string, state: DynObj) {
    const snapshot = getSnapshot(snapshotId, state);
    if (!snapshot) return null;
    return JSON.stringify(snapshot, null, 2);
}

export function exportAllSnapshots(state: DynObj) {
    return JSON.stringify(state.snapshots, null, 2);
}

export function importSnapshot(data: DynObj, state: DynObj) {
    try {
        const snapshot = typeof data === 'string' ? JSON.parse(data) : data;
        if (!snapshot.id || !snapshot.timestamp) throw new Error('Invalid snapshot format');
        snapshot.id = generateId();
        snapshot.imported = true;
        state.snapshots.push(snapshot);
        return { success: true, id: snapshot.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

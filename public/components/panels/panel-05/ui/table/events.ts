declare const Logger: Record<string, Function>;
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:events
// PURPOSE: Panel-05 Table Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   EventEmitterMixin — exported value
//   TABLE_EVENTS — exported value
//   applyEventEmitter() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
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

// ═══════════════════════════════════════════════════════════════
// EVENT EMITTER MIXIN
// ═══════════════════════════════════════════════════════════════
export const EventEmitterMixin = {
    _initEvents() {
        // @ts-expect-error strict migration — TS2339
        this._listeners = new Map();
    },

    on(event: string, callback: (data: unknown) => void) {
        // @ts-expect-error strict migration — TS2339
        if (!this._listeners.has(event)) {
            // @ts-expect-error strict migration — TS2339
            this._listeners.set(event, []);
        }
        // @ts-expect-error strict migration — TS2339
        this._listeners.get(event).push(callback);
        return () => this.off(event, callback);
    },

    off(event: string, callback: (data: unknown) => void) {
        // @ts-expect-error strict migration — TS2339
        const callbacks = this._listeners.get(event);
        if (callbacks) {
            const idx = callbacks.indexOf(callback);
            if (idx > -1) callbacks.splice(idx, 1);
        }
    },

    emit(event: string, data: unknown) {
        // @ts-expect-error strict migration — TS2339
        const callbacks = this._listeners.get(event);
        if (callbacks) {
            callbacks.forEach((cb: (data: unknown) => void) => {
                try {
                    cb(data);
                } catch (e) {
                    Logger?.error?.('[panel-05:table:events]', event, e);
                }
            });
        }
    },

    clearEvents() {
        // @ts-expect-error strict migration — TS2339
        this._listeners.clear();
    }
};

// ═══════════════════════════════════════════════════════════════
// EVENT NAMES (standardized)
// ═══════════════════════════════════════════════════════════════
export const TABLE_EVENTS = {
    // Row actions
    VIEW: 'view',
    EDIT: 'edit',
    DELETE: 'delete',
    TOGGLE_FAVORITO: 'toggleFavorito',
    
    // Selection
    ROW_SELECT: 'rowSelect',
    ROW_EXPAND: 'rowExpand',
    
    // Bulk actions
    BULK_DELETE: 'bulkDelete',
    
    // Data
    SORT: 'sort',
    SEARCH: 'search',
    PAGE: 'page',
    EXPORT: 'export',
    
    // Scroll
    LOAD_MORE: 'loadMore',
    INFINITE_LOADED: 'infiniteLoaded',
    SCROLL_MODE_CHANGE: 'scrollModeChange',
    
    // Columns
    COLUMN_REORDER: 'columnReorder',
    
    // UI
    TOAST: 'toast'
};

// ═══════════════════════════════════════════════════════════════
// APPLY MIXIN HELPER
// ═══════════════════════════════════════════════════════════════
export function applyEventEmitter(target: Record<string, unknown>) {
    Object.assign(target, EventEmitterMixin);
    (target._initEvents as () => void)();
}

export default EventEmitterMixin;

export const MODULE_ID = 'panel-05:table:events';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true } }; }

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-header-admin/state
// PURPOSE: Panel Header Admin - State Barrel (re-exports from store)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   state, VERSION, MODULE_ID, injectPorts, getPorts from ./store.js
//
// PROVIDES:
//   setEditingComponent() — exported function
//   setModalOpen() — exported function
//   getComponents() — exported function
//   getEditingComponent() — exported function
//   setLoading() — exported function
//   setComponents() — exported function
//   getState() — exported function
//   subscribe() — exported function
//   init() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { state, VERSION, MODULE_ID, injectPorts, getPorts } from './store.js';

export { VERSION, MODULE_ID, injectPorts, getPorts };

export const init = () => state.init();
export const getState = () => state.getState();
export const subscribe = (fn: (s: unknown) => void) => state.subscribe(fn);

export const setEditingComponent = (component: Record<string, unknown> | null) => state.setEditingComponent(component);
export const setComponents = (components: Record<string, unknown>[]) => state.setComponents(components);
export const setLoading = (loading: boolean) => { if (loading) state.markLoading(); else state.markReady(); };
export const setModalOpen = (open: boolean) => {
    const s = state.getState();
    if (!open) state.clearEditingComponent();
};
export const getComponents = () => state.getState().components;
export const getEditingComponent = () => state.getState().editingComponent;
export const getFilteredComponents = () => state.getFilteredComponents();

export const healthCheck = () => state.healthCheck();
export const info = () => state.info();

export default state;

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-health-dashboard-store
// PURPOSE: Panel Health Dashboard - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   Store — exported value
//   actions — exported value
//   selectors — exported value
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
export const MODULE_ID = 'panel-health-dashboard-store';

// Estado inicial
type StoreState = {
  loading: boolean;
  error: string | null;
  snapshot: Record<string, unknown> | null;
  lastUpdate: number | null;
  selectedModule: string | null;
  expandedCategories: string[];
};

const initialState: StoreState = {
  loading: false,
  error: null,
  snapshot: null,
  lastUpdate: null,
  selectedModule: null,
  expandedCategories: ['core', 'components', 'panels']
};

let _state: StoreState = { ...initialState };
const _listeners = new Set<Function>();

// Store simples
export const Store = {
  getState: () => ({ ..._state }),

  setState: (partial: Partial<StoreState>) => {
    _state = { ..._state, ...partial };
    _listeners.forEach(fn => {
      try { fn(_state); } catch (e) {}
    });
  },

  subscribe: (fn: (state: StoreState) => void) => {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
  
  reset: () => {
    _state = { ...initialState };
    _listeners.forEach(fn => {
      try { fn(_state); } catch (e) {}
    });
  }
};

// Actions
export const actions = {
  setLoading: (loading: boolean) => Store.setState({ loading }),
  setError: (error: string | null) => Store.setState({ error }),
  setSnapshot: (snapshot: Record<string, unknown> | null) => Store.setState({ snapshot, lastUpdate: Date.now() }),
  setSelectedModule: (module: string | null) => Store.setState({ selectedModule: module }),
  toggleCategory: (category: string) => {
    const expanded = [..._state.expandedCategories];
    const idx = expanded.indexOf(category);
    if (idx >= 0) expanded.splice(idx, 1);
    else expanded.push(category);
    Store.setState({ expandedCategories: expanded });
  }
};

// Selectors
export const selectors = {
  isLoading: () => _state.loading,
  getError: () => _state.error,
  getSnapshot: () => _state.snapshot,
  getLastUpdate: () => _state.lastUpdate,
  getSelectedModule: () => _state.selectedModule,
  isExpanded: (category: string) => _state.expandedCategories.includes(category)
};

export default Store;


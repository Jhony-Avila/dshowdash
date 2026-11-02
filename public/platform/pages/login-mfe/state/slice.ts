// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-mfe/state
// PURPOSE: Login MFE State Slice
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   createSlice
//   updateState
//   getState
//   resetState
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '3.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'login-mfe/state';

interface SliceState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  lastAttempt: string | null;
  [key: string]: unknown;
}

interface SliceContext {
  stateEngine?: { createSlice?: (id: string, state: Record<string, unknown>, reducers: Record<string, unknown>) => unknown; dispatch?: (action: Record<string, unknown>) => void };
}

interface SliceAction {
  payload: unknown;
}

const INITIAL_STATE: SliceState = { isAuthenticated: false, loading: false, error: null, lastAttempt: null };
let _state: SliceState = { ...INITIAL_STATE };
let _context: SliceContext | null = null;

export function createSlice(context: SliceContext | null) {
  _context = context;
  _state = { ...INITIAL_STATE };
  if (_context?.stateEngine?.createSlice) {
    return _context.stateEngine.createSlice(MODULE_ID, INITIAL_STATE, {
      setAuthenticated: (state: SliceState, action: SliceAction) => ({ ...state, isAuthenticated: action.payload as boolean }),
      setLoading: (state: SliceState, action: SliceAction) => ({ ...state, loading: action.payload as boolean }),
      setError: (state: SliceState, action: SliceAction) => ({ ...state, error: action.payload as string | null }),
      reset: () => ({ ...INITIAL_STATE })
    });
  }
  return null;
}

export function updateState(updates: Partial<SliceState>) {
  _state = { ..._state, ...updates };
  if (_context?.stateEngine?.dispatch) {
    Object.keys(updates).forEach((key: string) => {
      _context!.stateEngine!.dispatch!({ slice: MODULE_ID, type: `set${key.charAt(0).toUpperCase() + key.slice(1)}`, payload: updates[key] });
    });
  }
}

export function getState() { return { ..._state }; }
export function resetState() { _state = { ...INITIAL_STATE }; }

export default { createSlice, updateState, getState, resetState, VERSION, MODULE_ID };

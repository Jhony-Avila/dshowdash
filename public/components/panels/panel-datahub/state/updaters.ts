// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-datahub/state/updaters
// PURPOSE: Data Hub - State Updaters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setLoading() — exported function
//   setError() — exported function
//   setData() — exported function
//   clearError() — exported function
//   reset() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
export const MODULE_ID = 'panels/panel-datahub/state/updaters';

interface StoreWithSetState { setState(partial: Record<string, unknown>): void; }
export function setLoading(store: StoreWithSetState, loading: boolean) { store.setState({ loading }); }
export function setError(store: StoreWithSetState, error: string | null) { store.setState({ error, loading: false }); }
export function setData(store: StoreWithSetState, data: unknown) { store.setState({ data, loading: false, error: null }); }
export function clearError(store: StoreWithSetState) { store.setState({ error: null }); }
export function reset(store: StoreWithSetState) { store.setState({ loading: false, error: null, data: null }); }

let _state: { _initialized?: boolean } | null = null;
export function healthCheck() { return { status: (_state?._initialized !== false) ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { setLoading, setError, setData, clearError, reset, healthCheck, info, VERSION, MODULE_ID };

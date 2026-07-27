// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-footer-cpu/state/updaters
// PURPOSE: Footer  - State Updaters
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
export const MODULE_ID = 'panels/panel-footer-cpu/state/updaters';

export function setLoading(store: { setState: (u: Record<string, unknown>) => void }, loading: boolean) { store.setState({ loading }); }
export function setError(store: { setState: (u: Record<string, unknown>) => void }, error: string | null) { store.setState({ error, loading: false }); }
export function setData(store: { setState: (u: Record<string, unknown>) => void }, data: unknown) { store.setState({ data, loading: false, error: null }); }
export function clearError(store: { setState: (u: Record<string, unknown>) => void }) { store.setState({ error: null }); }
export function reset(store: { setState: (u: Record<string, unknown>) => void }) { store.setState({ loading: false, error: null, data: null }); }

let _state: Record<string, unknown> | null = null;
export function healthCheck() { return { status: (_state?._initialized !== false) ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { setLoading, setError, setData, clearError, reset, healthCheck, info, VERSION, MODULE_ID };

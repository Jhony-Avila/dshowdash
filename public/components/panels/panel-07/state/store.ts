// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-07/state/store
// PURPOSE: Panel 07 - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createStatePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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
import { createStatePorts } from '/core/runtime/ports-profiles.js';
const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-07/state/store';
const Ports = createStatePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export class StateStore {
  [key: string]: unknown;
  constructor() { this.state = { data: null, loading: false, error: null }; this.listeners = new Set(); _initPorts(); }
  getState() { return { ...(this.state as Record<string, unknown>) }; }
  setState(partial: Record<string, unknown>) { this.state = { ...(this.state as Record<string, unknown>), ...partial }; this.notify(); }
  subscribe(listener: (state: Record<string, unknown>) => void) { (this.listeners as Set<(state: Record<string, unknown>) => void>).add(listener); return () => (this.listeners as Set<(state: Record<string, unknown>) => void>).delete(listener); }
  notify() { (this.listeners as Set<(state: Record<string, unknown>) => void>).forEach(listener => listener(this.state as Record<string, unknown>)); }
  setData(data: unknown) { this.setState({ data, loading: false, error: null }); }
  setLoading(loading: boolean) { this.setState({ loading }); }
  setError(error: string) { this.setState({ error, loading: false }); }
  reset() { this.state = { data: null, loading: false, error: null }; this.notify(); }
  healthCheck() { const s = this.state as { data: unknown; loading: boolean; error: unknown }; return { status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, state: { hasData: !!s.data, loading: s.loading, hasError: !!s.error }, portsInitialized: Ports.snapshot()._initialized }; }
  info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized }; }
}
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
export const healthCheck = () => ({ status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
export { VERSION, MODULE_ID };
export const store = new StateStore();
export default StateStore;

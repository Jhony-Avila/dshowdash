// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin/state/store
// PURPOSE: Panel Feature Flags Admin - State Store
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
const MODULE_ID = 'panel-feature-flags-admin/state/store';
const Ports = createStatePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export class StateStore {
  [key: string]: any;
  constructor() { this.state = { flags: [], loading: false, error: null, searchTerm: '', selectedFlag: null }; this.listeners = new Set(); _initPorts(); }
  getState() { return { ...this.state }; }
  setState(partial: Record<string, unknown>) { this.state = { ...this.state, ...partial }; this.notify(); }
  subscribe(listener: (state: Record<string, unknown>) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  notify() { this.listeners.forEach((listener: (state: Record<string, unknown>) => void) => listener(this.state)); }
  setFlags(flags: unknown[]) { this.setState({ flags, loading: false, error: null }); }
  setLoading(loading: boolean) { this.setState({ loading }); }
  setError(error: string) { this.setState({ error, loading: false }); }
  setSearchTerm(searchTerm: string) { this.setState({ searchTerm }); }
  setSelectedFlag(flag: unknown) { this.setState({ selectedFlag: flag }); }
  reset() { this.state = { flags: [], loading: false, error: null, searchTerm: '', selectedFlag: null }; this.notify(); }
  healthCheck() { return { status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, state: { flagCount: this.state.flags.length, loading: this.state.loading, hasError: !!this.state.error }, portsInitialized: Ports.snapshot()._initialized }; }
  info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized }; }
}
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
export const healthCheck = () => ({ status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
export { VERSION, MODULE_ID };
export const store = new StateStore();
export default StateStore;

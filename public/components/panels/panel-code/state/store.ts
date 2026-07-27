// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-code/state/store
// PURPOSE: Panel Code - State Store
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
const MODULE_ID = 'panel-code/state/store';
const Ports = createStatePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export class StateStore {
  [key: string]: any;
  constructor() { this.state = { code: '', language: 'javascript', output: null, loading: false, error: null, history: [] }; this.listeners = new Set(); _initPorts(); }
  getState() { return { ...this.state }; }
  setState(partial: Record<string, unknown>) { this.state = { ...this.state, ...partial }; this.notify(); }
  subscribe(listener: (state: Record<string, unknown>) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  notify() { this.listeners.forEach((listener: (state: Record<string, unknown>) => void) => listener(this.state)); }
  setCode(code: string) { this.setState({ code }); }
  setLanguage(language: string) { this.setState({ language }); }
  setOutput(output: unknown) { this.setState({ output, loading: false, error: null }); }
  setLoading(loading: boolean) { this.setState({ loading }); }
  setError(error: string | null) { this.setState({ error, loading: false }); }
  addToHistory(entry: Record<string, unknown>) { this.setState({ history: [...this.state.history, { ...entry, timestamp: Date.now() }] }); }
  reset() { this.state = { code: '', language: 'javascript', output: null, loading: false, error: null, history: [] }; this.notify(); }
  healthCheck() { return { status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, state: { hasCode: !!this.state.code, loading: this.state.loading, historyCount: this.state.history.length }, portsInitialized: Ports.snapshot()._initialized }; }
  info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized }; }
}
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
export const healthCheck = () => ({ status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
export { VERSION, MODULE_ID };
export const store = new StateStore();
export default StateStore;

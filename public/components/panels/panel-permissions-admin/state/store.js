import { createStatePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-permissions-admin/state/store";
const Ports = createStatePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
class StateStore {
  constructor() {
    this.state = { users: [], roles: [], permissions: [], loading: false, error: null };
    this.listeners = /* @__PURE__ */ new Set();
    _initPorts();
  }
  getState() {
    return { ...this.state };
  }
  setState(partial) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }
  setUsers(users) {
    this.setState({ users });
  }
  setRoles(roles) {
    this.setState({ roles });
  }
  setPermissions(permissions) {
    this.setState({ permissions });
  }
  setLoading(loading) {
    this.setState({ loading });
  }
  setError(error) {
    this.setState({ error });
  }
  reset() {
    this.state = { users: [], roles: [], permissions: [], loading: false, error: null };
    this.notify();
  }
  healthCheck() {
    return { status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, state: { userCount: this.state.users.length, roleCount: this.state.roles.length, permissionCount: this.state.permissions.length }, portsInitialized: Ports.snapshot()._initialized };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized };
  }
}
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
var store_default = StateStore;
export {
  MODULE_ID,
  StateStore,
  StateStore as Store,
  VERSION,
  store_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};

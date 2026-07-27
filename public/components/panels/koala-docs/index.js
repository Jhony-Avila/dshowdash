import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "0.1.0-F1";
const MODULE_ID = "koala-docs";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let _container = null;
const mount = (root, _props = {}) => {
  _initPorts();
  _container = root;
  root.innerHTML = '<iframe src="/koala/" title="Koala Docs" style="width:100%;height:100%;min-height:calc(100vh - 140px);border:0;display:block;background:#f6f7f9"></iframe>';
  return Promise.resolve(true);
};
const unmount = () => {
  if (_container) {
    _container.innerHTML = "";
  }
  _container = null;
};
const destroy = () => unmount();
const dispose = () => unmount();
const getVersion = () => VERSION;
const getStatus = () => ({ mounted: Boolean(_container), version: VERSION, moduleId: MODULE_ID });
const healthCheck = () => ({
  status: "HEALTHY",
  checks: { instanceExists: Boolean(_container) },
  version: VERSION,
  moduleId: MODULE_ID,
  timestamp: Date.now()
});
const info = () => ({ moduleId: MODULE_ID, version: VERSION, type: "embed-iframe" });
const koala_docs_default = {
  mount,
  unmount,
  destroy,
  dispose,
  healthCheck,
  info,
  getVersion,
  getStatus,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  koala_docs_default as default,
  destroy,
  dispose,
  getPorts,
  getStatus,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  mount,
  unmount
};

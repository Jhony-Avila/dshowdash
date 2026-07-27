import { state, VERSION, MODULE_ID, injectPorts, getPorts } from "./store.js";
const init = () => state.init();
const getState = () => state.getState();
const subscribe = (fn) => state.subscribe(fn);
const setEditingComponent = (component) => state.setEditingComponent(component);
const setComponents = (components) => state.setComponents(components);
const setLoading = (loading) => {
  if (loading) state.markLoading();
  else state.markReady();
};
const setModalOpen = (open) => {
  const s = state.getState();
  if (!open) state.clearEditingComponent();
};
const getComponents = () => state.getState().components;
const getEditingComponent = () => state.getState().editingComponent;
const getFilteredComponents = () => state.getFilteredComponents();
const healthCheck = () => state.healthCheck();
const info = () => state.info();
var state_default = state;
export {
  MODULE_ID,
  VERSION,
  state_default as default,
  getComponents,
  getEditingComponent,
  getFilteredComponents,
  getPorts,
  getState,
  healthCheck,
  info,
  init,
  injectPorts,
  setComponents,
  setEditingComponent,
  setLoading,
  setModalOpen,
  subscribe
};

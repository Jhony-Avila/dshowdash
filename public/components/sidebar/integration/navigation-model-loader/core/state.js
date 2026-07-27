import { STATES } from "./contracts.js";
const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.integration.navigation-model-loader.core.state";
const state = {
  status: STATES.IDLE,
  model: null,
  lastLoad: null,
  lastError: null,
  source: null,
  loadCount: 0
};
const getState = () => ({ ...state });
const getStatus = () => state.status;
const getModel = () => state.model;
const setStatus = (status) => {
  state.status = status;
};
const setModel = (model, source = "unknown") => {
  state.model = model;
  state.source = source;
  state.lastLoad = Date.now();
  state.loadCount++;
};
const setError = (error) => {
  state.lastError = {
    message: error?.message || String(error),
    timestamp: Date.now()
  };
};
const resetState = () => {
  state.status = STATES.IDLE;
  state.model = null;
  state.lastLoad = null;
  state.lastError = null;
  state.source = null;
};
const isLoaded = () => state.status === STATES.LOADED;
const isLoading = () => state.status === STATES.LOADING;
export {
  MODULE_ID,
  VERSION,
  getModel,
  getState,
  getStatus,
  isLoaded,
  isLoading,
  resetState,
  setError,
  setModel,
  setStatus
};

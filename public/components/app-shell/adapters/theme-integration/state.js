const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.theme-integration.state";
const state = {
  currentTheme: null,
  resolvedTheme: null,
  systemPreference: null,
  mediaQuery: null,
  initialized: false,
  listeners: [],
  subscribers: [],
  regionThemes: {},
  metrics: {
    themeChanges: 0,
    systemPreferenceChanges: 0,
    errors: 0
  }
};
const config = {
  defaultTheme: "system",
  storageKey: "app-shell-theme",
  transitionDuration: 200,
  respectSystemPreference: true
};
const _state = state;
const _config = config;
const _subscribers = state.subscribers;
function getCurrentTheme() {
  return state.currentTheme;
}
function setCurrentTheme(theme) {
  state.currentTheme = theme;
}
function getResolvedTheme() {
  return state.resolvedTheme;
}
function setResolvedTheme(theme) {
  state.resolvedTheme = theme;
}
function getSystemPreference() {
  return state.systemPreference;
}
function setSystemPreference(pref) {
  state.systemPreference = pref;
}
function getMediaQuery() {
  return state.mediaQuery;
}
function setMediaQuery(mq) {
  state.mediaQuery = mq;
}
function isInitialized() {
  return state.initialized;
}
function setInitialized(val) {
  state.initialized = !!val;
}
function getListeners() {
  return state.listeners;
}
function addListener(listener) {
  state.listeners.push(listener);
}
function removeListener(listener) {
  const idx = state.listeners.indexOf(listener);
  if (idx >= 0) state.listeners.splice(idx, 1);
}
function getRegionThemes() {
  return state.regionThemes;
}
function setRegionTheme(regionName, theme) {
  state.regionThemes[regionName] = theme;
}
function deleteRegionTheme(regionName) {
  delete state.regionThemes[regionName];
}
function hasRegionTheme(regionName) {
  return !!state.regionThemes[regionName];
}
function getMetrics() {
  return {
    themeChanges: state.metrics.themeChanges,
    systemPreferenceChanges: state.metrics.systemPreferenceChanges,
    errors: state.metrics.errors
  };
}
function incrementMetric(name) {
  if (state.metrics[name] !== void 0) {
    state.metrics[name]++;
  }
}
function getConfig() {
  return Object.assign({}, config);
}
function setConfigValue(key, value) {
  if (config.hasOwnProperty(key)) {
    config[key] = value;
  }
}
function notifySubscribers(event, data) {
  for (let i = 0; i < state.subscribers.length; i++) {
    try {
      state.subscribers[i](event, data);
    } catch (e) {
    }
  }
  for (let j = 0; j < state.listeners.length; j++) {
    try {
      state.listeners[j](event, data);
    } catch (e) {
    }
  }
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  state.subscribers.push(callback);
  return () => {
    const idx = state.subscribers.indexOf(callback);
    if (idx >= 0) state.subscribers.splice(idx, 1);
  };
}
var state_default = state;
export {
  MODULE_ID,
  VERSION,
  _config,
  _state,
  _subscribers,
  addListener,
  state_default as default,
  deleteRegionTheme,
  getConfig,
  getCurrentTheme,
  getListeners,
  getMediaQuery,
  getMetrics,
  getRegionThemes,
  getResolvedTheme,
  getSystemPreference,
  hasRegionTheme,
  incrementMetric,
  isInitialized,
  notifySubscribers,
  removeListener,
  setConfigValue,
  setCurrentTheme,
  setInitialized,
  setMediaQuery,
  setRegionTheme,
  setResolvedTheme,
  setSystemPreference,
  subscribe
};

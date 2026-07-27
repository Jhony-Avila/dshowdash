const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.debug-presets.state";
const _state = {
  current: null,
  previous: null,
  currentConfig: null,
  enabled: false,
  history: [],
  subscribers: []
};
const _config = {
  maxHistorySize: 10,
  persistOnChange: true
};
function addToHistory(presetName) {
  _state.history.push({
    preset: presetName,
    timestamp: Date.now()
  });
  if (_state.history.length > _config.maxHistorySize) {
    _state.history.shift();
  }
}
function notifySubscribers(event, data) {
  for (let i = 0; i < _state.subscribers.length; i++) {
    try {
      _state.subscribers[i](event, data);
    } catch (e) {
    }
  }
}
function getState() {
  return {
    current: _state.current,
    previous: _state.previous,
    enabled: _state.enabled,
    historyLength: _state.history.length
  };
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _state.subscribers.push(callback);
  return () => {
    const idx = _state.subscribers.indexOf(callback);
    if (idx >= 0) _state.subscribers.splice(idx, 1);
  };
}
function unsubscribe(callback) {
  const idx = _state.subscribers.indexOf(callback);
  if (idx >= 0) {
    _state.subscribers.splice(idx, 1);
    return true;
  }
  return false;
}
export {
  MODULE_ID,
  VERSION,
  _config,
  _state,
  addToHistory,
  getState,
  notifySubscribers,
  subscribe,
  unsubscribe
};

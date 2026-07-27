import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "router.navigation.history";
const hasWindow = typeof window !== "undefined";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _log(level, msg, ctx) {
  if (!ctx) ctx = {};
  const logger = _getPort("logger");
  if (!logger || typeof logger[level] !== "function") return;
  ctx.component = MODULE_ID;
  logger[level](msg, ctx);
}
const CONFIG = { maxSize: 100, persistKey: "router_nav_history", persist: false };
let _stack = [];
let _currentIndex = -1;
let _navigationId = 0;
function _generateNavId() {
  return `nav_${++_navigationId}_${Date.now()}`;
}
const NavigationHistory = {
  push(entry) {
    const navEntry = { id: _generateNavId(), path: entry.path, routeId: entry.routeId || null, title: entry.title || null, timestamp: Date.now(), scrollPosition: entry.scrollPosition || { x: 0, y: 0 }, state: entry.state || null, params: entry.params || {}, query: entry.query || {}, hash: entry.hash || "" };
    if (_currentIndex < _stack.length - 1) {
      _stack = _stack.slice(0, _currentIndex + 1);
    }
    _stack.push(navEntry);
    _currentIndex = _stack.length - 1;
    if (_stack.length > CONFIG.maxSize) {
      _stack.shift();
      _currentIndex--;
    }
    _log("debug", "History pushed", { path: navEntry.path, index: _currentIndex, stackSize: _stack.length });
    if (CONFIG.persist) this._persist();
    return navEntry;
  },
  replace(entry) {
    if (_currentIndex < 0) {
      return this.push(entry);
    }
    const navEntry = Object.assign({}, _stack[_currentIndex], { path: entry.path, routeId: entry.routeId || _stack[_currentIndex].routeId, title: entry.title || _stack[_currentIndex].title, timestamp: Date.now(), state: entry.state || _stack[_currentIndex].state });
    _stack[_currentIndex] = navEntry;
    _log("debug", "History replaced", { path: navEntry.path, index: _currentIndex });
    if (CONFIG.persist) this._persist();
    return navEntry;
  },
  // @ts-expect-error TS migration - TS2554
  back(steps) {
    if (!steps) steps = 1;
    const newIndex = Math.max(0, _currentIndex - steps);
    if (newIndex === _currentIndex) {
      _log("debug", "Cannot go back further");
      return null;
    }
    _currentIndex = newIndex;
    const entry = _stack[_currentIndex];
    _log("debug", "History back", { path: entry.path, index: _currentIndex });
    return entry;
  },
  // @ts-expect-error TS migration - TS2554
  forward(steps) {
    if (!steps) steps = 1;
    const newIndex = Math.min(_stack.length - 1, _currentIndex + steps);
    if (newIndex === _currentIndex) {
      _log("debug", "Cannot go forward further");
      return null;
    }
    _currentIndex = newIndex;
    const entry = _stack[_currentIndex];
    _log("debug", "History forward", { path: entry.path, index: _currentIndex });
    return entry;
  },
  go(index) {
    if (index < 0 || index >= _stack.length) {
      return null;
    }
    _currentIndex = index;
    return _stack[_currentIndex];
  },
  canGoBack() {
    return _currentIndex > 0;
  },
  canGoForward() {
    return _currentIndex < _stack.length - 1;
  },
  backSteps() {
    return _currentIndex;
  },
  forwardSteps() {
    return _stack.length - 1 - _currentIndex;
  },
  current() {
    return _currentIndex >= 0 ? _stack[_currentIndex] : null;
  },
  previous() {
    return _currentIndex > 0 ? _stack[_currentIndex - 1] : null;
  },
  next() {
    return _currentIndex < _stack.length - 1 ? _stack[_currentIndex + 1] : null;
  },
  getStack() {
    const idx = _currentIndex;
    return _stack.map((entry, index) => Object.assign({}, entry, { isCurrent: index === idx }));
  },
  getRecent(n) {
    if (!n) n = 10;
    const start = Math.max(0, _currentIndex - n + 1);
    return _stack.slice(start, _currentIndex + 1).reverse();
  },
  find(predicate) {
    for (let i = 0; i < _stack.length; i++) {
      if (predicate(_stack[i])) return _stack[i];
    }
    return void 0;
  },
  findIndex(predicate) {
    for (let i = 0; i < _stack.length; i++) {
      if (predicate(_stack[i])) return i;
    }
    return -1;
  },
  has(path) {
    for (let i = 0; i < _stack.length; i++) {
      if (_stack[i].path === path) return true;
    }
    return false;
  },
  goToPath(path) {
    for (let i = _stack.length - 1; i >= 0; i--) {
      if (_stack[i].path === path) {
        _currentIndex = i;
        return _stack[i];
      }
    }
    return null;
  },
  updateScrollPosition(position) {
    if (_currentIndex >= 0 && _stack[_currentIndex]) {
      _stack[_currentIndex].scrollPosition = position;
      if (CONFIG.persist) this._persist();
    }
  },
  clear() {
    const count = _stack.length;
    _stack = [];
    _currentIndex = -1;
    if (CONFIG.persist) {
      try {
        localStorage.removeItem(CONFIG.persistKey);
      } catch (e) {
      }
    }
    return count;
  },
  configure(options) {
    Object.assign(CONFIG, options);
  },
  _persist() {
    try {
      const data = { stack: _stack.slice(-50), currentIndex: Math.max(0, _currentIndex - (_stack.length - 50)) };
      localStorage.setItem(CONFIG.persistKey, JSON.stringify(data));
    } catch (e) {
    }
  },
  _restore() {
    try {
      const saved = localStorage.getItem(CONFIG.persistKey);
      if (saved) {
        const data = JSON.parse(saved);
        _stack = data.stack || [];
        _currentIndex = data.currentIndex !== void 0 ? data.currentIndex : _stack.length - 1;
      }
    } catch (e) {
    }
  },
  getStatus() {
    const curr = this.current();
    return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), stackSize: _stack.length, currentIndex: _currentIndex, canGoBack: this.canGoBack(), canGoForward: this.canGoForward(), currentPath: curr ? curr.path : null };
  },
  healthCheck() {
    return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { hasHistory: _stack.length > 0, indexValid: _currentIndex >= -1 && _currentIndex < _stack.length } };
  }
};
var history_default = NavigationHistory;
export {
  MODULE_ID,
  NavigationHistory,
  VERSION,
  history_default as default,
  getPorts,
  injectPorts
};

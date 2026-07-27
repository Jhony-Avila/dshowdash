const VERSION = "3.0.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-dom";
let _shellRootRef = null;
let _metrics = { creates: 0, removes: 0 };
function ensureRoot(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
    _metrics.creates++;
  }
  return el;
}
function setShellRoot(el) {
  _shellRootRef = el;
}
function getShellRoot() {
  if (_shellRootRef && document.contains(_shellRootRef)) return _shellRootRef;
  return document.getElementById("app-shell");
}
function createElement(tag, attributes) {
  attributes = attributes || {};
  const el = document.createElement(tag);
  const keys = Object.keys(attributes);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = attributes[key];
    if (key === "className") el.className = value;
    else if (key === "textContent") el.textContent = value;
    else if (key === "innerHTML") el.innerHTML = value;
    else el.setAttribute(key, value);
  }
  _metrics.creates++;
  return el;
}
function removeElement(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
    _metrics.removes++;
    return true;
  }
  return false;
}
function getMetrics() {
  return { creates: _metrics.creates, removes: _metrics.removes };
}
function healthCheck() {
  const shellRoot = getShellRoot();
  const checks = {
    shellRootExists: !!shellRoot,
    bodyExists: !!document.body
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    shellRootExists: !!getShellRoot(),
    shellRootInMemory: !!_shellRootRef,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var dom_default = {
  VERSION,
  MODULE_ID,
  ensureRoot,
  setShellRoot,
  getShellRoot,
  createElement,
  removeElement,
  getMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  createElement,
  dom_default as default,
  ensureRoot,
  getMetrics,
  getShellRoot,
  healthCheck,
  info,
  removeElement,
  setShellRoot
};

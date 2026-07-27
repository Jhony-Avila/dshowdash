const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "modal-manager-global.ui.container";
const ROOT_ID = "modal-manager-root";
const BACKDROP_ID = "modal-manager-backdrop";
const STACK_ID = "modal-manager-stack";
let containerState = { root: null, backdrop: null, stack: null, mounted: false };
function createModalRoot(parentElement) {
  if (typeof document === "undefined") return null;
  const existing = document.getElementById(ROOT_ID);
  if (existing) {
    containerState.root = existing;
    containerState.backdrop = existing.querySelector(`#${BACKDROP_ID}`);
    containerState.stack = existing.querySelector(`#${STACK_ID}`);
    containerState.mounted = true;
    return existing;
  }
  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "modal-manager-root";
  root.setAttribute("data-component", "modal-manager-global");
  root.setAttribute("role", "presentation");
  root.setAttribute("aria-hidden", "true");
  const backdrop = document.createElement("div");
  backdrop.id = BACKDROP_ID;
  backdrop.className = "modal-manager-backdrop";
  backdrop.setAttribute("aria-hidden", "true");
  root.appendChild(backdrop);
  const stack = document.createElement("div");
  stack.id = STACK_ID;
  stack.className = "modal-manager-stack";
  root.appendChild(stack);
  const parent = parentElement || document.body;
  parent.appendChild(root);
  containerState.root = root;
  containerState.backdrop = backdrop;
  containerState.stack = stack;
  containerState.mounted = true;
  return root;
}
function getRoot() {
  return containerState.root;
}
function getBackdrop() {
  return containerState.backdrop;
}
function getStack() {
  return containerState.stack;
}
function isMounted() {
  return containerState.mounted;
}
function updateBackdrop(visible, options) {
  options = options || {};
  const backdrop = containerState.backdrop;
  if (!backdrop) return;
  if (visible) {
    backdrop.classList.add("visible");
    backdrop.style.setProperty("--modal-backdrop-opacity", String(options.opacity || 0.5));
    if (options.blur) {
      backdrop.classList.add("blur");
    } else {
      backdrop.classList.remove("blur");
    }
    if (options.clickToClose) {
      backdrop.setAttribute("data-click-close", "true");
    } else {
      backdrop.removeAttribute("data-click-close");
    }
  } else {
    backdrop.classList.remove("visible", "blur");
  }
}
function updateAriaHidden(hasModals) {
  const root = containerState.root;
  if (!root) return;
  root.setAttribute("aria-hidden", hasModals ? "false" : "true");
}
function destroy() {
  if (containerState.root) {
    containerState.root.remove();
  }
  containerState = { root: null, backdrop: null, stack: null, mounted: false };
}
function getState() {
  return { mounted: containerState.mounted, hasRoot: !!containerState.root, hasBackdrop: !!containerState.backdrop, hasStack: !!containerState.stack };
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, state: getState(), timestamp: Date.now() };
}
function healthCheck() {
  const checks = { mounted: containerState.mounted, hasRoot: !!containerState.root, hasBackdrop: !!containerState.backdrop, hasStack: !!containerState.stack };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : passed > 0 ? "DEGRADED" : "NOT_MOUNTED", score: `${passed}/${checkKeys.length}`, checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
var container_default = { createModalRoot, getRoot, getBackdrop, getStack, isMounted, updateBackdrop, updateAriaHidden, destroy, getState, getVersion, healthCheck, info, VERSION, MODULE_ID };
export {
  BACKDROP_ID,
  MODULE_ID,
  ROOT_ID,
  STACK_ID,
  VERSION,
  createModalRoot,
  container_default as default,
  destroy,
  getBackdrop,
  getRoot,
  getStack,
  getState,
  getVersion,
  healthCheck,
  info,
  isMounted,
  updateAriaHidden,
  updateBackdrop
};

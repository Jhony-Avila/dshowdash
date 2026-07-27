import { SHORTCUT_SCOPES } from "../constants.js";
import { getActiveScope, setActiveScope, getScopeStack } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-shortcuts.core.scope";
function setScope(scope, notifyFn) {
  const scopeStack = getScopeStack();
  const currentScope = getActiveScope();
  scopeStack.push(currentScope);
  setActiveScope(scope);
  if (notifyFn) {
    notifyFn({
      type: "scope-changed",
      scope,
      previousScope: currentScope,
      timestamp: Date.now()
    });
  }
}
function restoreScope() {
  const scopeStack = getScopeStack();
  if (scopeStack.length > 0) {
    setActiveScope(scopeStack.pop());
  } else {
    setActiveScope(SHORTCUT_SCOPES.GLOBAL);
  }
  return getActiveScope();
}
function getScope() {
  return getActiveScope();
}
function resetScope() {
  const scopeStack = getScopeStack();
  scopeStack.length = 0;
  setActiveScope(SHORTCUT_SCOPES.GLOBAL);
}
function getScopeDepth() {
  return getScopeStack().length;
}
var scope_default = {
  setScope,
  restoreScope,
  getScope,
  resetScope,
  getScopeDepth
};
export {
  MODULE_ID,
  VERSION,
  scope_default as default,
  getScope,
  getScopeDepth,
  resetScope,
  restoreScope,
  setScope
};

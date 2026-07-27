const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer-focus-governance";
let _focusStack = [];
const _inertElements = {};
const _ariaHiddenElements = {};
let _activeTrapId = null;
let _trapCleanup = null;
let _elementCounter = 0;
function _addToSet(obj, el) {
  const id = el._focusGovId || (el._focusGovId = `fg_${++_elementCounter}`);
  obj[id] = el;
}
function _removeFromSet(obj, el) {
  if (el._focusGovId) delete obj[el._focusGovId];
}
function _getSetSize(obj) {
  return Object.keys(obj).length;
}
function _forEachInSet(obj, fn) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    fn(obj[keys[i]]);
  }
}
function _clearSet(obj) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    delete obj[keys[i]];
  }
}
function captureFocus(overlayId, targetElement) {
  const activeElement = document.activeElement;
  _focusStack.push({
    overlayId,
    previousFocus: activeElement,
    timestamp: Date.now()
  });
  if (targetElement) {
    requestAnimationFrame(() => {
      const focusable = targetElement.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) || targetElement;
      if (focusable && focusable.focus) focusable.focus();
    });
  }
  return { ok: true, previousFocus: activeElement ? activeElement.tagName : null };
}
function restoreFocus(overlayId) {
  let index = -1;
  for (let i = 0; i < _focusStack.length; i++) {
    if (_focusStack[i].overlayId === overlayId) {
      index = i;
      break;
    }
  }
  if (index === -1) {
    return { ok: false, reason: "not-found" };
  }
  const entry = _focusStack[index];
  const previousFocus = entry.previousFocus;
  _focusStack.splice(index, 1);
  if (previousFocus && document.body.contains(previousFocus)) {
    requestAnimationFrame(() => {
      if (previousFocus && previousFocus.focus) previousFocus.focus();
    });
    return { ok: true, restored: previousFocus.tagName };
  }
  return { ok: true, restored: null };
}
function applyInert(overlayElement, excludeSelectors) {
  excludeSelectors = excludeSelectors || [];
  if (!overlayElement) return { ok: false, reason: "no-element" };
  const defaultExcludes = [
    "[data-overlay-container]",
    ".overlay-layer-container",
    "#shell-preloader-region"
  ];
  const allExcludes = defaultExcludes.concat(excludeSelectors);
  const mainContent = document.querySelectorAll(
    'header, main, aside, footer, nav, [data-region]:not([data-region="overlay"])'
  );
  for (let i = 0; i < mainContent.length; i++) {
    const el = mainContent[i];
    if (el === overlayElement || overlayElement.contains(el)) continue;
    let excluded = false;
    for (let j = 0; j < allExcludes.length; j++) {
      if (el.matches(allExcludes[j])) {
        excluded = true;
        break;
      }
    }
    if (excluded) continue;
    if (!el.hasAttribute("inert")) {
      el.setAttribute("inert", "");
      _addToSet(_inertElements, el);
    }
  }
  return { ok: true, inertCount: _getSetSize(_inertElements) };
}
function removeInert() {
  _forEachInSet(_inertElements, (el) => {
    el.removeAttribute("inert");
  });
  const count = _getSetSize(_inertElements);
  _clearSet(_inertElements);
  return { ok: true, removed: count };
}
function applyAriaHidden(overlayElement) {
  if (!overlayElement) return { ok: false, reason: "no-element" };
  const siblings = document.body.children;
  for (let i = 0; i < siblings.length; i++) {
    const el = siblings[i];
    if (el === overlayElement || overlayElement.contains(el)) continue;
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "LINK") continue;
    const currentValue = el.getAttribute("aria-hidden");
    if (currentValue !== "true") {
      el.dataset.prevAriaHidden = currentValue || "";
      el.setAttribute("aria-hidden", "true");
      _addToSet(_ariaHiddenElements, el);
    }
  }
  return { ok: true, hiddenCount: _getSetSize(_ariaHiddenElements) };
}
function removeAriaHidden() {
  _forEachInSet(_ariaHiddenElements, (el) => {
    const prevValue = el.dataset.prevAriaHidden;
    if (prevValue) {
      el.setAttribute("aria-hidden", prevValue);
    } else {
      el.removeAttribute("aria-hidden");
    }
    delete el.dataset.prevAriaHidden;
  });
  const count = _getSetSize(_ariaHiddenElements);
  _clearSet(_ariaHiddenElements);
  return { ok: true, restored: count };
}
function createFocusTrap(overlayElement, overlayId) {
  if (!overlayElement || _activeTrapId) {
    return { ok: false, reason: _activeTrapId ? "trap-already-active" : "no-element" };
  }
  _activeTrapId = overlayId;
  const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const handleKeydown = (e) => {
    if (e.key !== "Tab") return;
    const focusables = overlayElement.querySelectorAll(focusableSelector);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener("keydown", handleKeydown);
  _trapCleanup = () => {
    document.removeEventListener("keydown", handleKeydown);
    _activeTrapId = null;
    _trapCleanup = null;
  };
  return { ok: true, trapId: overlayId };
}
function removeFocusTrap(overlayId) {
  if (_activeTrapId !== overlayId) {
    return { ok: false, reason: "not-active-trap" };
  }
  if (_trapCleanup) {
    _trapCleanup();
  }
  return { ok: true };
}
function engageFocusGovernance(overlayId, overlayElement, options) {
  options = options || {};
  const results = {
    focus: captureFocus(overlayId, overlayElement),
    inert: options.useInert !== false ? applyInert(overlayElement) : { ok: true, skipped: true },
    ariaHidden: options.useAriaHidden !== false ? applyAriaHidden(overlayElement) : { ok: true, skipped: true },
    focusTrap: options.useFocusTrap !== false ? createFocusTrap(overlayElement, overlayId) : { ok: true, skipped: true }
  };
  return { ok: true, results };
}
function disengageFocusGovernance(overlayId) {
  const results = {
    focusTrap: removeFocusTrap(overlayId),
    inert: removeInert(),
    ariaHidden: removeAriaHidden(),
    focus: restoreFocus(overlayId)
  };
  return { ok: true, results };
}
function forceCleanup() {
  if (_trapCleanup) _trapCleanup();
  removeInert();
  removeAriaHidden();
  _focusStack = [];
  return { ok: true };
}
function healthCheck() {
  const checks = {
    noOrphanInert: _getSetSize(_inertElements) === 0 || _activeTrapId !== null,
    noOrphanAriaHidden: _getSetSize(_ariaHiddenElements) === 0 || _activeTrapId !== null,
    focusStackHealthy: _focusStack.length < 10,
    trapConsistent: _activeTrapId !== null === (_trapCleanup !== null)
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    focusStackSize: _focusStack.length,
    inertCount: _getSetSize(_inertElements),
    ariaHiddenCount: _getSetSize(_ariaHiddenElements),
    activeTrap: _activeTrapId,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    focusStackSize: _focusStack.length,
    inertCount: _getSetSize(_inertElements),
    ariaHiddenCount: _getSetSize(_ariaHiddenElements),
    activeTrap: _activeTrapId,
    timestamp: Date.now()
  };
}
var focus_governance_default = {
  captureFocus,
  restoreFocus,
  applyInert,
  removeInert,
  applyAriaHidden,
  removeAriaHidden,
  createFocusTrap,
  removeFocusTrap,
  engageFocusGovernance,
  disengageFocusGovernance,
  forceCleanup,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  applyAriaHidden,
  applyInert,
  captureFocus,
  createFocusTrap,
  focus_governance_default as default,
  disengageFocusGovernance,
  engageFocusGovernance,
  forceCleanup,
  healthCheck,
  info,
  removeAriaHidden,
  removeFocusTrap,
  removeInert,
  restoreFocus
};

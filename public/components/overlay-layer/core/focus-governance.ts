
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.focus-governance
// PURPOSE: Overlay Layer Focus Governance - Focus, aria-hidden and inert management
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract CAPTURE_FOCUS - captureFocus() saves and moves focus
// @contract RESTORE_FOCUS - restoreFocus() restores previous focus
// @contract APPLY_INERT - applyInert() marks elements as inert
// @contract REMOVE_INERT - removeInert() removes inert attribute
// @contract APPLY_ARIA_HIDDEN - applyAriaHidden() hides from screen readers
// @contract REMOVE_ARIA_HIDDEN - removeAriaHidden() shows to screen readers
// @contract CREATE_FOCUS_TRAP - createFocusTrap() traps focus in overlay
// @contract REMOVE_FOCUS_TRAP - removeFocusTrap() removes focus trap
// @contract ENGAGE - engageFocusGovernance() applies all governance
// @contract DISENGAGE - disengageFocusGovernance() removes all governance
// @contract FORCE_CLEANUP - forceCleanup() forces cleanup
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   captureFocus() — exported function
//   restoreFocus() — exported function
//   applyInert() — exported function
//   removeInert() — exported function
//   applyAriaHidden() — exported function
//   removeAriaHidden() — exported function
//   createFocusTrap() — exported function
//   removeFocusTrap() — exported function
//   engageFocusGovernance() — exported function
//   disengageFocusGovernance() — exported function
//   forceCleanup() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: document.activeElement, document.body, document.addEventListener
// ───────────────────────────────────────────────────────────────
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.1-ENTERPRISE: ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer-focus-governance';

let _focusStack: DynObj[] = []; // Stack de elementos focados antes de cada overlay
const _inertElements = {}; // Elementos marcados como inert (usando object como Set)
const _ariaHiddenElements = {}; // Elementos com aria-hidden (usando object como Set)
let _activeTrapId: DynObj = null;
let _trapCleanup: DynObj = null;
let _elementCounter = 0;

function _addToSet(obj: DynObj, el: DynObj) {
  const id = el._focusGovId || (el._focusGovId = `fg_${++_elementCounter}`);
  obj[id] = el;
}

function _removeFromSet(obj: DynObj, el: DynObj) {
  if (el._focusGovId) delete obj[el._focusGovId];
}

function _getSetSize(obj: DynObj) {
  return Object.keys(obj).length;
}

function _forEachInSet(obj: DynObj, fn: DynObj) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    fn(obj[keys[i]]);
  }
}

function _clearSet(obj: DynObj) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    delete obj[keys[i]];
  }
}

// Salva foco atual e move para overlay
export function captureFocus(overlayId: string, targetElement: DynObj) {
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

// Restaura foco para elemento anterior
export function restoreFocus(overlayId: string) {
  let index = -1;
  for (let i = 0; i < _focusStack.length; i++) {
    if (_focusStack[i].overlayId === overlayId) {
      index = i;
      break;
    }
  }
  if (index === -1) {
    return { ok: false, reason: 'not-found' };
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

// Aplica inert em elementos fora do overlay
export function applyInert(overlayElement: DynObj, excludeSelectors?: DynObj) {
  excludeSelectors = excludeSelectors || [];
  if (!overlayElement) return { ok: false, reason: 'no-element' };

  const defaultExcludes = [
    '[data-overlay-container]',
    '.overlay-layer-container',
    '#shell-preloader-region'
  ];
  const allExcludes = defaultExcludes.concat(excludeSelectors);

  // Marca elementos principais como inert
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

    if (!el.hasAttribute('inert')) {
      el.setAttribute('inert', '');
      _addToSet(_inertElements, el);
    }
  }

  return { ok: true, inertCount: _getSetSize(_inertElements) };
}

// Remove inert de todos os elementos
export function removeInert() {
  _forEachInSet(_inertElements, (el: HTMLElement) => {
    el.removeAttribute('inert');
  });

  const count = _getSetSize(_inertElements);
  _clearSet(_inertElements);

  return { ok: true, removed: count };
}

// Aplica aria-hidden em elementos fora do overlay
export function applyAriaHidden(overlayElement: DynObj) {
  if (!overlayElement) return { ok: false, reason: 'no-element' };

  const siblings = document.body.children;

  for (let i = 0; i < siblings.length; i++) {
    const el = siblings[i];
    if (el === overlayElement || overlayElement.contains(el)) continue;
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') continue;

    const currentValue = el.getAttribute('aria-hidden');
    if (currentValue !== 'true') {
      (el as HTMLElement).dataset.prevAriaHidden = currentValue || '';
      el.setAttribute('aria-hidden', 'true');
      _addToSet(_ariaHiddenElements, el);
    }
  }

  return { ok: true, hiddenCount: _getSetSize(_ariaHiddenElements) };
}

// Remove aria-hidden de todos os elementos
export function removeAriaHidden() {
  _forEachInSet(_ariaHiddenElements, (el: HTMLElement) => {
    const prevValue = el.dataset.prevAriaHidden;
    if (prevValue) {
      el.setAttribute('aria-hidden', prevValue);
    } else {
      el.removeAttribute('aria-hidden');
    }
    delete el.dataset.prevAriaHidden;
  });

  const count = _getSetSize(_ariaHiddenElements);
  _clearSet(_ariaHiddenElements);

  return { ok: true, restored: count };
}

// Cria focus trap dentro do overlay
export function createFocusTrap(overlayElement: DynObj, overlayId: string) {
  if (!overlayElement || _activeTrapId) {
    return { ok: false, reason: _activeTrapId ? 'trap-already-active' : 'no-element' };
  }

  _activeTrapId = overlayId;

  const focusableSelector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

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

  document.addEventListener('keydown', handleKeydown);

  _trapCleanup = () => {
    document.removeEventListener('keydown', handleKeydown);
    _activeTrapId = null;
    _trapCleanup = null;
  };

  return { ok: true, trapId: overlayId };
}

// Remove focus trap
export function removeFocusTrap(overlayId: string) {
  if (_activeTrapId !== overlayId) {
    return { ok: false, reason: 'not-active-trap' };
  }

  if (_trapCleanup) {
    _trapCleanup();
  }

  return { ok: true };
}

// Aplica toda a governança de foco para um overlay
export function engageFocusGovernance(overlayId: string, overlayElement: DynObj, options: DynObj) {
  options = options || {};
  const results = {
    focus: captureFocus(overlayId, overlayElement),
    inert: options.useInert !== false ? applyInert(overlayElement) : { ok: true, skipped: true },
    ariaHidden: options.useAriaHidden !== false ? applyAriaHidden(overlayElement) : { ok: true, skipped: true },
    focusTrap: options.useFocusTrap !== false ? createFocusTrap(overlayElement, overlayId) : { ok: true, skipped: true }
  };

  return { ok: true, results };
}

// Remove toda a governança de foco
export function disengageFocusGovernance(overlayId: string) {
  const results = {
    focusTrap: removeFocusTrap(overlayId),
    inert: removeInert(),
    ariaHidden: removeAriaHidden(),
    focus: restoreFocus(overlayId)
  };

  return { ok: true, results };
}

// Cleanup forçado de toda a governança
export function forceCleanup() {
  if (_trapCleanup) _trapCleanup();
  removeInert();
  removeAriaHidden();
  _focusStack = [];

  return { ok: true };
}

export function healthCheck() {
  const checks = {
    noOrphanInert: _getSetSize(_inertElements) === 0 || _activeTrapId !== null,
    noOrphanAriaHidden: _getSetSize(_ariaHiddenElements) === 0 || _activeTrapId !== null,
    focusStackHealthy: _focusStack.length < 10,
    trapConsistent: (_activeTrapId !== null) === (_trapCleanup !== null)
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; }
  const total = checkKeys.length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
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

export function info() {
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

export default {
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

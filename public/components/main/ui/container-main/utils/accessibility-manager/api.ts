// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Accessibility Manager - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, A11Y_FEATURES, ARIA_LIVE_REGIONS, CONTRAST_MODES, DEFAULT...
//   _instance, setInstance, getConfig, setConfig, isInitialized, setIsInitialized...
//   _log, _emit, _loadPreferences from ./helpers/index.js
//   _injectStyles, _createLiveRegion, _createSkipLinks from ./ui/index.js
//   _applyReducedMotion, _setupMediaQueries, setContrastMode, setTextScale, enabl...
//   setFocus, trapFocus, releaseFocus from ./focus/index.js
//   setAriaLabel, setAriaDescribedBy, setAriaLive, setRole, markAsLandmark from ....
//
// PROVIDES:
//   createAccessibilityManager() — exported function
//   getAccessibilityManager() — exported function
//   init() — exported function
//   destroy() — exported function
//   announce() — exported function
//   subscribe() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   setContrastMode — exported value
//   setTextScale — exported value
//   enableFeature — exported value
//   disableFeature — exported value
//   isFeatureEnabled — exported value
//   setFocus — exported value
//   trapFocus — exported value
//   releaseFocus — exported value
//   setAriaLabel — exported value
//   setAriaDescribedBy — exported value
//   setAriaLive — exported value
//   setRole — exported value
//   ... and 1 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID, A11Y_FEATURES, ARIA_LIVE_REGIONS, CONTRAST_MODES, DEFAULT_CONFIG } from './constants.js';
import {
  _instance, setInstance, getConfig, setConfig,
  isInitialized, setIsInitialized,
  getLiveRegion, setLiveRegion,
  getSkipLinksContainer, setSkipLinksContainer,
  getUserPreferences, setUserPreferences,
  _listeners, incrementMetric, getMetrics
} from './state.js';
import { _log, _emit, _loadPreferences } from './helpers/index.js';
import { _injectStyles, _createLiveRegion, _createSkipLinks } from './ui/index.js';
import { _applyReducedMotion, _setupMediaQueries, setContrastMode, setTextScale, enableFeature, disableFeature, isFeatureEnabled } from './features/index.js';
import { setFocus, trapFocus, releaseFocus } from './focus/index.js';
import { setAriaLabel, setAriaDescribedBy, setAriaLive, setRole, markAsLandmark } from './aria/index.js';

export function createAccessibilityManager(options: Record<string, unknown> = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  setUserPreferences(_loadPreferences());

  _log('info', 'Accessibility Manager created');

  return {
    init,
    destroy,
    announce,
    setFocus,
    trapFocus,
    releaseFocus,
    setContrastMode,
    getContrastMode: () => getConfig().contrastMode,
    setTextScale,
    getTextScale: () => getConfig().textScale,
    enableFeature,
    disableFeature,
    isFeatureEnabled,
    getPreferences: () => ({ ...getUserPreferences() }),
    setAriaLabel,
    setAriaDescribedBy,
    setAriaLive,
    setRole,
    markAsLandmark,
    subscribe,
    healthCheck,
    info
  };
}

export function getAccessibilityManager(options: Record<string, unknown> = {}) {
  if (!_instance) {
    setInstance(createAccessibilityManager(options));
  }
  return _instance;
}

export function init() {
  if (isInitialized()) return true;

  const config = getConfig();
  const prefs = getUserPreferences();

  _injectStyles();

  if (config.enableAriaLive) {
    _createLiveRegion();
  }

  if (config.enableSkipLinks) {
    _createSkipLinks();
  }

  _setupMediaQueries();


  if (prefs.contrastMode) {
    setContrastMode((prefs as Record<string, string>).contrastMode);
  }

  if (prefs.textScale) {
    setTextScale((prefs as Record<string, number>).textScale);
  }

  if (prefs.reducedMotion) {
    _applyReducedMotion(true);
  }

  document.documentElement.classList.add(`dsd-focus-${config.focusIndicatorStyle}`);

  setIsInitialized(true);
  _emit('initialized', {});
  _log('info', 'Initialized');

  return true;
}

export function destroy() {
  if (!isInitialized()) return true;

  const liveRegion = getLiveRegion();
  if (liveRegion) {
    liveRegion.remove();
    setLiveRegion(null);
  }

  const skipLinks = getSkipLinksContainer();
  if (skipLinks) {
    skipLinks.remove();
    setSkipLinksContainer(null);
  }

  setIsInitialized(false);
  _log('info', 'Destroyed');

  return true;
}

export function announce(message: string, priority = ARIA_LIVE_REGIONS.POLITE) {
  let liveRegion = getLiveRegion();
  if (!liveRegion) liveRegion = _createLiveRegion();

  liveRegion!.setAttribute('aria-live', priority);
  liveRegion!.textContent = '';

  setTimeout(() => {
    liveRegion!.textContent = message;
    incrementMetric('announcements');
    _emit('announced', { message, priority });
  }, 50);

  return true;
}

export function subscribe(callback: (arg: unknown) => void) {
  if (typeof callback !== 'function') return () => {};
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

export function healthCheck() {
  const config = getConfig();
  const metrics = getMetrics();

  const checks = {
    initialized: isInitialized(),
    hasLiveRegion: !!getLiveRegion(),
    hasSkipLinks: !!getSkipLinksContainer() || !config.enableSkipLinks,
    noErrors: metrics.errors === 0
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${passed}/${total}`,
    checks,
    metrics,
    preferences: getUserPreferences(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  const config = getConfig();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    features: Object.values(A11Y_FEATURES),
    contrastModes: Object.values(CONTRAST_MODES),
    ariaLiveRegions: Object.values(ARIA_LIVE_REGIONS),
    config: {
      contrastMode: config.contrastMode,
      textScale: config.textScale,
      focusIndicatorStyle: config.focusIndicatorStyle
    },
    isInitialized: isInitialized(),
    preferences: getUserPreferences()
  };
}

// Re-exports
export { setContrastMode, setTextScale, enableFeature, disableFeature, isFeatureEnabled };
export { setFocus, trapFocus, releaseFocus };
export { setAriaLabel, setAriaDescribedBy, setAriaLive, setRole, markAsLandmark };

// Main Features Barrel — Lote 9 Fix
// Static imports of all feature modules, exported as a lookup map.
// Eliminates dynamic import() calls that leak HTTP requests from the bundle.
'use strict';

import * as errorBoundary from './error-boundary/index.js';
import * as observabilityHooks from './observability-hooks/index.js';
import * as navigationHooks from './navigation-hooks/index.js';
import * as persistenceSync from './persistence-sync/index.js';
import * as uxFeedback from './ux-feedback/index.js';
import * as analyticsTracker from './analytics-tracker/index.js';
import * as preloadManager from './preload-manager/index.js';
import * as sessionSync from './session-sync/index.js';

export const MAIN_FEATURES = {
  'error-boundary': errorBoundary,
  'observability-hooks': observabilityHooks,
  'navigation-hooks': navigationHooks,
  'persistence-sync': persistenceSync,
  'ux-feedback': uxFeedback,
  'analytics-tracker': analyticsTracker,
  'preload-manager': preloadManager,
  'session-sync': sessionSync
};

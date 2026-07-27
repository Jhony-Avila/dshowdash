// Sidebar Features Barrel — Lote 7
// Static imports of all feature modules, exported as a lookup map.
// Eliminates dynamic import() calls that leak HTTP requests from the bundle.
'use strict';

import * as accessibilityLandmarks from './accessibility-landmarks.js';
import * as accordionNcs from './accordion-ncs.js';
import * as animatedTransitions from './animated-transitions.js';
import * as autoTheme from './auto-theme.js';
import * as commandPalette from './command-palette.js';
import * as compactMode from './compact-mode.js';
import * as configManager from './config-manager.js';
import * as contextMenu from './context-menu.js';
import * as debugPanel from './debug-panel.js';
import * as dynamicBadges from './dynamic-badges.js';
import * as eventSetup from './event-setup.js';
import * as favoritesHandler from './favorites-handler.js';
import * as featureFlags from './feature-flags.js';
import * as fuzzySearch from './fuzzy-search.js';
import * as highlightMatches from './highlight-matches.js';
import * as intersectionObserver from './intersection-observer.js';
import * as keyboardNavigation from './keyboard-navigation.js';
import * as keyboardShortcutsExtended from './keyboard-shortcuts-extended.js';
import * as miniMode from './mini-mode.js';
import * as mobileHandler from './mobile-handler.js';
import * as notificationDots from './notification-dots.js';
import * as parallax from './parallax.js';
import * as preloadCriticalCss from './preload-critical-css.js';
import * as resizeHandler from './resize-handler.js';
import * as routerSync from './router-sync.js';
import * as screenReader from './screen-reader.js';
import * as submenuHandler from './submenu-handler.js';
import * as themeHandler from './theme-handler.js';
import * as virtualList from './virtual-list.js';

export const SIDEBAR_FEATURES = {
  'accessibility-landmarks': accessibilityLandmarks,
  'accordion-ncs': accordionNcs,
  'animated-transitions': animatedTransitions,
  'auto-theme': autoTheme,
  'command-palette': commandPalette,
  'compact-mode': compactMode,
  'config-manager': configManager,
  'context-menu': contextMenu,
  'debug-panel': debugPanel,
  'dynamic-badges': dynamicBadges,
  'event-setup': eventSetup,
  'favorites-handler': favoritesHandler,
  'feature-flags': featureFlags,
  'fuzzy-search': fuzzySearch,
  'highlight-matches': highlightMatches,
  'intersection-observer': intersectionObserver,
  'keyboard-navigation': keyboardNavigation,
  'keyboard-shortcuts-extended': keyboardShortcutsExtended,
  'mini-mode': miniMode,
  'mobile-handler': mobileHandler,
  'notification-dots': notificationDots,
  'parallax': parallax,
  'preload-critical-css': preloadCriticalCss,
  'resize-handler': resizeHandler,
  'router-sync': routerSync,
  'screen-reader': screenReader,
  'submenu-handler': submenuHandler,
  'theme-handler': themeHandler,
  'virtual-list': virtualList
};

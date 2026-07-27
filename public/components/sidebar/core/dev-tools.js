import { VERSION } from "./constants.js";
import { getMetrics as getToggleMetrics, resetDebounce } from "../api/public-methods.js";
import SidebarRegistry from "../registry/registry.js";
import { getMetrics, info } from "./aggregators.js";
import * as Favorites from "../features/favorites-handler.js";
import * as ContextMenu from "../features/context-menu.js";
import * as AutoTheme from "../features/auto-theme.js";
import * as Submenu from "../features/submenu-handler.js";
import * as ConfigManager from "../features/config-manager.js";
import * as Parallax from "../features/parallax.js";
import * as CommandPalette from "../features/command-palette.js";
import * as FuzzySearch from "../features/fuzzy-search.js";
import * as FeatureFlags from "../features/feature-flags.js";
import * as ScreenReader from "../features/screen-reader.js";
import * as CompactMode from "../features/compact-mode.js";
import * as MiniMode from "../features/mini-mode.js";
import * as DynamicBadges from "../features/dynamic-badges.js";
import * as AccessibilityLandmarks from "../features/accessibility-landmarks.js";
import * as KeyboardShortcutsExtended from "../features/keyboard-shortcuts-extended.js";
import * as VirtualList from "../features/virtual-list.js";
import * as AnimatedTransitions from "../features/animated-transitions.js";
import * as NotificationDots from "../features/notification-dots.js";
import * as HighlightMatches from "../features/highlight-matches.js";
import * as DebugPanel from "../features/debug-panel.js";
import * as IntersectionObserverFeature from "../features/intersection-observer.js";
import * as PreloadCriticalCSS from "../features/preload-critical-css.js";
import * as ThemeHandler from "../features/theme-handler.js";
import * as ResizeHandler from "../features/resize-handler.js";
import * as AccordionNcs from "../features/accordion-ncs.js";
const DEV_VERSION = "3.0.0-P22";
const DEV_MODULE_ID = "sidebar-dev-tools";
function setupDevTools(getInstance) {
  if (typeof window === "undefined") return;
  window.__dev = window.__dev || {};
  window.__dev.sidebar = {
    getInstance: () => getInstance(),
    getRenderer: () => getInstance()?._renderer,
    getVersion: () => VERSION,
    info: () => info(getInstance()),
    getMetrics: () => getMetrics(getInstance()),
    healthCheck: () => getInstance()?.healthCheck?.(),
    getState: () => getInstance()?.getState?.(),
    getToggleMetrics: () => getToggleMetrics(),
    resetDebounce: () => resetDebounce(),
    registry: SidebarRegistry,
    features: {
      favorites: Favorites,
      contextMenu: ContextMenu,
      autoTheme: AutoTheme,
      submenu: Submenu,
      configManager: ConfigManager,
      parallax: Parallax,
      commandPalette: CommandPalette,
      fuzzySearch: FuzzySearch,
      featureFlags: FeatureFlags,
      screenReader: ScreenReader,
      compactMode: CompactMode,
      miniMode: MiniMode,
      dynamicBadges: DynamicBadges,
      accessibilityLandmarks: AccessibilityLandmarks,
      keyboardShortcutsExtended: KeyboardShortcutsExtended,
      virtualList: VirtualList,
      animatedTransitions: AnimatedTransitions,
      notificationDots: NotificationDots,
      highlightMatches: HighlightMatches,
      debugPanel: DebugPanel,
      intersectionObserver: IntersectionObserverFeature,
      preloadCriticalCSS: PreloadCriticalCSS,
      themeHandler: ThemeHandler,
      resizeHandler: ResizeHandler,
      accordionNcs: AccordionNcs
    }
  };
}
function healthCheck() {
  return { status: "HEALTHY", version: DEV_VERSION, moduleId: DEV_MODULE_ID };
}
var dev_tools_default = { setupDevTools, healthCheck, DEV_VERSION, DEV_MODULE_ID };
export {
  DEV_MODULE_ID,
  DEV_VERSION,
  dev_tools_default as default,
  healthCheck,
  setupDevTools
};

/**
 * Sidebar V4.6.0 - TypeScript Definitions
 * @version 1.0.0-ENTERPRISE
 * @description Type definitions for better DX and IDE support
 */

// ============================================
// CORE TYPES
// ============================================

/** Sidebar item configuration */
export interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  badge?: string | number;
  disabled?: boolean;
  visible?: boolean;
  children?: SidebarItem[];
  metadata?: Record<string, unknown>;
}

/** Sidebar section configuration */
export interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
  collapsed?: boolean;
  collapsible?: boolean;
  icon?: string;
}

/** Sidebar state */
export interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  activeItemId: string | null;
  expandedSections: string[];
  width: number;
  theme: 'light' | 'dark' | 'system';
}

// ============================================
// FEATURE FLAGS
// ============================================

/** Available feature flags */
export type FeatureFlagKey =
  | 'glassmorphism'
  | 'parallax'
  | 'confetti'
  | 'customCursors'
  | 'compactMode'
  | 'miniMode'
  | 'dragDrop'
  | 'fuzzySearch'
  | 'searchSuggestions'
  | 'commandPalette'
  | 'quickSwitcher'
  | 'pinnedItems'
  | 'favorites'
  | 'recentItems'
  | 'mostVisited'
  | 'timeTracking'
  | 'usageAnalytics'
  | 'voiceCommands'
  | 'autoTheme'
  | 'offlineMode'
  | 'prefetch';

/** Feature flag configuration */
export interface FeatureFlag {
  enabled: boolean;
  label: string;
  category: 'visual' | 'layout' | 'interaction' | 'search' | 'productivity' | 'organization' | 'analytics' | 'accessibility' | 'theme' | 'performance';
}

// ============================================
// BADGE TYPES
// ============================================

/** Badge type options */
export type BadgeType = 'count' | 'dot' | 'new' | 'hot' | 'live' | 'status' | 'percent' | 'time';

/** Badge variant options */
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Dynamic badge options */
export interface DynamicBadgeOptions {
  value?: number | string;
  type?: BadgeType;
  variant?: BadgeVariant;
  pulse?: boolean;
  animate?: boolean;
  tooltip?: string;
  onClick?: (itemId: string, value: number | string) => void;
}

// ============================================
// I18N TYPES
// ============================================

/** Supported locales */
export type SupportedLocale = 'pt-BR' | 'en-US' | 'es-ES';

/** Translation keys */
export type TranslationKey =
  | 'search'
  | 'searchPlaceholder'
  | 'noResults'
  | 'favorites'
  | 'recent'
  | 'mostVisited'
  | 'settings'
  | 'collapse'
  | 'expand'
  | 'miniMode'
  | 'compactMode'
  | 'darkTheme'
  | 'lightTheme'
  | 'offline'
  | 'online'
  | 'loading'
  | 'error'
  | 'retry'
  | 'close'
  | 'cancel'
  | 'confirm'
  | 'save'
  | 'delete'
  | 'edit'
  | 'add'
  | 'remove'
  | 'pin'
  | 'unpin'
  | 'voiceCommand'
  | 'listening'
  | 'commandPalette'
  | 'pressCtrlK'
  | 'navigation'
  | 'dashboard'
  | 'sections'
  | 'items'
  | 'all'
  | 'none';

// ============================================
// CACHE TYPES
// ============================================

/** Cache entry */
export interface CacheEntry<T = unknown> {
  value: T;
  cachedAt: number;
  expiresAt: number;
  accessCount: number;
}

/** Cache statistics */
export interface CacheStats {
  entries: number;
  validEntries: number;
  expiredEntries: number;
  hits: number;
  misses: number;
  hitRate: string;
  approximateSize: string;
  createdAt: number | null;
}

// ============================================
// ANALYTICS TYPES
// ============================================

/** Usage analytics for an item */
export interface ItemAnalytics {
  visits: number;
  lastVisit: number;
  avgTimeSpent: number;
  totalTimeSpent: number;
}

/** Time tracking stats */
export interface TimeTrackingStats {
  currentPanel: string | null;
  isTracking: boolean;
  totalTracked: number;
  panelCount: number;
}

// ============================================
// COMMAND PALETTE TYPES
// ============================================

/** Command palette item */
export interface CommandItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  category?: string;
  action: () => void;
}

// ============================================
// CONTEXT MENU TYPES
// ============================================

/** Context menu action */
export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
  action?: (itemId: string) => void;
}

// ============================================
// QUICK ACTION TYPES
// ============================================

/** Quick action configuration */
export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  variant?: 'default' | 'danger' | 'success' | 'warning';
}

// ============================================
// HEALTH CHECK TYPES
// ============================================

/** Health check status */
export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

/** Health check result */
export interface HealthCheckResult {
  status: HealthStatus;
  version: string;
  moduleId: string;
  checks?: Record<string, unknown>;
  timestamp?: number;
}

// ============================================
// EVENT TYPES
// ============================================

/** Sidebar events */
export interface SidebarEvents {
  'sidebar:collapsed': { collapsed: boolean };
  'sidebar:expanded': { expanded: boolean };
  'sidebar:item-clicked': { itemId: string; item: SidebarItem };
  'sidebar:section-toggled': { sectionId: string; expanded: boolean };
  'sidebar:theme-changed': { theme: string };
  'sidebar:search': { query: string; results: number };
  'sidebar:favorite-added': { itemId: string };
  'sidebar:favorite-removed': { itemId: string };
  'sidebar:badge-updated': { itemId: string; value: number | string };
  'sidebar:locale-changed': { locale: SupportedLocale };
  'sidebar:voice-started': {};
  'sidebar:voice-ended': {};
  'sidebar:offline': {};
  'sidebar:online': {};
}

// ============================================
// MAIN SIDEBAR INTERFACE
// ============================================

/** Main Sidebar API */
export interface SidebarAPI {
  // Core
  createSidebar(): void;
  getSidebar(): unknown;
  destroySidebar(): void;
  toggle(): void;
  collapse(): void;
  expand(): void;
  forceSync(): void;
  healthCheck(): HealthCheckResult;
  info(): Record<string, unknown>;
  getState(): SidebarState;
  
  // Navigation
  setActiveItem(id: string): void;
  navigate(id: string): void;
  refresh(): void;
  
  // Theme
  setTheme(theme: 'light' | 'dark' | 'system'): void;
  getTheme(): string;
  toggleTheme(): void;
  
  // Layout Modes
  enableMiniMode(): void;
  disableMiniMode(): void;
  toggleMiniMode(): void;
  enableCompactMode(): void;
  disableCompactMode(): void;
  toggleCompactMode(): void;
  
  // Badges
  setBadge(itemId: string, badge: string | number): void;
  getBadge(itemId: string): string | number | null;
  removeBadge(itemId: string): void;
  setDynamicBadge(itemId: string, options: DynamicBadgeOptions): void;
  incrementBadge(itemId: string, amount?: number): number;
  decrementBadge(itemId: string, amount?: number): number;
  
  // Favorites
  addFavorite(itemId: string): void;
  removeFavorite(itemId: string): void;
  toggleFavorite(itemId: string): boolean;
  isFavorite(itemId: string): boolean;
  getFavorites(): string[];
  
  // Search
  search(query: string): void;
  clearSearch(): void;
  fuzzySearch(query: string): void;
  
  // i18n
  t(key: TranslationKey, fallback?: string): string;
  translate(key: TranslationKey, params?: Record<string, string>, fallback?: string): string;
  setLocale(locale: SupportedLocale): boolean;
  getLocale(): SupportedLocale;
  getAvailableLocales(): SupportedLocale[];
  
  // Feature Flags
  isFeatureEnabled(key: FeatureFlagKey): boolean;
  enableFeature(key: FeatureFlagKey): void;
  disableFeature(key: FeatureFlagKey): void;
  toggleFeature(key: FeatureFlagKey): boolean;
  
  // Voice Commands
  isVoiceSupported(): boolean;
  startVoice(): boolean;
  stopVoice(): boolean;
  toggleVoice(): boolean;
  
  // Accessibility
  announce(message: string, priority?: 'polite' | 'assertive'): void;
  enableHighContrast(): void;
  disableHighContrast(): void;
  enableLargeText(): void;
  disableLargeText(): void;
  
  // Config
  config: {
    legacyWarnings: boolean;
    setLegacyWarnings(enabled: boolean): void;
    getDeprecationReport(): unknown;
    getFeatureContracts(): Record<string, unknown>;
    listFeatures(): string[];
    [key: string]: any;
  };

  // Metrics
  getMetrics(): Record<string, unknown>;

  // Sections (extended API)
  toggleSection?(id: string): void;
  expandSection?(id: string): void;
  collapseSection?(id: string): void;
  expandAllSections?(): void;
  collapseAllSections?(): void;
  getExpandedSections?(): string[];

  // Mobile (extended API)
  openMobile?(): void;
  closeMobile?(): void;
  toggleMobile?(): void;

  // Persistence (extended API)
  checkPersistenceSync?(): unknown;
  forcePersistenceSync?(): unknown;

  // Feature access
  feature?(featureName: string): unknown;

  // Sub-objects (extended API)
  kernel?: Record<string, (...args: any[]) => any>;
  metrics?: Record<string, (...args: any[]) => any>;
  registry?: Record<string, (...args: any[]) => any>;

  // Skeleton / Loading (extended API)
  showSkeleton?(count?: number): void;
  hideSkeleton?(): void;
  setLoading?(loading: boolean): void;
  animateIn?(): void;

  // API meta (extended)
  getAPIMetrics?(): Record<string, unknown>;
  getAPIInfo?(): Record<string, unknown>;
  getAPIHealthCheck?(): Record<string, unknown>;
  getProxyMetrics?(): Record<string, unknown>;
  CAPABILITIES?: Record<string, unknown>;
  API_VERSION?: string;

  // Meta
  VERSION: string;
  MODULE_ID: string;
  TOTAL_FEATURES: number;
}

// Global declaration
declare global {
  interface Window {
    Sidebar: SidebarAPI;
    __dev?: {
      sidebar?: {
        getInstance(): unknown;
        getRenderer(): unknown;
        getVersion(): string;
        info(): Record<string, unknown>;
        healthCheck(): HealthCheckResult;
        features: Record<string, unknown>;
      };
    };
  }
}

export {};
